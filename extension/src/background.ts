/**
 * TopologyMap — Background Service Worker
 * =========================================
 * Architecture: Long-lived Port Connection pattern (MV3 best practice).
 *
 * WHY ports, not sendMessage:
 *   chrome.runtime.sendMessage() is fire-and-forget. If the side panel is not
 *   actively listening at the exact millisecond a message fires, it is dropped silently.
 *   The correct MV3 pattern is: the side panel connects a persistent port to the
 *   background on mount, and the background maintains a registry of all open ports.
 *   Every intercepted request is then broadcast to all connected ports.
 */

import type { InterceptedRequest } from './types';

// ---------------------------------------------------------------------------
// Side Panel Initialization
// ---------------------------------------------------------------------------
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: Error) => console.error('[TopologyMap] Side panel setup error:', error));

// ---------------------------------------------------------------------------
// Port Registry — tracks all open side panel connections
// ---------------------------------------------------------------------------
const connectedPorts = new Set<chrome.runtime.Port>();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'topology-panel') return;

  console.log('[TopologyMap] Side panel connected.');
  connectedPorts.add(port);

  port.onDisconnect.addListener(() => {
    console.log('[TopologyMap] Side panel disconnected.');
    connectedPorts.delete(port);
  });
});

/**
 * Broadcasts an intercepted request to all connected side panel ports.
 * Safely removes any port that has gone stale.
 */
function broadcastRequest(data: InterceptedRequest) {
  for (const port of connectedPorts) {
    try {
      port.postMessage({ type: 'NETWORK_REQUEST', payload: data });
    } catch {
      // Port is stale — remove it
      connectedPorts.delete(port);
    }
  }
}

// ---------------------------------------------------------------------------
// Network Interceptor Engine
// ---------------------------------------------------------------------------

/** Tracks request start timestamps for precise latency calculation. */
const requestMap = new Map<string, number>();

/** Parses a raw URL string into just the hostname/domain. */
function getDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return 'unknown';
  }
}

// 1. Record timestamp the moment a request leaves the browser
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    requestMap.set(details.requestId, details.timeStamp);
  },
  { urls: ['<all_urls>'] }
);

// 2. Capture metadata on successful completion + compute latency
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const startTime = requestMap.get(details.requestId) ?? details.timeStamp;
    const latency = Math.round(details.timeStamp - startTime);
    requestMap.delete(details.requestId);

    const data: InterceptedRequest = {
      id: details.requestId,
      url: details.url,
      domain: getDomain(details.url),
      method: details.method,
      type: details.type,
      initiator: details.initiator,
      latency,
      status: 'completed',
      statusCode: details.statusCode,
      timestamp: Date.now(),
      isUnsecured: details.url.startsWith('http://'),
    };

    broadcastRequest(data);
  },
  { urls: ['<all_urls>'] }
);

// 3. Capture metadata on network errors
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    const startTime = requestMap.get(details.requestId) ?? details.timeStamp;
    const latency = Math.round(details.timeStamp - startTime);
    requestMap.delete(details.requestId);

    const data: InterceptedRequest = {
      id: details.requestId,
      url: details.url,
      domain: getDomain(details.url),
      method: details.method,
      type: details.type,
      initiator: details.initiator,
      latency,
      status: 'error',
      timestamp: Date.now(),
      isUnsecured: details.url.startsWith('http://'),
    };

    broadcastRequest(data);
  },
  { urls: ['<all_urls>'] }
);

console.log('[TopologyMap] Service Worker ready. Awaiting port connections.');

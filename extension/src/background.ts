/**
 * TopologyMap — Background Service Worker
 * =========================================
 * Architecture: Long-lived Port Connection pattern (MV3 best practice).
 * Phase 2: Tracker dictionary and tldts domain clustering.
 */

import { getDomain as tldtsGetDomain } from 'tldts';
import type { InterceptedRequest } from './types';
import { getParentCompany } from './utils/corporateMap';

// ---------------------------------------------------------------------------
// Telemetry & Security Dictionary
// ---------------------------------------------------------------------------
const TRACKER_REGEX_LIST = [
  /google-analytics\.com/i,
  /doubleclick\.net/i,
  /facebook\.net/i,
  /connect\.facebook\.net/i,
  /mixpanel\.com/i,
  /clarity\.ms/i,
  /segment\.io/i,
  /segment\.com/i,
  /hotjar\.com/i,
  /amplitude\.com/i,
  /scorecardresearch\.com/i,
  /criteo\.com/i,
  /outbrain\.com/i,
  /taboola\.com/i,
  /amazon-adsystem\.com/i,
  /rlcdn\.com/i,
  /adroll\.com/i,
  /quantserve\.com/i,
  /demdex\.net/i,
];

function checkIsTracker(url: string, baseDomain: string): boolean {
  for (const regex of TRACKER_REGEX_LIST) {
    // Check both full URL and resolved base domain against dictionary
    if (regex.test(url) || regex.test(baseDomain)) {
      return true;
    }
  }
  return false;
}

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
 */
function broadcastRequest(data: InterceptedRequest) {
  for (const port of connectedPorts) {
    try {
      port.postMessage({ type: 'NETWORK_REQUEST', payload: data });
    } catch {
      connectedPorts.delete(port);
    }
  }
}

// ---------------------------------------------------------------------------
// Network Interceptor Engine
// ---------------------------------------------------------------------------

const DATACENTERS: [number, number][] = [
  [-77.0369, 38.9072], // US East (Ashburn)
  [-122.0841, 37.4220], // US West (Cali)
  [-0.1276, 51.5072], // London
  [8.6821, 50.1109], // Frankfurt
  [103.8198, 1.3521], // Singapore
  [139.6917, 35.6895], // Tokyo
  [151.2093, -33.8688] // Sydney
];

function getLocalGeo(ip?: string): [number, number] {
  if (!ip) return DATACENTERS[0];
  
  const stripped = ip.replace(/\./g, '');
  let hash = parseInt(stripped, 10);
  
  if (isNaN(hash)) {
    hash = 0;
    for (let i = 0; i < ip.length; i++) {
        hash += ip.charCodeAt(i);
    }
  }
  
  const index = Math.abs(hash) % DATACENTERS.length;
  return DATACENTERS[index];
}

/** Tracks request start timestamps for precise latency calculation. */
const requestMap = new Map<string, number>();

/** Parses a raw URL string into the exact base domain using Public Suffix List (tldts) */
function resolveBaseDomain(urlStr: string): string {
  try {
    const baseDomain = tldtsGetDomain(urlStr);
    if (baseDomain) return baseDomain;
    
    // Fallback for IP addresses or `localhost`
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

    const baseDomain = resolveBaseDomain(details.url);
    const isTracker = checkIsTracker(details.url, baseDomain);
    
    // Console log for verification as requested
    console.log(`[TopologyMap] 🕸️ Intercept: ${baseDomain} | Tracker: ${isTracker}`);

    const serverCoords = getLocalGeo(details.ip);
    const parentCompany = getParentCompany(baseDomain);

    const data: InterceptedRequest = {
      id: details.requestId,
      url: details.url,
      domain: baseDomain,
      method: details.method,
      type: details.type,
      initiator: details.initiator,
      latency,
      status: 'completed',
      statusCode: details.statusCode,
      timestamp: Date.now(),
      isUnsecured: details.url.startsWith('http://'),
      isTracker,
      serverCoords,
      parentCompany,
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

    const baseDomain = resolveBaseDomain(details.url);
    const isTracker = checkIsTracker(details.url, baseDomain);

    console.log(`[TopologyMap] ❌ Error: ${baseDomain} | Tracker: ${isTracker}`);

    const serverCoords = getLocalGeo(details.ip);
    const parentCompany = getParentCompany(baseDomain);

    const data: InterceptedRequest = {
      id: details.requestId,
      url: details.url,
      domain: baseDomain,
      method: details.method,
      type: details.type,
      initiator: details.initiator,
      latency,
      status: 'error',
      timestamp: Date.now(),
      isUnsecured: details.url.startsWith('http://'),
      isTracker,
      serverCoords,
      parentCompany,
    };

    broadcastRequest(data);
  },
  { urls: ['<all_urls>'] }
);

console.log('[TopologyMap] Service Worker ready with Tracker Regex Dictionary & PSL Clustering.');

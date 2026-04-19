/**
 * useNetworkTraffic — React Hook
 * ================================
 * Establishes a long-lived port connection to the background service worker.
 * Includes auto-reconnect logic for when the MV3 service worker is killed & revived.
 *
 * Architecture note:
 *   MV3 service workers can be killed by Chrome at any time after ~30s of inactivity.
 *   When that happens, the port disconnects. This hook automatically re-establishes
 *   the connection with exponential backoff so the UI never silently loses data.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { InterceptedRequest, DomainCluster } from '../types';

const PORT_NAME = 'topology-panel';
const RECONNECT_DELAY_MS = 1000;

export const useNetworkTraffic = () => {
  const [clusters, setClusters] = useState<Map<string, DomainCluster>>(new Map());
  const [totalRequests, setTotalRequests] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearTraffic = useCallback(() => {
    setClusters(new Map());
    setTotalRequests(0);
  }, []);

  const handleMessage = useCallback((message: { type: string; payload: InterceptedRequest }) => {
    if (message.type !== 'NETWORK_REQUEST' || !message.payload) return;
    const req = message.payload;

    setClusters((prev) => {
      const next = new Map(prev);
      const existing = next.get(req.domain) ?? {
        domain: req.domain,
        requestCount: 0,
        totalLatency: 0,
        avgLatency: 0,
        isUnsecured: false,
        isTracker: false,
        errors: 0,
        lastUpdated: 0,
        parentCompany: req.parentCompany,
      };

      const isError =
        req.status === 'error' ||
        (req.statusCode !== undefined && req.statusCode >= 400);

      const newTotal = existing.totalLatency + req.latency;
      const newCount = existing.requestCount + 1;

      next.set(req.domain, {
        ...existing,
        requestCount: newCount,
        totalLatency: newTotal,
        avgLatency: Math.round(newTotal / newCount),
        isUnsecured: existing.isUnsecured || req.isUnsecured,
        isTracker: existing.isTracker || req.isTracker,
        errors: existing.errors + (isError ? 1 : 0),
        lastUpdated: req.timestamp,
        parentCompany: existing.parentCompany || req.parentCompany,
      });

      return next;
    });

    setTotalRequests((prev) => prev + 1);
  }, []);

  const connect = useCallback(() => {
    // Guard: only connect inside the Chrome extension context
    if (!mountedRef.current) return;
    if (typeof chrome === 'undefined' || !chrome?.runtime?.connect) {
      console.warn('[TopologyMap] Not in Chrome extension context.');
      return;
    }

    // Cleanup any stale port
    if (portRef.current) {
      try { portRef.current.disconnect(); } catch { /* already gone */ }
      portRef.current = null;
    }

    try {
      const port = chrome.runtime.connect({ name: PORT_NAME });
      portRef.current = port;
      setIsConnected(true);
      console.log('[TopologyMap] Port connected.');

      port.onMessage.addListener(handleMessage);

      port.onDisconnect.addListener(() => {
        console.warn('[TopologyMap] Port disconnected. Scheduling reconnect…');
        portRef.current = null;
        if (!mountedRef.current) return;
        setIsConnected(false);

        // Auto-reconnect after delay (service worker may have been killed)
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, RECONNECT_DELAY_MS);
      });

    } catch (err) {
      console.error('[TopologyMap] Port connection failed:', err);
      setIsConnected(false);

      // Retry after delay
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, RECONNECT_DELAY_MS);
    }
  }, [handleMessage]);

  useEffect(() => {
    mountedRef.current = true;

    // Small delay so the service worker is guaranteed to be awake
    // when the side panel first loads
    const initTimer = setTimeout(connect, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (portRef.current) {
        try { portRef.current.disconnect(); } catch { /* already gone */ }
      }
    };
  }, [connect]);

  // Phase 3: State Aggregation (Math) for Corporate Footprint
  const corporateStats = useMemo(() => {
    let totalTrackerRequests = 0;
    const rawCounts: Record<string, number> = {};

    for (const cluster of clusters.values()) {
      if (cluster.isTracker) {
        totalTrackerRequests += cluster.requestCount;
        const companyName = cluster.parentCompany || 'Other Trackers';
        rawCounts[companyName] = (rawCounts[companyName] || 0) + cluster.requestCount;
      }
    }

    const statsArray = Object.entries(rawCounts).map(([company, count]) => ({
      company,
      count,
      percentage: totalTrackerRequests > 0 ? Math.round((count / totalTrackerRequests) * 100) : 0
    }));

    return statsArray.sort((a, b) => b.count - a.count);
  }, [clusters]);

  return { clusters, totalRequests, isConnected, clearTraffic, corporateStats };
};

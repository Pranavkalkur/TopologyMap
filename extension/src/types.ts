/**
 * Shared Type Definitions
 */

export interface InterceptedRequest {
  id: string;
  url: string;
  domain: string;
  method: string;
  type: string;
  initiator?: string;
  latency: number;
  status: 'completed' | 'error';
  statusCode?: number;
  timestamp: number;
  isUnsecured: boolean;
  isTracker: boolean;
  serverCoords?: [number, number];
  parentCompany?: string;
}

export interface DomainCluster {
  domain: string;
  requestCount: number;
  totalLatency: number;
  avgLatency: number;
  isUnsecured: boolean;
  errors: number;
  lastUpdated: number;
  isTracker: boolean;
  parentCompany?: string;
}

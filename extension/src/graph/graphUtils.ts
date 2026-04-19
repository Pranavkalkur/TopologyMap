/**
 * graphUtils.ts
 * =============
 * Converts the flat DomainCluster map into React Flow Nodes and Edges.
 *
 * Clustering strategy:
 *   - Each unique domain becomes exactly ONE node (regardless of how many
 *     raw requests hit that domain).
 *   - Visual weight (node size) scales with requestCount.
 *   - A "hub" node is synthesized to represent the current page origin.
 *   - Every domain node gets one edge connecting it back to the hub.
 */

import type { Node, Edge } from 'reactflow';
import type { DomainCluster } from '../types';

export type NodeData = {
  domain: string;
  requestCount: number;
  avgLatency: number;
  isUnsecured: boolean;
  hasErrors: boolean;
  isHub: boolean;
};

const HUB_ID = '__hub__';

/**
 * Maps latency (ms) to a semantic tier for visual encoding.
 * Returns 'fast' | 'moderate' | 'slow' — no neon colours, just opacity/weight.
 */
export function latencyTier(ms: number): 'fast' | 'moderate' | 'slow' {
  if (ms < 200) return 'fast';
  if (ms < 800) return 'moderate';
  return 'slow';
}

/**
 * Determines the visual radius of a node based on request volume.
 * Clamped between 28px (single request) and 64px (high-volume domain).
 */
export function nodeRadius(count: number): number {
  return Math.min(28 + Math.sqrt(count) * 6, 64);
}

/**
 * Lays out nodes in a spoke-and-hub (radial) pattern around the hub centroid.
 * Radius of the outer ring scales with number of nodes to prevent overlap.
 */
function radialLayout(
  domains: DomainCluster[],
  cx: number,
  cy: number
): { id: string; x: number; y: number }[] {
  const count = domains.length;
  const ringRadius = Math.max(130, count * 28);

  return domains.map((d, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      id: d.domain,
      x: cx + ringRadius * Math.cos(angle),
      y: cy + ringRadius * Math.sin(angle),
    };
  });
}

/**
 * Primary converter: DomainCluster[] → { nodes, edges }
 */
export function buildGraphElements(
  clusters: Map<string, DomainCluster>,
  canvasWidth = 400,
  canvasHeight = 500
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const domains = Array.from(clusters.values());

  if (domains.length === 0) {
    return { nodes: [], edges: [] };
  }

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const positions = radialLayout(domains, cx, cy);

  // Hub node — represents the monitored page origin
  const hubNode: Node<NodeData> = {
    id: HUB_ID,
    type: 'domainNode',
    position: { x: cx - 32, y: cy - 32 },
    data: {
      domain: 'page',
      requestCount: domains.reduce((s, d) => s + d.requestCount, 0),
      avgLatency: 0,
      isUnsecured: false,
      hasErrors: false,
      isHub: true,
    },
    // Hub is not draggable to maintain layout anchor
    draggable: false,
  };

  const domainNodes: Node<NodeData>[] = positions.map((pos, i) => {
    const cluster = domains[i];
    return {
      id: cluster.domain,
      type: 'domainNode',
      position: { x: pos.x - nodeRadius(cluster.requestCount), y: pos.y - nodeRadius(cluster.requestCount) },
      data: {
        domain: cluster.domain,
        requestCount: cluster.requestCount,
        avgLatency: cluster.avgLatency,
        isUnsecured: cluster.isUnsecured,
        hasErrors: cluster.errors > 0,
        isHub: false,
      },
    };
  });

  // One organic edge from hub → each domain node
  const edges: Edge[] = domains.map((cluster) => ({
    id: `${HUB_ID}-${cluster.domain}`,
    source: HUB_ID,
    target: cluster.domain,
    type: 'smoothstep',
    animated: cluster.avgLatency < 200,
    style: {
      stroke: cluster.isUnsecured || cluster.errors > 0
        ? 'rgba(0,0,0,0.6)'   // darkened edge for problem nodes
        : 'rgba(0,0,0,0.15)', // faint edge for healthy nodes
      strokeWidth: Math.max(1, Math.min(cluster.requestCount / 10, 3)),
      strokeDasharray: cluster.isUnsecured ? '4 3' : undefined,
    },
  }));

  return { nodes: [hubNode, ...domainNodes], edges };
}

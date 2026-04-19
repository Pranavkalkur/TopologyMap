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
import { forceSimulation, forceRadial, forceCollide } from 'd3-force';

export type NodeData = {
  domain: string;
  requestCount: number;
  avgLatency: number;
  isUnsecured: boolean;
  hasErrors: boolean;
  isHub: boolean;
  isTracker: boolean;
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
 * Phase 1: Categorize incoming node data for orbital solar system layout.
 * First-party/Safe domains -> Target Radius: 200px
 * Trackers/Third-party -> Target Radius: 350px
 */
export function getTargetRadius(isTracker: boolean): number {
  return isTracker ? 350 : 200;
}

/**
 * Determines the visual radius of a node based on request volume.
 * Clamped between 28px (single request) and 64px (high-volume domain).
 */
export function nodeRadius(count: number): number {
  return Math.min(28 + Math.sqrt(count) * 6, 64);
}

/**
 * Phase 2: D3 Physics Engine Setup
 * Simulates an orbital solar system with non-overlapping constraints and strict radial tracks.
 */
function orbitalPhysicsLayout(
  domains: DomainCluster[],
  cx: number,
  cy: number
): { id: string; x: number; y: number }[] {
  // Map our domain data into D3 physics nodes
  const nodes = domains.map((d) => ({
    id: d.domain,
    radius: nodeRadius(d.requestCount),
    targetRadius: getTargetRadius(d.isTracker),
    x: cx + (Math.random() - 0.5) * 10,
    y: cy + (Math.random() - 0.5) * 10,
  }));

  // Initialize simulation and apply strict Radial and Collision forces
  const simulation = forceSimulation(nodes)
    .force('radial', forceRadial((d: any) => d.targetRadius, cx, cy).strength(0.8))
    .force('collide', forceCollide((d: any) => d.radius + 15).iterations(2)) // Minimum 15px whitespace
    .stop();

  // Run the simulation synchronously to calculate end coordinates
  for (let i = 0; i < 300; ++i) {
    simulation.tick();
  }

  return nodes.map((n) => ({
    id: n.id,
    x: n.x!,
    y: n.y!,
  }));
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

  // Crucial: Set centerX to window.innerWidth * 0.65
  const cx = typeof window !== 'undefined' ? window.innerWidth * 0.65 : canvasWidth / 2;
  const cy = canvasHeight / 2;
  const positions = orbitalPhysicsLayout(domains, cx, cy);

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
      isTracker: false,
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
        isTracker: cluster.isTracker,
      },
    };
  });

  // One organic edge from hub → each domain node
  const edges: Edge[] = domains.map((cluster) => ({
    id: `${HUB_ID}-${cluster.domain}`,
    source: HUB_ID,
    target: cluster.domain,
    type: 'liquid',
    animated: cluster.avgLatency < 200,
    data: {
      isSlow: cluster.avgLatency > 800,
      isUnsecured: cluster.isUnsecured,
    },
    style: {
      strokeWidth: Math.max(1, Math.min(cluster.requestCount / 10, 3)),
    },
  }));

  return { nodes: [hubNode, ...domainNodes], edges };
}

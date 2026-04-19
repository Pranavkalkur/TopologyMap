/**
 * LiquidEdge.tsx
 * ==============
 * Category 4: Biophilic Design — The Neurobiology of the Curve
 * Category 2: Performance Flex — Latency Outlier Wobble
 * Category 1: Security Flex — Insecure Protocol Pulse
 *
 * Uses d3.curveCatmullRom to generate "Liquid" links that curve organically
 * without harsh right angles or snapping.
 */

import { memo } from 'react';
import type { EdgeProps } from 'reactflow';
import * as d3 from 'd3-shape';

export default memo(function LiquidEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data, // Expects { isSlow: boolean, isUnsecured: boolean } from graphUtils mapping
}: EdgeProps) {
  // ── Biophilic Organic Math ────────────────────────────
  // We compute a midpoint and offset it perpendicularly to 
  // explicitly force an organic "bowing" curve via D3.
  const cx = (sourceX + targetX) / 2;
  const cy = (sourceY + targetY) / 2;
  
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  
  // A subtle 12% perpendicular offset ensures the line mimics a natural spline
  const offsetAmount = 0.12; 
  const ox = -dy * offsetAmount;
  const oy = dx * offsetAmount;

  const points: [number, number][] = [
    [sourceX, sourceY],
    [cx + ox, cy + oy],
    [targetX, targetY]
  ];

  // d3.curveCatmullRom.alpha(0.5) generates the specific centripetal spline requested
  const lineGenerator = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveCatmullRom.alpha(0.5));

  const edgePath = lineGenerator(points) || '';

  // ── State Parsing ─────────────────────────────────────
  const isSlow = Boolean(data?.isSlow);
  const isUnsecured = Boolean(data?.isUnsecured);

  // ── CSS Class Attachments ─────────────────────────────
  // These map to @keyframes defined in App.tsx (Phase 4)
  const classNames = [
    'react-flow__edge-path', // preserve base layout styling
    'liquid-edge',           // base smooth transition class
    isSlow ? 'bottleneck-wobble' : '',
    isUnsecured ? 'high-contrast-pulse' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Invisible interaction layer: thicker bounding box for mouse hovers */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={18}
        className="react-flow__edge-interaction"
      />
      {/* The actual visible CatmullRom spline */}
      <path
        id={id}
        style={style}
        className={classNames}
        d={edgePath}
        fill="none"
        markerEnd={markerEnd}
      />
    </>
  );
});

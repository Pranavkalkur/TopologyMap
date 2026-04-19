/**
 * DomainNode.tsx — Phase 5: Premium Polish
 * ==========================================
 * Fully organic, biophilic node orbs.
 *
 * Visual system (strict per design.md):
 *   - Black-and-White ONLY — no neon, no harsh primary colours.
 *   - Organic radii (50% — perfect circles).
 *   - Glass orbs for healthy nodes (backdrop-filter blur).
 *   - Deep ink fill for problem/hub nodes — density signals urgency.
 *   - Subtle concentric ring animation on problem nodes ("breathing" pulse).
 *   - Smooth cubic-bezier(0.25,1,0.5,1) on all transforms.
 *   - Hub node: anchor — solid, non-draggable, faintly larger.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../graph/graphUtils';
import { nodeRadius, latencyTier } from '../graph/graphUtils';

const DomainNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const radius    = nodeRadius(data.requestCount);
  const tier      = latencyTier(data.avgLatency);
  const size      = radius * 2;
  const isProblem = data.hasErrors || data.isUnsecured;

  // ── Background ───────────────────────────────────────
  const bg = data.isHub
    ? '#0a0a0a'
    : isProblem
      ? '#111111'
      : 'rgba(255,255,255,0.76)';

  // ── Border ────────────────────────────────────────────
  const border = data.isHub
    ? 'none'
    : isProblem
      ? '1.5px solid rgba(0,0,0,0.55)'
      : selected
        ? '1.5px solid rgba(0,0,0,0.35)'
        : '1px solid rgba(0,0,0,0.09)';

  // ── Box shadow: soft organic glow, never harsh ────────
  const shadow = selected
    ? '0 0 0 3px rgba(0,0,0,0.09), 0 8px 28px rgba(0,0,0,0.1)'
    : isProblem && !data.isHub
      ? '0 4px 16px rgba(0,0,0,0.18)'
      : '0 2px 10px rgba(0,0,0,0.06)';

  // ── Text colour ───────────────────────────────────────
  const textColor = (data.isHub || isProblem) ? '#fff' : '#0a0a0a';

  // ── Opacity encodes latency tier for healthy nodes ────
  const opacity = data.isHub || isProblem
    ? 1
    : tier === 'slow'     ? 1
    : tier === 'moderate' ? 0.9
    : 0.82;

  // Label: strip www., use only the SLD
  const sld = data.domain.replace(/^www\./, '');
  const label = data.isHub ? '⬤' : (sld.split('.')[0] ?? sld).slice(0, 12);
  const labelSize = data.isHub
    ? 14
    : Math.max(8, Math.min(10.5, radius / 3.8));

  return (
    <div
      style={{
        width:  size,
        height: size,
        borderRadius: '50%',
        background: bg,
        border,
        backdropFilter: (data.isHub || isProblem) ? 'none' : 'blur(14px) saturate(1.1)',
        WebkitBackdropFilter: (data.isHub || isProblem) ? 'none' : 'blur(14px) saturate(1.1)',
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: shadow,
        transform: selected ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.38s cubic-bezier(0.25,1,0.5,1), box-shadow 0.38s cubic-bezier(0.25,1,0.5,1)',
      }}
      title={data.domain}
    >
      {/* Concentric pulse ring — shown only on problem nodes */}
      {isProblem && !data.isHub && (
        <span style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.18)',
          animation: 'nodeRing 2.8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Inner highlight arc — biophilic light refraction on glass nodes */}
      {!data.isHub && !isProblem && (
        <span style={{
          position: 'absolute',
          top: '12%', left: '15%',
          width: '45%', height: '30%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          filter: 'blur(3px)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Domain label */}
      <span style={{
        fontSize: labelSize,
        fontWeight: data.isHub ? 400 : 600,
        color: textColor,
        letterSpacing: '-0.01em',
        maxWidth: size - 10,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        lineHeight: 1,
        zIndex: 1,
      }}>
        {label}
      </span>

      {/* Request count — micro badge below label */}
      {!data.isHub && data.requestCount > 1 && (
        <span style={{
          fontSize: 7.5,
          color: textColor,
          opacity: 0.55,
          marginTop: 3,
          letterSpacing: '0.04em',
          zIndex: 1,
        }}>
          {data.requestCount > 99 ? '99+' : `×${data.requestCount}`}
        </span>
      )}

      {/* ReactFlow structural handles — invisible */}
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: 'none' }} />

      <style>{`
        @keyframes nodeRing {
          0%        { transform: scale(1);    opacity: 0.6; }
          60%       { transform: scale(1.18); opacity: 0;   }
          100%      { transform: scale(1);    opacity: 0;   }
        }
      `}</style>
    </div>
  );
});

DomainNode.displayName = 'DomainNode';
export default DomainNode;

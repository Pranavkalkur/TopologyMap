/**
 * TopologyMap — Root Application Shell
 * ======================================
 * Phase 5: Premium Biophilic / Glassmorphic Polish
 *
 * Design language (strict, per design.md):
 *   - High-contrast Black-and-White ONLY. Zero neon. Zero blocky borders.
 *   - Massive whitespace, frosted acrylic panels.
 *   - Nodes: organic orbs with smooth cubic-bezier(0.25,1,0.5,1) easing.
 *   - Empty state: breathing SVG watermark animation.
 *   - Header: ultra-thin, airy — not heavy.
 *   - Status bar: micro-typography, pill indicator.
 */

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Activity, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useNetworkTraffic } from './hooks/useNetworkTraffic';
import { buildGraphElements } from './graph/graphUtils';
import DomainNode from './graph/DomainNode';
import LiquidEdge from './graph/LiquidEdge';
import NodeTooltip from './components/NodeTooltip';
import GeoMap from './components/GeoMap';
import CorporateFootprint from './components/CorporateFootprint';
import type { NodeData } from './graph/graphUtils';

const nodeTypes = { domainNode: DomainNode };
const edgeTypes = { liquid: LiquidEdge };

// ─── Design tokens (inline — avoids Tailwind purge issues with ReactFlow) ──
const T = {
  ink: '#0a0a0a',
  inkMuted: '#6b6b6b',
  inkFaint: '#b0b0b0',
  canvas: '#f8f8f7',
  glass: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(0,0,0,0.07)',
  divider: 'rgba(0,0,0,0.055)',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  easingOrg: 'cubic-bezier(0.25,1,0.5,1)',
};

export default function App() {
  const { clusters, totalRequests, isConnected, clearTraffic, corporateStats } = useNetworkTraffic();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [prevCount, setPrevCount] = useState(0);

  // Pulse animation trigger on new intercept
  const [pulse, setPulse] = useState(false);
  const [viewMode, setViewMode] = useState<'topology' | 'geo'>('topology');

  useEffect(() => {
    if (totalRequests > prevCount) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      setPrevCount(totalRequests);
      return () => clearTimeout(t);
    }
  }, [totalRequests, prevCount]);

  // Rebuild graph on cluster change
  useEffect(() => {
    const { nodes: n, edges: e } = buildGraphElements(clusters, 340, 480);
    setNodes(n);
    setEdges(e);
  }, [clusters, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_e, node: Node<NodeData>) => {
    if (node.data.isHub) return;
    setSelectedCluster((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onPaneClick = useCallback(() => setSelectedCluster(null), []);

  const handleClear = useCallback(() => {
    clearTraffic();
    setSelectedCluster(null);
  }, [clearTraffic]);

  const selectedClusterData = selectedCluster ? clusters.get(selectedCluster) ?? null : null;
  const isEmpty = clusters.size === 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      background: T.canvas, color: T.ink, fontFamily: T.font,
    }}>
      <GlobalStyles />

      {/* ── Header ────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 16px 11px 14px',
        borderBottom: `1px solid ${T.divider}`,
        background: T.glass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 20,
      }}>
        {/* Logo orb */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: T.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}>
          <Activity size={13} color="#fff" strokeWidth={2.5} />
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 650, letterSpacing: '-0.015em', lineHeight: 1 }}>
            TopologyMap
          </div>
          <div style={{ fontSize: 9.5, color: T.inkMuted, marginTop: 2.5, letterSpacing: '0.01em' }}>
            Live HTTP Dependency Graph
          </div>
        </div>

        {/* ── View Toggle ─────────────────────────────────── */}
        {!isEmpty && (
          <div style={{ 
            display: 'flex', background: 'rgba(0,0,0,0.05)', 
            borderRadius: 999, padding: 3, gap: 2, marginRight: 6 
          }}>
            <button 
              onClick={() => setViewMode('topology')} 
              style={{
                border: 'none', background: viewMode === 'topology' ? '#fff' : 'transparent',
                boxShadow: viewMode === 'topology' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                padding: '3px 10px', borderRadius: 999, fontSize: 9.5, fontWeight: 550,
                color: viewMode === 'topology' ? '#0a0a0a' : '#6b6b6b', cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.25,1,0.5,1)'
              }}>
              Nodes
            </button>
            <button 
              onClick={() => setViewMode('geo')} 
              style={{
                border: 'none', background: viewMode === 'geo' ? '#fff' : 'transparent',
                boxShadow: viewMode === 'geo' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                padding: '3px 10px', borderRadius: 999, fontSize: 9.5, fontWeight: 550,
                color: viewMode === 'geo' ? '#0a0a0a' : '#6b6b6b', cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.25,1,0.5,1)'
              }}>
              Globe
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {!isEmpty && (
            <IconButton onClick={handleClear} title="Clear all traffic">
              <Trash2 size={12} />
            </IconButton>
          )}
          {/* Connection pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 999,
            background: isConnected ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.06)',
            border: `1px solid ${T.glassBorder}`,
            fontSize: 9, fontWeight: 500, color: T.inkMuted,
            transition: `all 0.4s ${T.easingOrg}`,
          }}>
            {isConnected
              ? <Wifi size={9} strokeWidth={2} />
              : <WifiOff size={9} strokeWidth={2} />
            }
            {isConnected ? 'Live' : 'Off'}
          </div>
        </div>
      </header>

      {/* ── Canvas ────────────────────────────────────────── */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {isEmpty ? (
          // ── Empty / Idle State ─────────────────────────
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: 32,
          }}>
            {/* Breathing organic watermark */}
            <svg
              width="80" height="80" viewBox="0 0 80 80" fill="none"
              style={{ animation: 'breathe 4s ease-in-out infinite' }}
            >
              <circle cx="40" cy="40" r="30" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
              <circle cx="40" cy="40" r="20" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
              <circle cx="40" cy="40" r="10" stroke="rgba(0,0,0,0.08)" strokeWidth="1" fill="rgba(0,0,0,0.03)" />
              <circle cx="40" cy="14" r="3" fill="rgba(0,0,0,0.1)" />
              <circle cx="66" cy="40" r="3" fill="rgba(0,0,0,0.07)" />
              <circle cx="40" cy="66" r="3" fill="rgba(0,0,0,0.07)" />
              <circle cx="14" cy="40" r="3" fill="rgba(0,0,0,0.07)" />
              <line x1="40" y1="14" x2="40" y2="30" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <line x1="66" y1="40" x2="50" y2="40" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <line x1="40" y1="66" x2="40" y2="50" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <line x1="14" y1="40" x2="30" y2="40" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            </svg>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: 12, fontWeight: 400, letterSpacing: '0.06em',
                color: T.inkFaint, margin: 0,
              }}>
                Awaiting network activity…
              </p>
              {!isConnected && (
                <p style={{ fontSize: 9.5, color: '#c0392b', marginTop: 6, letterSpacing: '0.02em' }}>
                  Port disconnected — reload extension
                </p>
              )}
            </div>
          </div>
        ) : viewMode === 'geo' ? (
          // ── Geospatial Map Canvas ────────────────────────
          <GeoMap />
        ) : (
          // ── React Flow Canvas ──────────────────────────
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.35 }}
            minZoom={0.35}
            maxZoom={2.8}
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            proOptions={{ hideAttribution: true }}
            style={{ background: T.canvas }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="rgba(0,0,0,0.055)"
              gap={18}
              size={1}
            />
          </ReactFlow>
        )}

        {/* ── Stats Pill (top-right overlay) ─────────────── */}
        {!isEmpty && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            display: 'flex', gap: 6,
          }}>
            <GlassPill>{clusters.size} cluster{clusters.size !== 1 ? 's' : ''}</GlassPill>
            <GlassPill animate={pulse}>{totalRequests.toLocaleString()} req</GlassPill>
          </div>
        )}

        {/* ── Corporate Footprint ─────────────────────────── */}
        {!isEmpty && (
          <CorporateFootprint stats={corporateStats} />
        )}

        {/* ── Node Detail Tooltip ─────────────────────────── */}
        {selectedClusterData && (
          <NodeTooltip
            cluster={selectedClusterData}
            onClose={() => setSelectedCluster(null)}
          />
        )}
      </main>

      {/* ── Status Bar ────────────────────────────────────── */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px',
        borderTop: `1px solid ${T.divider}`,
        background: T.glass,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        fontSize: 9.5,
        color: T.inkFaint,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}>
        <span>
          {totalRequests > 0
            ? <span style={{ color: T.ink, fontWeight: 500 }}>{totalRequests.toLocaleString()}</span>
            : '0'
          }
          {' '}intercept{totalRequests !== 1 ? 's' : ''}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: !isConnected
              ? '#c0392b'
              : totalRequests > 0
              ? '#2d6a4f'   // dark forest green — not neon
              : T.inkFaint,
            display: 'inline-block',
            animation: isConnected && totalRequests > 0 ? 'breatheDot 2.4s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }} />
          {!isConnected ? 'Disconnected' : totalRequests > 0 ? 'Intercepting' : 'Idle'}
        </span>
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function IconButton({ onClick, title, children }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="tm-icon-btn"
      style={{
        background: 'rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 8,
        width: 26, height: 26,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#6b6b6b',
        transition: 'all 0.25s cubic-bezier(0.25,1,0.5,1)',
      }}
    >
      {children}
    </button>
  );
}

function GlassPill({ children, animate }: { children: React.ReactNode; animate?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 999,
      padding: '3px 9px',
      fontSize: 9.5, fontWeight: 500, color: '#0a0a0a',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'transform 0.3s cubic-bezier(0.25,1,0.5,1)',
      transform: animate ? 'scale(1.08)' : 'scale(1)',
    }}>
      {children}
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      /* ── Keyframes ───────────────────────── */
      @keyframes breathe {
        0%, 100% { transform: scale(1);    opacity: 0.6; }
        50%       { transform: scale(1.06); opacity: 1;   }
      }
      @keyframes breatheDot {
        0%, 100% { opacity: 1;   }
        50%       { opacity: 0.3; }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0)    scale(1);    }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes bottleneckWobble {
        0%   { transform: translateY(0); }
        50%  { transform: translateY(3px); }
        100% { transform: translateY(-3px); }
      }
      @keyframes highContrastPulse {
        to { stroke-dashoffset: -20; }
      }

      /* ── React Flow overrides ────────────── */
      .react-flow__pane { cursor: default !important; }
      .react-flow__node { cursor: pointer !important; }
      .react-flow__node > div {
        transition: transform 0.35s cubic-bezier(0.25,1,0.5,1) !important;
      }
      .react-flow__node:hover > div {
        transform: scale(1.07) !important;
      }
      .react-flow__edge-path {
        transition: stroke-opacity 0.3s ease, stroke-width 0.3s ease;
      }
      .liquid-edge {
        stroke: rgba(0,0,0,0.15);
        transition: stroke 0.35s ease;
      }
      .bottleneck-wobble {
        stroke: rgba(217, 119, 6, 0.65) !important; /* Amber for slow latency */
        animation: bottleneckWobble 1.6s ease-in-out infinite alternate;
      }
      .high-contrast-pulse {
        stroke: rgba(239, 68, 68, 0.85) !important; /* Red for unsecured */
        stroke-dasharray: 6 5;
        animation: highContrastPulse 0.8s linear infinite;
      }

      /* ── Icon button hover ───────────────── */
      .tm-icon-btn:hover {
        background: rgba(0,0,0,0.08) !important;
        color: #0a0a0a !important;
        transform: scale(1.05);
      }

      /* ── Scrollbar ───────────────────────── */
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
    `}</style>
  );
}

/**
 * NodeTooltip.tsx — Phase 5: Premium Polish
 * ==========================================
 * Frosted glass detail panel — slides up from bottom of canvas on node select.
 *
 * Design constraints:
 *   - Pure acrylic glass: backdrop-filter blur + ultra-thin border.
 *   - No harsh drop-shadows. Organic 20px border-radius.
 *   - slideUp animation via cubic-bezier(0.25,1,0.5,1).
 *   - Typography: weight hierarchy only — no colour accents beyond monochrome.
 *   - Warning row uses a faint frosted dark pill — NOT red/neon.
 */

import type { DomainCluster } from '../types';
import { latencyTier } from '../graph/graphUtils';
import { X, Shield, AlertTriangle, Clock, Zap, Calendar } from 'lucide-react';

type Props = {
  cluster: DomainCluster;
  onClose: () => void;
};

const TIER_META: Record<string, { label: string; fill: number }> = {
  fast:     { label: '< 200ms — Fast',          fill: 0.22 },
  moderate: { label: '200 – 800ms — Moderate',  fill: 0.55 },
  slow:     { label: '> 800ms — Slow',           fill: 1.00 },
};

export default function NodeTooltip({ cluster, onClose }: Props) {
  const tier     = latencyTier(cluster.avgLatency);
  const tierMeta = TIER_META[tier];
  const isProblem = cluster.isUnsecured || cluster.errors > 0;
  const shortDomain = cluster.domain.replace(/^www\./, '');

  return (
    <div style={{
      position: 'absolute',
      bottom: 44,
      left: 10,
      right: 10,
      zIndex: 50,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(28px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 20,
      padding: '14px 15px 13px',
      boxShadow: '0 6px 36px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
      animation: 'slideUp 0.32s cubic-bezier(0.25,1,0.5,1)',
    }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 11 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 650,
            color: '#0a0a0a', letterSpacing: '-0.02em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 220,
          }}>
            {shortDomain}
          </div>
          <div style={{ fontSize: 9.5, color: '#7b7b7b', marginTop: 2, letterSpacing: '0.01em' }}>
            {cluster.requestCount} request{cluster.requestCount !== 1 ? 's' : ''} captured
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 8, padding: 0,
            width: 22, height: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#7b7b7b', flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Latency bar ────────────────────────────────── */}
      <div style={{ marginBottom: 11 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 9, color: '#9b9b9b', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>
            Avg Latency
          </span>
          <span style={{ fontSize: 10, fontWeight: 650, color: '#0a0a0a', letterSpacing: '-0.01em' }}>
            {cluster.avgLatency} ms
          </span>
        </div>
        {/* Organic progress bar */}
        <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(tierMeta.fill * 100, 100)}%`,
            background: '#0a0a0a',
            borderRadius: 999,
            transition: 'width 0.5s cubic-bezier(0.25,1,0.5,1)',
          }} />
        </div>
        <div style={{ fontSize: 9, color: '#b0b0b0', marginTop: 3 }}>{tierMeta.label}</div>
      </div>

      {/* ── Stats grid ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <StatCell
          icon={<Zap size={9} strokeWidth={2.5} />}
          label="Status"
          value={cluster.errors > 0 ? `${cluster.errors} error${cluster.errors > 1 ? 's' : ''}` : 'Healthy'}
          dim={cluster.errors === 0}
        />
        <StatCell
          icon={<Shield size={9} strokeWidth={2.5} />}
          label="Protocol"
          value={cluster.isUnsecured ? 'HTTP' : 'HTTPS'}
          dim={!cluster.isUnsecured}
        />
        <StatCell
          icon={<Clock size={9} strokeWidth={2.5} />}
          label="Requests"
          value={String(cluster.requestCount)}
          dim
        />
        <StatCell
          icon={<Calendar size={9} strokeWidth={2.5} />}
          label="Last seen"
          value={new Date(cluster.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          dim
        />
      </div>

      {/* ── Problem notice ─────────────────────────────── */}
      {isProblem && (
        <div style={{
          marginTop: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px',
          background: 'rgba(0,0,0,0.055)',
          borderRadius: 10,
          fontSize: 9.5, color: '#0a0a0a', letterSpacing: '0.01em',
        }}>
          <AlertTriangle size={10} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.7 }} />
          <span style={{ opacity: 0.75 }}>
            {cluster.isUnsecured
              ? 'Unencrypted HTTP traffic — data sent in plaintext'
              : `${cluster.errors} HTTP error${cluster.errors > 1 ? 's' : ''} detected on this domain`
            }
          </span>
        </div>
      )}
    </div>
  );
}

function StatCell({ icon, label, value, dim }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dim?: boolean;
}) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.028)',
      borderRadius: 10,
      padding: '7px 9px',
      border: '1px solid rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3.5,
        color: '#9b9b9b', marginBottom: 3,
      }}>
        {icon}
        <span style={{ fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: 11.5,
        fontWeight: 620,
        color: dim ? '#0a0a0a' : '#0a0a0a',
        letterSpacing: '-0.01em',
        lineHeight: 1.1,
      }}>
        {value}
      </div>
    </div>
  );
}

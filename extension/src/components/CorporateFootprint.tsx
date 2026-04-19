import { useEffect, useState } from 'react';

export interface CorporateStat {
  company: string;
  count: number;
  percentage: number;
}

interface Props {
  stats: CorporateStat[];
}

const T = {
  ink: '#0a0a0a',
  inkMuted: '#6b6b6b',
  inkFaint: '#b0b0b0',
  glass: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(0,0,0,0.07)',
  easingOrg: 'cubic-bezier(0.25,1,0.5,1)',
};

export default function CorporateFootprint({ stats }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animations shortly after mount for the smooth fill effect
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!stats || stats.length === 0) return null;

  return (
    <div style={{
      background: T.glass,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: `1px solid ${T.glassBorder}`,
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      animation: `slideUp 0.6s ${T.easingOrg} forwards`,
      
      // Floating position over the canvas
      position: 'absolute',
      bottom: 24,
      left: 16,
      width: 220,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h3 style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 650,
          letterSpacing: '-0.02em',
          color: T.ink,
          textTransform: 'uppercase'
        }}>
          Corporate Footprint
        </h3>
        <span style={{ fontSize: 9.5, color: T.inkMuted, fontWeight: 500 }}>
          {totalPercentage(stats.slice(0, 3))}% top 3
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {stats.slice(0, 5).map((stat, i) => (
          <div key={stat.company} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
              <span style={{ fontWeight: 500, color: T.ink, letterSpacing: '-0.01em' }}>{stat.company}</span>
              <span style={{ fontWeight: 650, color: T.inkMuted }}>{stat.percentage}%</span>
            </div>
            {/* Progress Bar Container */}
            <div style={{
              height: 4,
              background: 'rgba(0,0,0,0.04)',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              {/* Progress Bar Fill */}
              <div style={{
                height: '100%',
                background: T.ink,
                borderRadius: 4,
                width: mounted ? `${stat.percentage}%` : '0%',
                transition: `width 1.2s ${T.easingOrg} ${i * 0.12}s`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function totalPercentage(stats: CorporateStat[]) {
  return stats.reduce((sum, s) => sum + s.percentage, 0);
}

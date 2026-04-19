/**
 * GeoMap.tsx — Phase 1 & 3
 * =========================
 * The Geography Canvas utilizing D3 and TopoJSON.
 * Hardcoded user origin to Bengaluru [77.5946, 12.9716].
 * Phase 3 Debugging: Arc validations and suspended GC.
 */

import React, { useMemo, useState, useEffect } from 'react';
import * as d3 from 'd3-geo';
import * as topojson from 'topojson-client';
import world from 'world-atlas/countries-110m.json';

// Type representing a drawn arc
export interface GeoArc {
  id: string;
  origin: [number, number];   // Longitude, Latitude
  target: [number, number];   // Longitude, Latitude
  isTracker?: boolean;
}

const GeoMap: React.FC = () => {
  // Hardcoded origin per specs (Longitude, Latitude)
  // using useMemo so it doesn't break useEffect dependencies
  const userOrigin: [number, number] = useMemo(() => [77.5946, 12.9716], []);

  // Arc State
  const [activeArcs, setActiveArcs] = useState<GeoArc[]>([]);

  // Canvas bounds
  const width = 800;
  const height = 500;
  
  // Create projection (Natural Earth is organic and fits inside a bounding box beautifully)
  const projection = useMemo(() => {
    return d3.geoNaturalEarth1()
      .scale(155)
      .translate([width / 2, height / 2.1]); // Shifted slightly for better visual balance
  }, [width, height]);

  // Create path generator
  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Extract topologies geometry
  const countries = useMemo(() => {
    return topojson.feature(world as any, world.objects.countries as any);
  }, []);

  // ─── Phase 3: The Arc Listener Engine ────────────────────────
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.connect) return;
    
    // Tap into the firehose of network requests from background.ts
    const port = chrome.runtime.connect({ name: 'topology-panel' });
    
    const handleMessage = (msg: any) => {
      if (msg.type === 'NETWORK_REQUEST' && msg.payload) {
        
        // We will fallback to [0,0] if Phase 2 isn't fully passing serverCoords yet
        const arcTarget: [number, number] = msg.payload.serverCoords || [0, 0];
        
        const arc: GeoArc = {
          id: msg.payload.id || Math.random().toString(),
          origin: userOrigin,
          target: arcTarget,
          isTracker: msg.payload.isTracker
        };
        
        // ── Step 1: Validate the Coordinate Data ──
        console.log('Arc received:', { origin: arc.origin, target: arc.target });
        
        setActiveArcs(prev => [...prev, arc]);
        
        // ── Step 4: Re-enabling GC to prevent DOM leaks of invisible arcs ──
        setTimeout(() => {
          setActiveArcs(current => current.filter(a => a.id !== arc.id));
        }, 3500);
      }
    };
    
    port.onMessage.addListener(handleMessage);
    return () => port.disconnect();
  }, [userOrigin]);

  return (
    <div style={{
      width: '100%', height: '100%', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f8f7',
      animation: 'fadeIn 0.4s cubic-bezier(0.25,1,0.5,1)'
    }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Render base map */}
        <g className="world-base">
          {/* @ts-ignore topojson types are loose on the features array */}
          {countries.features.map((feature: any, i: number) => (
            <path
              key={`country-${i}`}
              d={pathGenerator(feature) || ''}
              fill="#e6e6e6" // Ultra-light grey for maximum contrast with arcs
              stroke="#ffffff"
              strokeWidth={0.5}
            />
          ))}
        </g>

        {/* Render Arcs */}
        <g className="world-arcs">
          {activeArcs.map((arc) => {
            // Fix 1: Custom Quadratic Bezier Curves (Organic Arcs)
            const startPoint = projection(arc.origin);
            const endPoint = projection(arc.target);
            
            if (!startPoint || !endPoint) return null;
            
            const [startX, startY] = startPoint;
            const [endX, endY] = endPoint;
            
            // Calculate midpoint
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // Calculate distance to determine the height of the arc
            const dx = endX - startX;
            const dy = endY - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Offset Y slightly upwards (negative Y in SVG is up)
            // Dist * 0.25 guarantees a proportional, smooth upward curve on all arcs
            const controlX = midX;
            const controlY = midY - (dist * 0.25); 
            
            const pathData = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;

            // Fix 2 & 3: Map state array & apply explicit fading class
            return (
              <path
                key={arc.id}
                d={pathData}
                stroke={arc.isTracker ? "rgba(234, 88, 12, 0.9)" : "black"}
                strokeWidth="1.5"
                fill="none"
                className={`geo-arc ${arc.isTracker ? 'high-contrast-pulse' : ''}`}
              />
            );
          })}
        </g>
        
        {/* User Origin Indicator (Rendered last so it sits on top of lines) */}
        <g className="user-origin">
          {(() => {
            const [cx, cy] = projection(userOrigin) || [0, 0];
            return (
              <>
                {/* Outer pinging ring */}
                <circle cy={cy} cx={cx} r={6} fill="none" stroke="#2d6a4f" strokeWidth={1.5} className="geo-ping" />
                {/* Solid center dot */}
                <circle cx={cx} cy={cy} r={2.5} fill="#2d6a4f" />
              </>
            );
          })()}
        </g>
      </svg>

      {/* Global styles for GeoMap specifically */}
      <style>{`
        @keyframes geoPing {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .geo-ping {
          transform-origin: center;
          animation: geoPing 2.5s cubic-bezier(0.25,1,0.5,1) infinite;
        }
        /* Make sure pulse propagates locally if not caught from App.tsx */
        .high-contrast-pulse {
          stroke: rgba(239, 68, 68, 0.85) !important;
          stroke-dasharray: 6 5;
          animation: highContrastPulse 0.8s linear infinite, arcFadeOut 3s cubic-bezier(0.25,1,0.5,1) forwards !important;
        }

        /* Fix 3: Fade Animation */
        @keyframes arcFadeOut {
          0% { opacity: 1; stroke-width: 2px; }
          70% { opacity: 0.6; stroke-width: 1.5px; }
          100% { opacity: 0; stroke-width: 0.5px; }
        }
        .geo-arc {
          animation: arcFadeOut 3s cubic-bezier(0.25,1,0.5,1) forwards;
        }
      `}</style>
    </div>
  );
};

export default GeoMap;

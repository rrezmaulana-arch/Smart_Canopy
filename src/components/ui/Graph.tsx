// 📁 src/components/ui/Graph.tsx
'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';

type Props = {
  data: number[];
  height?: number;
  unit?: string; // Tambahan prop: biar bisa % atau °C
};

export default function Graph({ data, height = 260, unit = "%" }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const padding = 40; // Padding sedikit lebih luas untuk label
  const width = 900;
  const strokeRef = useRef<SVGPathElement | null>(null);

  // 1. Kalkulasi Koordinat dengan Normalisasi Data
  const points = useMemo(() => {
    if (!data.length) return [];
    
    // Mencari nilai tertinggi dan terendah agar grafik selalu pas di tengah
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    
    // Berikan buffer 10% agar garis tidak menempel ke atap/lantai grafik
    const range = (maxVal - minVal) || 1;
    const chartMax = maxVal + range * 0.1;
    const chartMin = Math.max(0, minVal - range * 0.1); 
    const finalRange = chartMax - chartMin;

    return data.map((v, i) => {
      const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - chartMin) / finalRange) * (height - padding * 2);
      return { x, y, v };
    });
  }, [data, height]);

  // 2. Membuat Kurva Bezier yang Halus
  const linePath = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((acc, point, i, a) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const p0 = a[i - 1];
      const curr = point;
      const cp1x = p0.x + (curr.x - p0.x) / 2;
      return `${acc} C ${cp1x},${p0.y} ${cp1x},${curr.y} ${curr.x},${curr.y}`;
    }, "");
  }, [points]);

  // 3. Animasi Drawing
  useEffect(() => {
    const path = strokeRef.current;
    if (!path || !linePath) return;

    try {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.getBoundingClientRect(); // Trigger reflow
      path.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
      path.style.strokeDashoffset = '0';
    } catch (e) {
      console.warn("SVG Animation reset", e);
    }
  }, [linePath, data]); // Reset animasi jika data berubah

  if (!points.length) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl">
        <span className="text-slate-500 uppercase text-[10px] font-black tracking-widest animate-pulse">
          No Telemetry Data
        </span>
      </div>
    );
  }

  return (
    <div className="w-full group relative overflow-visible">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full drop-shadow-[0_0_15px_rgba(236,72,153,0.1)]" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Area Fill */}
        <path 
          d={`${linePath} L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`} 
          fill="url(#areaGrad)" 
          className="animate-in fade-in duration-1000"
        />

        {/* 2. Garis Glow */}
        <path 
          d={linePath} 
          fill="none" 
          stroke="url(#lineGrad)" 
          strokeWidth={10} 
          strokeLinecap="round" 
          opacity={0.15} 
          filter="url(#neonGlow)"
        />

        {/* 3. Garis Utama */}
        <path 
          ref={strokeRef} 
          d={linePath} 
          fill="none" 
          stroke="url(#lineGrad)" 
          strokeWidth={3.5} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* 4. Interactive Points & Tooltip */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Area Hover lebih besar agar mudah disentuh mouse */}
            <circle
              cx={p.x}
              cy={p.y}
              r={12}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-crosshair"
            />
            
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 6 : 0}
              fill="#fff"
              stroke="#ec4899"
              strokeWidth={3}
              className="pointer-events-none transition-all duration-300"
            />
            
            {hoverIndex === i && (
              <g className="pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <rect 
                  x={p.x - 35} 
                  y={p.y - 48} 
                  width={70} 
                  height={30} 
                  rx={10} 
                  fill="#0f172a" 
                  stroke="#ec4899"
                  strokeWidth={1.5}
                />
                <text 
                  x={p.x} 
                  y={p.y - 28} 
                  fill="#fff" 
                  fontSize={12} 
                  fontWeight="bold" 
                  textAnchor="middle" 
                  className="font-sans tracking-tight"
                >
                  {p.v}{unit}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* Garis Dasar (Baseline) */}
        <line 
          x1={padding} 
          y1={height - padding} 
          x2={width - padding} 
          y2={height - padding} 
          stroke="currentColor" 
          className="text-slate-800 dark:text-white/10"
          strokeWidth={1} 
        />
      </svg>
    </div>
  );
}
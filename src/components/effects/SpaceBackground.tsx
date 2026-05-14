'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocity: { x: number; y: number };
}

const SpaceBackground: React.FC = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rippleId = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    let lastSpawnTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      const now = Date.now();
      // Throttle spawn ripple maksimal setiap 40ms (25 fps limit) agar tidak over-render
      if (speed > 2 && now - lastSpawnTime > 40) {
        const newRipple: Ripple = {
          id: rippleId.current++,
          x: e.clientX,
          y: e.clientY,
          size: Math.min(speed * 5, 200), // Ukuran font maksimal dikurangi
          opacity: 0.6,
          velocity: { x: dx * 0.1, y: dy * 0.1 }
        };

        // Kurangi jumlah maksimal ripple dari 20 menjadi 8 agar GPU lebih ringan
        setRipples((prev) => [...prev, newRipple].slice(-8));
        lastSpawnTime = now;
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      setRipples((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((r) => ({
            ...r,
            x: r.x + r.velocity.x,
            y: r.y + r.velocity.y,
            opacity: r.opacity - 0.02, // Percepat proses hilang sedikit
            size: r.size + 2,
          }))
          .filter((r) => r.opacity > 0);
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    // PENTING: Gunakan z-[-1] dan pastikan tidak ada pointer-events
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[#020205] z-[-1]">

      {/* Layer Bintang */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 20% 30%, #eee, transparent),
            radial-gradient(1.5px 1.5px at 70% 70%, #eee, transparent),
            radial-gradient(2px 2px at 40% 80%, #fff, transparent)
          `,
          backgroundSize: '300px 300px'
        }}
      />

      {/* Render Ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none mix-blend-screen transform-gpu"
          style={{
            left: 0,
            top: 0,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
            // Paksa posisi dengan translate3d agar tidak tertutup elemen lain
            transform: `translate3d(${ripple.x}px, ${ripple.y}px, 0) translate(-50%, -50%)`,
            opacity: ripple.opacity,
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, rgba(217, 70, 239, 0.2) 40%, transparent 70%)',
            filter: 'blur(35px)',
            zIndex: 1, // Beri z-index positif di dalam kontainer background
          }}
        />
      ))}

      {/* Vignette Gelap */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020205_100%)] opacity-80" />
    </div>
  );
};

export default SpaceBackground;
// 📁 src/pages/LandingPage.tsx
'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useFirebaseData } from '../contexts/FirebaseContext';
import { database } from '../services/firebaseConfig';
import { ref, update } from 'firebase/database';
import {
  Cloud, Shield, Activity, ArrowRight,
  Cpu, Droplets, Thermometer, Wind, Sun,
  Play, Square, ChevronDown, Menu, X, Send, Moon, User, UserCheck, ChevronLeft, ChevronRight, Check
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// 3D MODEL
// ─────────────────────────────────────────────────────────
function CanopyModel({ isOpen, onLoaded }: { isOpen: boolean; onLoaded: () => void }) {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF('/models/canopy otomatis.glb');
  const { actions, names } = useAnimations(animations, group);
  const prevOpen = useRef<boolean | null>(null);

  useEffect(() => { if (scene) onLoaded(); }, [scene, onLoaded]);

  useEffect(() => {
    if (!names.length) return;
    const action = actions[names[0]];
    if (!action) return;

    if (isOpen) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.timeScale = 1;
      if (prevOpen.current === false || prevOpen.current === null) action.reset();
      action.paused = false;
      action.play();
    } else if (prevOpen.current === true) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.timeScale = -1;
      action.paused = false;
      action.play();
    }
    prevOpen.current = isOpen;
  }, [isOpen, actions, names]);

  useFrame((_, delta) => {
    if (group.current && !isOpen) group.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={group}>
      {/* Skala diperkecil agar tidak memenuhi batas container */}
      <primitive object={scene} scale={0.4} position={[0, -0.6, 0]} castShadow receiveShadow />
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// PARTICLES
// ─────────────────────────────────────────────────────────
function Particles() {
  const ref = useRef<THREE.Points>(null!);
  const geo = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.018; });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} color="#ec4899" transparent opacity={0.55} />
    </points>
  );
}

// ─────────────────────────────────────────────────────────
// MODERN SCROLL-SNAP TEAM CAROUSEL
// ─────────────────────────────────────────────────────────
function GachaCard({ m, offset, onClick, isActive, isDark }: any) {
  const prevOffset = useRef(offset);
  const [isRevealed, setIsRevealed] = useState(false);
  const isJumping = Math.abs(offset - prevOffset.current) > 1;
  const isFar = Math.abs(offset) > 1;

  useEffect(() => {
     prevOffset.current = offset;
  }, [offset]);

  useEffect(() => {
     if (!isActive) setIsRevealed(false);
  }, [isActive]);

  const handleCardClick = () => {
      if (!isActive) onClick();
      else setIsRevealed(!isRevealed);
  };

  const zIndex = 20 - Math.abs(offset);
  // Efek mundur ke belakang (scale down)
  const scale = 1 - (Math.abs(offset) * 0.15);
  
  // Efek menyamping
  const dir = offset > 0 ? 1 : offset < 0 ? -1 : 0;
  const translateX = dir * (180 + Math.max(0, Math.abs(offset) - 1) * 80);
  
  // Perlahan hilang
  const opacity = Math.abs(offset) >= 2 ? 0 : 1 - (Math.abs(offset) * 0.6);

  const transitionStyle = isJumping ? 'none' : 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.8s ease';

  return (
    <div 
      className={`team-slide-wrap ${isActive ? 'active' : ''}`}
      onClick={handleCardClick}
      style={{
         zIndex,
         width: '280px',
         height: '480px',
         flexShrink: 0,
         transform: `translateX(${translateX}px) translateZ(0px) scale(${scale})`,
         opacity,
         pointerEvents: isFar ? 'none' : 'auto',
         transition: transitionStyle,
         cursor: 'pointer',
         position: 'absolute'
      }}
    >
       <div className="team-slide-inner transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] w-[280px] h-[480px]" style={isActive ? {
           transform: 'translateY(-10px)'
       } : {}}>

          {/* MORE MODERN SINGLE FACE CARD DESIGN */}
          <div className={`w-full h-full relative overflow-hidden flex flex-col transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group`} style={{ 
               backgroundColor: isDark 
                  ? (isActive ? 'rgba(8, 12, 25, 0.88)' : 'rgba(8, 12, 25, 0.78)')
                  : (isActive ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.75)'), 
               borderRadius: '32px',
               border: `1px solid ${isDark ? `rgba(255,255,255,${isActive ? '0.12' : '0.06'})` : `rgba(0,0,0,${isActive ? '0.08' : '0.04'})`}`,
               backdropFilter: 'blur(24px)',
               WebkitBackdropFilter: 'blur(24px)',
               boxShadow: isDark 
                  ? (isActive ? `0 30px 60px -15px ${m.color}40, 0 0 0 1px rgba(255,255,255,0.06)` : '0 15px 40px rgba(0,0,0,0.7)')
                  : (isActive ? `0 20px 40px -10px ${m.color}30, inset 0 2px 20px rgba(255,255,255,0.5)` : '0 10px 25px rgba(0,0,0,0.07)')
          }}>
              {/* TOP COLOR ACCENT */}
              <div 
                className="absolute top-0 left-0 w-full h-1" 
                style={{ background: isActive ? `linear-gradient(90deg, transparent, ${m.color}, transparent)` : 'transparent', transition: 'all 0.5s' }}
              />

              {/* Photo Area (Restored maskImage) */}
              <div 
                  className={`relative transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDark ? 'bg-slate-900' : 'bg-slate-200'} shrink-0
                      ${isRevealed ? 'h-[220px] m-3 mb-2 rounded-[24px]' : 'h-[360px] m-0 rounded-none'}
                  `}
                  style={{
                      backgroundImage: `url('${m.image}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      maskImage: isRevealed ? 'none' : 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                      WebkitMaskImage: isRevealed ? 'none' : 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                      willChange: 'transform'
                  }}
              >
                  {/* Subtle vignette for the image */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#080c19] via-[#080c19]/30' : 'from-white/90 via-white/20'} to-transparent transition-opacity duration-700 ${isRevealed ? 'opacity-60' : 'opacity-100'}`}></div>
              </div>
              
              {/* Text & Button Area */}
              <div className={`px-6 pb-6 flex flex-col flex-1 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isRevealed ? 'mt-0' : '-mt-[90px] relative z-10'}`}>
                  <div className="flex items-center gap-2 mb-2">
                      <h3 className={`${isDark ? 'text-white' : 'text-slate-800'} text-[22px] font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis m-0 drop-shadow-sm`} dangerouslySetInnerHTML={{ __html: m.name.replace('<br/>', ' ') }}></h3>
                      {isActive && (
                         <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-5 h-5 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.4)] ml-1">
                            <Check size={13} className="text-white" strokeWidth={3} />
                         </div>
                      )}
                  </div>
                  
                  {/* Container for Jobdesk - hidden if not revealed */}
                  <div className={`transition-all duration-700 ease-in-out overflow-hidden flex-1 flex flex-col ${isRevealed ? 'max-h-[220px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                          {m.jobdesk.map((job: string) => (
                             <span key={job} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border ${isDark ? 'text-slate-300 bg-white/5 border-white/10' : 'text-slate-700 bg-black/5 border-black/5'}`}>
                                {job}
                             </span>
                          ))}
                      </div>
                      
                      {/* Bottom Row */}
                      <div className={`flex items-center pt-4 mt-auto border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                          <div className="flex w-full items-center justify-between">
                              <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'} text-[12px] font-medium tracking-wide`}>
                                 <User size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'}/> {m.nim.slice(-4)}
                              </span>
                              <a href={m.instagram || `https://instagram.com/${m.name.split('<')[0].replace(/ /g, '').toLowerCase()}`} target="_blank" rel="noopener noreferrer" 
                                 onClick={(e) => e.stopPropagation()}
                                 className={`flex items-center justify-center px-5 py-2 rounded-full font-semibold text-[12px] transition-all backdrop-blur-xl border shadow-sm ${isDark ? 'bg-white/5 hover:bg-white/15 border-white/10 text-white hover:text-white hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)]' : 'bg-white/60 hover:bg-white border-black/5 text-slate-700 hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}>
                                  Instagram
                              </a>
                          </div>
                      </div>
                  </div>

                  {/* Initial state Info (NIM Only) */}
                  <div className={`transition-all duration-500 overflow-hidden ${!isRevealed ? 'max-h-[50px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                      <div className={`flex items-center gap-3 ${isDark ? 'text-slate-300' : 'text-slate-600'} text-[14px] font-medium tracking-wide`}>
                          <span className="flex items-center gap-1.5"><User size={15}/> {m.nim}</span>
                      </div>
                  </div>

              </div>
          </div>
       </div>
    </div>
  );
}

function TeamCarousel({ isDark }: { isDark: boolean }) {
  const TEAM_MEMBERS = [
    { name: 'Moetia Safitri<br/>Agustina', nim: '24314070111038', color: '#ff2a85', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', jobdesk: ['Fullstack Developer', 'API & Database', '3D Design'], instagram: 'https://www.instagram.com/moetia.sf?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' },
    { name: 'Naftalia Frendsiska<br/>Rumahorbo', nim: '24314070111035', color: '#10b981', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', jobdesk: ['IoT Hardware Engineering', 'Physical Prototyping', 'Diorama Architecture'] },
    { name: 'Raja Shaka<br/>Quranique', nim: '243140701111026', color: '#f59e0b', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', jobdesk: ['System Integration', 'Network Operations', 'Documentation Specialist'] },
    { name: 'Dhea Nur Indah<br/>Ramadhani', nim: '243140701111021', color: '#0ea5e9', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80', jobdesk: ['Embedded Systems', 'Hardware Assembly', 'Scale Modeling (Maket)'] }
  ];

  const [active, setActive] = useState(0);

  const next = () => setActive((p) => p + 1);
  const prev = () => setActive((p) => p - 1);
  
  const select = (index: number) => {
      const L = TEAM_MEMBERS.length;
      let curr = active % L;
      if (curr < 0) curr += L;
      let diff = index - curr;
      if (diff > Math.floor(L/2)) diff -= L;
      else if (diff < -Math.floor(L/2)) diff += L;
      setActive(active + diff);
  };

  const touchX = useRef(0);
  const touchY = useRef(0);

  const onTouchStart = (e: any) => { 
      touchX.current = e.touches[0].clientX; 
      touchY.current = e.touches[0].clientY; 
  };
  
  const onTouchEnd = (e: any) => {
    const dx = touchX.current - e.changedTouches[0].clientX;
    const dy = touchY.current - e.changedTouches[0].clientY;
    
    // Ignore swipe if the user is scrolling vertically or the distance is too short
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx > 0) next();
      else prev();
      
      // Stop propagation to prevent Safari/Chrome from simulating a click on the card
      // after a swipe which was causing `isRevealed` to falsely toggle
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="team-carousel-container relative w-full h-[620px] flex flex-col items-center justify-center overflow-hidden perspective-[1200px]">
       
       <div className="team-carousel relative w-full max-w-[320px] h-[500px] flex items-center justify-center transform-style-3d top-[-20px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {TEAM_MEMBERS.map((m, i) => {
             const L = TEAM_MEMBERS.length;
             let normalizedActive = active % L;
             if (normalizedActive < 0) normalizedActive += L;

             let offset = i - normalizedActive;
             if (offset > Math.floor(L / 2)) offset -= L;
             else if (offset < -Math.floor(L / 2)) offset += L;

             return (
               <GachaCard 
                 key={m.nim} 
                 m={m} 
                 offset={offset} 
                 isActive={i === normalizedActive}
                 onClick={() => select(i)} 
                 isDark={isDark}
               />
             )
          })}
       </div>

       {/* Pagination and Arrows container at the bottom */}
       <div className="absolute bottom-6 flex items-center justify-center gap-6 z-20 w-full">
           <button className={`team-nav-arrow w-[44px] h-[44px] flex items-center justify-center rounded-full backdrop-blur-xl transition-all hover:scale-110 ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/80 border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'bg-white/70 hover:bg-white border-black/5 text-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`} onClick={prev}>
               <ChevronLeft size={20} strokeWidth={2.5}/>
           </button>

           <div className="flex gap-2.5 items-center">
              {TEAM_MEMBERS.map((_, i) => {
                 const L = TEAM_MEMBERS.length;
                 let normalizedActive = active % L;
                 if (normalizedActive < 0) normalizedActive += L;
                 return (
                   <div key={i} className={`h-2 rounded-full cursor-pointer transition-all duration-500 ease-out ${i === normalizedActive ? 'bg-pink-500 shadow-[0_0_12px_#ec4899] w-10' : `w-2 ${isDark ? 'bg-white/20 hover:bg-white/40' : 'bg-slate-300 hover:bg-slate-400'}`}`} onClick={() => select(i)} />
                 )
              })}
           </div>

           <button className={`team-nav-arrow w-[44px] h-[44px] flex items-center justify-center rounded-full backdrop-blur-xl transition-all hover:scale-110 ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/80 border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'bg-white/70 hover:bg-white border-black/5 text-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`} onClick={next}>
               <ChevronRight size={20} strokeWidth={2.5}/>
           </button>
       </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
export default function LandingPage({ isDark = true, setIsDark }: { isDark?: boolean, setIsDark?: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { telemetry } = useFirebaseData();
  
  // 1. Decouple Database Status from Simulation Status
  const [simulationOpen, setSimulationOpen] = useState(telemetry.status === 'OPEN');

  // 2. React to Real Database changes
  useEffect(() => {
     setSimulationOpen(telemetry.status === 'OPEN');
  }, [telemetry.status]);

  // 3. Buttons Only Affect Simulation
  const simulateCanopyAction = (open: boolean) => {
     setSimulationOpen(open);
  };

  const [modelLoaded, setModelLoaded] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', fn);
      observer.disconnect();
    };
  }, []);

  const goto = (r: React.RefObject<HTMLDivElement | null>) => {
    r.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileNav(false);
  };

  const onLoaded = React.useCallback(() => setModelLoaded(true), []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .lp {
          --bg-main: transparent;
          --text-main: #f1f5f9;
          --text-muted: #94a3b8;
          --nav-bg: rgba(8, 10, 15, 0.7);
          --glass-bg: rgba(8, 10, 15, 0.6);
          --glass-border: rgba(255,255,255,0.05);
          font-family: 'Inter', sans-serif;
          background: var(--bg-main);
          color: var(--text-main);
          min-height: 100vh;
          overflow-x: hidden;
          transition: background 0.5s, color 0.5s;
        }
        .lp.light {
          --bg-main: #f1f5f9;
          --text-main: #0f172a;
          --text-muted: #475569;
          --nav-bg: rgba(255, 255, 255, 0.90);
          --glass-bg: rgba(255, 255, 255, 0.85);
          --glass-border: rgba(0,0,0,0.08);
        }
        .lp.light { background: var(--bg-main); }

        /* ── NAV — always transparent, no background ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0;
          z-index: 50;
          padding: 1.25rem 1.5rem 0;
          pointer-events: none;
        }
        .lp-nav-inner {
          max-width: 1100px; margin: 0 auto;
          height: 52px; display: flex;
          align-items: center; justify-content: space-between;
          padding: 0;
          pointer-events: auto;
        }
        /* No scroll glass — stays transparent always */
        .lp-nav.scrolled .lp-nav-inner { background: none; border: none; box-shadow: none; }
        .lp-logo {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 800; font-size: 1.05rem;
          letter-spacing: -0.02em; color: #fff;
          text-decoration: none; cursor: pointer;
        }
        .lp-logo-icon {
          width: 30px; height: 30px; border-radius: 10px;
          background: linear-gradient(135deg,#ff2a85,#be185d);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 15px rgba(236,72,153,0.4);
        }
        /* nav-links hidden — dropdown handles all navigation */
        .lp-nav-links { display: none !important; }
        .lp-nav-login { display: none !important; }
        .lp-nav-actions { display: flex; align-items: center; gap: 1rem; }
        .lp-theme-btn {
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          transition: color 0.3s; display: flex; align-items: center; justify-content: center;
        }
        .lp-theme-btn:hover { color: #ec4899; }
        
        .lp-nav-login {
          padding: 0.6rem 1.6rem;
          background: rgba(236,72,153,0.1);
          border: 1px solid rgba(236,72,153,0.5);
          border-radius: 999px; color: #ff2a85;
          font-weight: 700; font-size: 0.75rem; cursor: pointer;
          letter-spacing: 0.08em; text-transform: uppercase;
          transition: all 0.3s;
          box-shadow: 0 0 15px rgba(236,72,153,0.1);
          display: none;
        }
        @media(min-width:768px){ .lp-nav-login { display: block; } }
        .lp-nav-login:hover { 
          transform: translateY(-2px); background: rgba(236,72,153,0.2); box-shadow: 0 5px 25px rgba(236,72,153,0.3); 
        }
        
        /* ── BURGER BUTTON (3 LINES ANIMATED) ── */
        .lp-nav-burger {
          display: flex;
          flex-direction: column; gap: 5px; justify-content: center; align-items: center;
          width: 38px; height: 38px; border-radius: 10px; cursor: pointer;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s;
          position: relative;
        }
        .lp.light .lp-nav-burger { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.08); }
        .lp-nav-burger:hover { background: rgba(236,72,153,0.12); border-color: rgba(236,72,153,0.4); }
        .lp-nav-burger span {
          display: block; width: 16px; height: 1.5px;
          background: var(--text-main); border-radius: 2px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }
        .lp-nav-burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .lp-nav-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .lp-nav-burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
        .lp-nav-burger.open { background: rgba(236,72,153,0.12); border-color: rgba(236,72,153,0.4); }
        /* ── DROPDOWN — PREMIUM FLOATING MENU ── */
        .lp-dropdown-backdrop {
          position: fixed; inset: 0; z-index: 98;
          pointer-events: none;
        }
        .lp-dropdown-backdrop.open { pointer-events: auto; }
        
        .lp-dropdown {
          position: absolute; top: calc(100% + 14px); right: 0;
          width: 240px;
          background: rgba(10, 11, 18, 0.88);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          padding: 6px;
          overflow: hidden;
          box-shadow: 
            0 30px 80px rgba(0,0,0,0.55),
            0 0 0 1px rgba(255,255,255,0.03),
            inset 0 1px 0 rgba(255,255,255,0.06);
          z-index: 99;
          opacity: 0; pointer-events: none;
          transform: translateY(-8px) scale(0.95);
          transform-origin: top right;
          transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        /* top accent line */
        .lp-dropdown::before {
          content: '';
          display: block; height: 2px; margin: 0 6px 6px;
          background: linear-gradient(90deg, transparent, rgba(236,72,153,0.6), rgba(144,19,254,0.6), transparent);
          border-radius: 999px;
        }
        .lp.light .lp-dropdown {
          background: rgba(255,255,255,0.92);
          border-color: rgba(0,0,0,0.07);
          box-shadow: 0 20px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .lp-dropdown.open { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }

        /* section label */
        .lp-dropdown-label {
          padding: 4px 12px 6px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.65rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.25);
        }
        .lp.light .lp-dropdown-label { color: rgba(0,0,0,0.3); }

        .lp-dropdown-item {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 12px;
          border-radius: 14px;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem; font-weight: 500;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: background 0.18s, color 0.18s, transform 0.15s;
          user-select: none;
        }
        .lp-dropdown-item-icon {
          width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06);
          transition: background 0.2s;
        }
        .lp.light .lp-dropdown-item { color: #374151; }
        .lp.light .lp-dropdown-item-icon { background: rgba(0,0,0,0.05); }
        .lp-dropdown-item:hover {
          background: rgba(255,255,255,0.06);
          color: #fff;
          transform: translateX(2px);
        }
        .lp.light .lp-dropdown-item:hover { background: rgba(0,0,0,0.04); color: #111; }
        .lp-dropdown-item:hover .lp-dropdown-item-icon { background: rgba(236,72,153,0.15); }
        .lp-dropdown-item:active { transform: scale(0.98); }

        .lp-dropdown-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 4px 6px;
        }
        .lp.light .lp-dropdown-divider { background: rgba(0,0,0,0.07); }

        .lp-dropdown-cta {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; margin: 2px 0;
          border-radius: 14px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.85rem; font-weight: 700;
          color: #fff;
          cursor: pointer;
          background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(144,19,254,0.2));
          border: 1px solid rgba(236,72,153,0.3);
          transition: all 0.2s;
        }
        .lp-dropdown-cta:hover {
          background: linear-gradient(135deg, rgba(236,72,153,0.4), rgba(144,19,254,0.3));
          border-color: rgba(236,72,153,0.6);
          box-shadow: 0 6px 24px rgba(236,72,153,0.25);
          transform: translateY(-1px);
        }
        .lp-dropdown-cta:active { transform: scale(0.98); }
        
        /* ── LIGHT MODE OVERRIDES ── */
        .lp.light .lp-logo { color: #0f172a; }
        .lp.light .lp-h1, .lp.light .lp-stitle { color: #0f172a; text-shadow: 0 0 40px rgba(236,72,153,0.1); }
        .lp.light .lp-stat-val { color: #0f172a !important; }
        .lp.light .lp-sub { color: #475569; }
        .lp.light .lp-ctrl { background: rgba(255,255,255,0.9); color: #0f172a; border-color: rgba(0,0,0,0.1); }
        .lp.light .lp-ctrl-on { background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(190,24,93,0.05)); color: #ff2a85; border-color: rgba(236,72,153,0.5); }
        .lp.light .lp-stat { background: rgba(255,255,255,0.9); box-shadow: 0 8px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1); border-color: rgba(0,0,0,0.06); }
        .lp.light .lp-stat-label { color: #64748b; }
        .lp.light .lp-stat-val span { color: #94a3b8; }
        .lp.light .lp-tag { background: rgba(255,255,255,0.9); border-color: rgba(0,0,0,0.08); color: #334155; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
        .lp.light .lp-tag:hover { background: rgba(236,72,153,0.08); border-color: rgba(236,72,153,0.3); color: #be185d; }
        .lp.light .lp-section-header::before { color: rgba(236,72,153,0.5); }
        .lp.light .lp-footer { border-top-color: rgba(0,0,0,0.06); }
        .lp.light .lp-copy { color: #64748b; }
        .lp-team-section { scroll-margin-top: 100px; }
        .lp.light .lp-team-section { background: transparent; }
        .lp.light .lp-info-simple::before { background: linear-gradient(90deg, transparent, rgba(236,72,153,0.25), transparent); }
        .lp.light .lp-nav-links a { color: #64748b; }
        .lp.light .lp-nav-links a:hover { color: #ec4899; }
        .lp.light .lp-scroll { color: #64748b; }
        .lp.light .lp-tech-logos img { filter: grayscale(100%) opacity(0.5); }
        .lp.light .lp-tech-logos img:hover { filter: grayscale(0%) opacity(1); }

        /* ── HERO SECTION ── */
        .lp-hero {
          position: relative;
          min-height: 100vh;
          display: flex; 
          flex-direction: column;
          align-items: center; 
          padding-top: 100px; 
          padding-bottom: 4rem;
        }
        
        /* Glow lembut di belakang 3D (Pink) */
        .lp-hero::before {
          content: '';
          position: absolute;
          top: 15%; left: 50%;
          transform: translateX(-50%);
          width: 60vw; height: 50vw;
          background: radial-gradient(ellipse, rgba(236,72,153,0.1) 0%, transparent 60%);
          pointer-events: none; z-index: 0;
        }

        /* ── RUANG 3D BESAR (TIDAK TERTUMPUK TEKS) ── */
        .lp-canvas-showcase {
          width: 100%;
          max-width: 1200px;
          height: 60vh; /* Ruang sangat lega untuk model */
          min-height: 480px;
          position: relative;
          z-index: 10;
          cursor: grab;
        }
        .lp-canvas-showcase:active { cursor: grabbing; }

        .lp-loader {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
          z-index: 8; transition: opacity .8s;
        }
        .lp-loader.gone { opacity: 0; pointer-events: none; }
        .lp-spin {
          width: 40px; height: 40px;
          border: 2px solid rgba(236,72,153,.2);
          border-top-color: #ec4899; border-radius: 50%;
          animation: spin .8s linear infinite;
        }
        @keyframes spin{ to{ transform: rotate(360deg); } }

        /* ── KONTROL TEPAT DI BAWAH 3D ── */
        .lp-controls-wrapper {
          position: relative;
          display: flex; gap: 1.5rem; justify-content: center;
          margin-top: -1rem;
          margin-bottom: 4rem; /* Memisahkan kontrol dengan teks utama */
          z-index: 20;
          pointer-events: auto;
        }
        .lp-ctrl {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 0.8rem 2.2rem;
          border-radius: 999px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 0.85rem;
          letter-spacing: .12em; text-transform: uppercase;
          cursor: pointer; transition: all .3s cubic-bezier(.4,0,.2,1);
          border: 1px solid rgba(255,255,255,0.08); 
          background: rgba(8, 8, 12, 0.7);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          color: #cbd5e1;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .lp-ctrl-on {
          background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(190,24,93,0.05));
          color: #ff2a85; border-color: rgba(236,72,153,0.5);
          box-shadow: 0 0 25px rgba(236,72,153,.25), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .lp-ctrl-on:hover { background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(190,24,93,0.15)); box-shadow: 0 0 40px rgba(236,72,153,.45); transform: translateY(-4px); }
        .lp-ctrl-off:hover { border-color: rgba(236,72,153,0.6); color: #ff2a85; background: rgba(236,72,153,0.08); transform: translateY(-4px); box-shadow: 0 10px 20px rgba(236,72,153,.15); }

        /* ── TEKS UTAMA (DI BAWAH KONTROL 3D) ── */
        .lp-hero-text {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 0 1.5rem;
          max-width: 900px;
          pointer-events: auto;
        }

        .lp-h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(3rem, 7vw, 6rem);
          font-weight: 900; 
          line-height: 1.05; 
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
          color: #fff;
          text-shadow: 0 0 60px rgba(236,72,153,0.2);
        }
        .lp-grad {
          background: linear-gradient(135deg, #ff2a85 0%, #ec4899 50%, #9013fe 100%);
          background-size: 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: lp-g 6s ease infinite;
        }
        @keyframes lp-g {
          0%{ background-position:0% 50%; }
          50%{ background-position:100% 50%; }
          100%{ background-position:0% 50%; }
        }
        .lp-sub {
          font-size: 1.15rem; color: #94a3b8; line-height: 1.8;
          max-width: 700px; margin: 0 auto 3.5rem;
        }

        .lp-scroll {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          color: #94a3b8; font-size: 0.65rem; font-weight: 600;
          letter-spacing: .15em; text-transform: uppercase;
          cursor: pointer; animation: lp-bob 2s ease-in-out infinite;
          font-family: 'Space Grotesk', sans-serif;
          z-index: 20;
          margin-top: 1rem;
        }
        @keyframes lp-bob {
          0%,100%{ transform: translateY(0); }
          50%{ transform: translateY(5px); }
        }

        /* ── INFORMASI SENSOR (TEMA CYBERPUNK HUD) ── */
        .lp-info-section {
          max-width: 1200px; margin: 0 auto; padding: 7rem 1.5rem 5rem;
          position: relative;
          scroll-margin-top: 100px;
        }
        .lp-section-header {
          text-align: center; margin-bottom: 5rem;
          position: relative;
        }
        .lp-section-header::before {
          content: 'SYSTEM READINGS';
          position: absolute; top: -2.5rem; left: 50%; transform: translateX(-50%);
          font-family: 'Space Grotesk', sans-serif; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.3em;
          color: rgba(236,72,153,0.4);
        }
        .lp-stitle {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 900; margin-bottom: 1rem;
          color: #fff; letter-spacing: -0.02em;
          text-shadow: 0 0 40px rgba(236,72,153,0.2);
        }
        .lp-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
        }
        @media(max-width:1024px){ .lp-stats{ grid-template-columns: repeat(2, 1fr); } }
        @media(max-width:560px){ .lp-stats{ grid-template-columns: 1fr; } }
        
        .lp-stat {
          position: relative;
          background: var(--glass-bg);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-top: 1px solid rgba(236,72,153,0.2);
          border-radius: 20px; padding: 2rem 1.8rem;
          display: flex; flex-direction: column; gap: 1.2rem;
          transition: all .4s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .lp-stat::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--stat-glow, linear-gradient(90deg, #ff2a85, #9013fe));
          opacity: 0.4; transition: opacity 0.4s;
        }
        .lp-stat:hover { 
          transform: translateY(-8px); 
          border-color: rgba(255,255,255,0.08); 
          box-shadow: 0 30px 60px rgba(0,0,0,0.6); 
        }
        .lp-stat:hover::before { opacity: 1; }
        
        .lp-stat-top { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .lp-stat-icon {
          width: 50px; height: 50px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          box-shadow: 0 0 25px rgba(0,0,0,0.5);
        }
        .lp-stat-indicator {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 10px #10b981;
          animation: lp-pulse 2s infinite;
        }
        @keyframes lp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        
        .lp-stat-label { font-size: 0.8rem; color: #94a3b8; font-weight: 600; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.1em; margin-top: auto; }
        .lp-stat-val { font-size: 2.2rem; font-weight: 900; color: #f8fafc; font-family: 'Space Grotesk', sans-serif; line-height: 1; display: flex; align-items: baseline; gap: 5px; }
        .lp-stat-val span { font-size: 1rem; color: #64748b; font-weight: 700; }

        /* ── MAGICAL GACHA CARDS (COVERFLOW) ── */
        .gacha-carousel-container {
          position: relative; width: 100%; height: 550px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          margin-top: 3rem; overflow: hidden;
        }
        .gacha-carousel {
          position: relative; width: 100%; max-width: 650px; height: 480px;
          display: flex; align-items: center; justify-content: center;
          perspective: 1500px; transform-style: preserve-3d;
        }
        
        .gacha-wrapper {
          position: absolute;
          width: 320px; height: 460px;
          transform-origin: center center; cursor: pointer;
        }

        .gacha-card-inner {
          position: absolute; inset: 0;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease;
          transform-style: preserve-3d;
          border-radius: 24px;
        }

        .gacha-wrapper.active:hover .gacha-card-inner {
            transform: translateY(-10px) rotateY(180deg) !important;
        }

        .gacha-frame {
          position: absolute; inset: 0; z-index: 1;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
        }

        .gacha-front { transform: rotateY(0deg); }
        .gacha-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, rgba(15,15,20, 0.95), rgba(8,10,15, 0.98));
          display: flex; flex-direction: column; 
          padding: 2.5rem 1.8rem;
        }
        .gacha-back-content { position: relative; z-index: 2; width: 100%; height: 100%; display: flex; flex-direction: column; }

        .gacha-modern-border {
          position: absolute; inset: 0; padding: 2px;
          border-radius: 24px;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude; pointer-events: none;
          transition: background 0.6s ease;
        }

        .gacha-inner { width: 100%; height: 100%; position: relative; }
        .gacha-bg { 
          position: absolute; inset: 0; 
          background-size: cover; background-position: center;
          transition: transform 0.6s cubic-bezier(.4,0,.2,1);
        }
        .gacha-wrapper:hover .gacha-bg { transform: scale(1.08); }
        .gacha-inner-glow { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: overlay; border-radius: 20px; }

        .gacha-content {
          position: absolute; inset: 0; z-index: 2;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
          padding: 1.5rem;
        }
        
        .gacha-info {
          text-align: left; width: 100%;
          background: rgba(10, 10, 15, 0.4);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          padding: 1.2rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        .gacha-name {
          font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; color: #fff; font-weight: 800; 
          text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2; margin-bottom: 0.4rem;
        }
        
        .gacha-nim {
          font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.15em; 
        }

        .gacha-arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 30;
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2), inset 0 0 15px rgba(255,255,255,0.02);
        }
        .gacha-arrow:hover { 
          background: rgba(236,72,153,0.1); 
          border-color: rgba(236,72,153,0.4); 
          color: #fff; 
          transform: translateY(-50%) scale(1.1); 
          box-shadow: 0 15px 35px rgba(236,72,153,0.2), inset 0 0 20px rgba(236,72,153,0.3);
        }
        .gacha-arrow:active { transform: translateY(-50%) scale(0.95); }
        .gacha-arrow.left { left: calc(50% - 420px); }
        .gacha-arrow.right { right: calc(50% - 420px); }
        
        @media(max-width: 900px) {
          .gacha-arrow.left { left: 1rem; width: 50px; height: 50px; }  
          .gacha-arrow.right { right: 1rem; width: 50px; height: 50px; }  
        }

        .gacha-pagination {
           position: absolute; bottom: 0; display: flex; gap: 12px; z-index: 20;
        }
        .gacha-dot {
           width: 35px; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.15);
           cursor: pointer; transition: all 0.4s;
        }
        .gacha-dot:hover { background: rgba(255,255,255,0.4); }
        .gacha-dot.active { background: #ec4899; box-shadow: 0 0 15px #ec4899; width: 55px; }

        /* Light mode logic */
        .lp.light .gacha-frame { border-color: rgba(0,0,0,0.1); }
        .lp.light .gacha-back { background: linear-gradient(135deg, rgba(255,255,255, 0.95), rgba(240,240,245, 0.98)); }
        .lp.light .gacha-back-content ul { color: #475569 !important; }
        .lp.light .gacha-info { background: rgba(255, 255, 255, 0.4); border-color: rgba(0,0,0,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .lp.light .gacha-name { color: #0f172a; }
        .lp.light .gacha-arrow { background: rgba(255,255,255,0.4); border-color: rgba(0,0,0,0.1); color: rgba(0,0,0,0.6); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .lp.light .gacha-arrow:hover { background: rgba(236,72,153,0.1); border-color: rgba(236,72,153,0.3); color: #ec4899; box-shadow: 0 10px 20px rgba(236,72,153,0.2); }
        .lp.light .gacha-dot { background: rgba(0,0,0,0.15); }
        .lp.light .gacha-dot.active { background: #ec4899; }

        /* ── INFORMASI SISTEM ── */
        .lp-info-simple {
          text-align: center; max-width: 900px; margin: 0 auto; padding: 4rem 1.5rem 8rem;
          position: relative;
        }
        .lp-info-simple::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 80%; height: 1px; background: linear-gradient(90deg, transparent, rgba(236,72,153,0.3), transparent);
        }
        .lp-tags { display: flex; flex-wrap: wrap; gap: 1.2rem; justify-content: center; margin-top: 3.5rem; }
        .lp-tag {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 12px 24px;
          background: rgba(15,15,20,0.65); border: 1px solid rgba(255,255,255,.07);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border-radius: 999px; font-size: .85rem; font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #e2e8f0;
          transition: all .3s cubic-bezier(.4,0,.2,1); letter-spacing: 0.05em; text-transform: uppercase;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .lp-tag:hover { border-color: #ec4899; color: #fff; background: rgba(236,72,153,0.12); transform: translateY(-3px); box-shadow: 0 10px 25px rgba(236,72,153,0.25); }

        /* ── TECH STACK ── */
        .lp-tech-stack {
          max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 6rem;
          text-align: center;
        }
        .lp-tech-title {
          font-family: 'Space Grotesk', sans-serif; font-size: 0.75rem; 
          font-weight: 800; letter-spacing: 0.25em; color: #475569; margin-bottom: 2.5rem;
          text-transform: uppercase;
        }
        .lp-tech-logos {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 4rem; align-items: center;
        }
        .lp-tech-logos img {
          height: 32px; filter: grayscale(100%) opacity(0.4);
          transition: all 0.4s cubic-bezier(.4,0,.2,1); cursor: default;
        }
        .lp-tech-logos img:hover {
          filter: grayscale(0%) opacity(1); transform: translateY(-5px) scale(1.1);
        }

        /* ── FOOTER ── */
        .lp-footer {
          max-width: 1200px; margin: 0 auto;
          border-top: 1px solid rgba(255,255,255,.04);
          padding: 2.5rem 1.5rem; display: flex; align-items: center;
          justify-content: space-between; flex-wrap: wrap; gap: 1rem;
          font-family: 'Space Grotesk', sans-serif;
        }
        .lp-copy { font-size: .85rem; color: #64748b; font-weight: 600;}

        /* ── NOISE OVERLAY ── */
        .lp-noise {
          position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .lp.light .lp-noise { opacity: 0.05; mix-blend-mode: multiply; }

        /* ── SCROLL REVEAL ANIMATIONS ── */
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .reveal-on-scroll.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .lp-stats .reveal-on-scroll:nth-child(1) { transition-delay: 0.05s; }
        .lp-stats .reveal-on-scroll:nth-child(2) { transition-delay: 0.15s; }
        .lp-stats .reveal-on-scroll:nth-child(3) { transition-delay: 0.25s; }
        .lp-stats .reveal-on-scroll:nth-child(4) { transition-delay: 0.35s; }
      `}</style>

      <div className={`lp ${!isDark ? 'light' : ''}`}>
        <div className="lp-noise"></div>
        {/* NAV */}
        <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`}>
          <div className="lp-nav-inner">
            <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="lp-logo-icon"><Cloud size={18} color="#fff" /></div>
              Smart Canopy
            </div>
            
            <ul className="lp-nav-links">
              <li><a onClick={() => goto(infoRef)}>Fitur Sensor</a></li>
              <li><a onClick={() => goto(teamRef)}>Tim Pengembang</a></li>
            </ul>
            
            <div className="lp-nav-actions">
               {setIsDark && (
                 <button className="lp-theme-btn" onClick={() => setIsDark(!isDark)}>
                   {isDark ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
               )}

               {/* BURGER BUTTON WITH DROPDOWN */}
               <div style={{ position: 'relative' }}>
                 <button
                   className={`lp-nav-burger${mobileNav ? ' open' : ''}`}
                   onClick={() => setMobileNav(!mobileNav)}
                   aria-label="Toggle menu"
                 >
                   <span /><span /><span />
                 </button>

                 {/* Click-outside backdrop */}
                 <div
                   className={`lp-dropdown-backdrop${mobileNav ? ' open' : ''}`}
                   onClick={() => setMobileNav(false)}
                 />

                  {/* Glass dropdown */}
                  <div className={`lp-dropdown${mobileNav ? ' open' : ''}`}>
                    <div className="lp-dropdown-label">Navigasi</div>
                    <div className="lp-dropdown-item" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileNav(false); }}>
                      <div className="lp-dropdown-item-icon"><Cloud size={15} color="#ec4899" /></div>
                      Home
                    </div>
                    <div className="lp-dropdown-item" onClick={() => goto(infoRef)}>
                      <div className="lp-dropdown-item-icon"><Activity size={15} color="#ec4899" /></div>
                      Fitur Sensor
                    </div>
                    <div className="lp-dropdown-item" onClick={() => goto(teamRef)}>
                      <div className="lp-dropdown-item-icon"><Shield size={15} color="#ec4899" /></div>
                      Tim Pengembang
                    </div>
                    <div className="lp-dropdown-divider" />
                    <div className="lp-dropdown-cta" onClick={() => { navigate('/login'); setMobileNav(false); }}>
                      <span>Akses Dashboard</span>
                      <ArrowRight size={15} />
                    </div>
                  </div>
            </div>
          </div>
          </div>
        </nav>

        {/* ── HERO SECTION ── */}
        <section className="lp-hero" ref={heroRef}>
          
          {/* 1. KANVAS 3D UTAMA */}
          <div className="lp-canvas-showcase">
            <div className={`lp-loader${modelLoaded ? ' gone' : ''}`}>
              <div className="lp-spin" />
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '.75rem', color: '#ec4899', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Loading Module...
              </p>
            </div>

            <Canvas camera={{ position: [0, 2.5, 9], fov: 45 }} shadows gl={{ antialias: true, alpha: true }}>
              <ambientLight intensity={0.45} />
              <directionalLight position={[4, 8, 4]} intensity={1.3} castShadow />
              <pointLight position={[-3, 3, -3]} intensity={0.9} color="#ec4899" />
              <pointLight position={[3, -1, 3]}  intensity={0.4} color="#be185d" />
              <Suspense fallback={null}>
                <Environment preset="night" />
                <CanopyModel isOpen={simulationOpen} onLoaded={onLoaded} />
                <Particles />
                <ContactShadows position={[0, -1.6, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />
              </Suspense>
              
              <OrbitControls 
                enableZoom={true} 
                enablePan={false} 
                enableRotate={true} 
                minDistance={3} 
                maxDistance={15} 
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.8}
              />
            </Canvas>
          </div>

          {/* 2. KONTROL TEPAT DI BAWAH 3D (Simulasi Lokal Saja) */}
          <div className="lp-controls-wrapper">
            <button className={`lp-ctrl ${!simulationOpen ? 'lp-ctrl-on' : 'lp-ctrl-off'}`} onClick={() => simulateCanopyAction(true)}>
              <Play size={14} /> Buka Kanopi
            </button>
            <button className={`lp-ctrl ${simulationOpen ? 'lp-ctrl-on' : 'lp-ctrl-off'}`} onClick={() => simulateCanopyAction(false)}>
              <Square size={14} /> Tutup Kanopi
            </button>
          </div>

          {/* 3. TEKS UTAMA (DI BAWAH KONTROL) */}
          <div className="lp-hero-text">
            <h1 className="lp-h1">
              Smart Canopy<br />
              <span className="lp-grad">Berbasis Sensor</span>
            </h1>
            <p className="lp-sub">
              Sistem kanopi cerdas yang mendeteksi perubahan cuaca secara real-time. Melindungi area Anda dari panas ekstrem dan hujan secara otomatis, tanpa intervensi.
            </p>
          </div>

          <div className="lp-scroll" onClick={() => goto(infoRef)}>
            <ChevronDown size={18} strokeWidth={2} /> Scroll Descend
          </div>
        </section>

        {/* ── INFORMASI SENSOR & SISTEM ── */}
        <div ref={infoRef} className="lp-info-section">
          
          <div className="lp-section-header reveal-on-scroll">
            <h2 className="lp-stitle">Metrik Lingkungan</h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', marginTop: '0.5rem' }}>Pembacaan sensor waktu nyata pada unit operasional.</p>
          </div>

          {/* Kartu Statistik Bergaya Modern UI HUD */}
          <div className="lp-stats">
            {[
              { icon: Thermometer, label: 'Suhu Rata-rata',    val: '28.5', unit: '°C',   bg: 'linear-gradient(135deg,#ff2a85,#ec4899)', statGlow: 'linear-gradient(90deg, #ff2a85, #ec4899)' },
              { icon: Droplets,    label: 'Kelembaban Udara',  val: '78',   unit: '%',    bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', statGlow: 'linear-gradient(90deg, #8b5cf6, #6d28d9)' },
              { icon: Wind,        label: 'Kecepatan Angin',   val: '12',   unit: 'km/h', bg: 'linear-gradient(135deg,#0ea5e9,#0369a1)', statGlow: 'linear-gradient(90deg, #0ea5e9, #0369a1)' },
              { icon: Sun,         label: 'Intensitas Cahaya', val: '820',  unit: 'lux',  bg: 'linear-gradient(135deg,#f59e0b,#c2410c)', statGlow: 'linear-gradient(90deg, #f59e0b, #c2410c)' },
            ].map(({ icon: Ico, label, val, unit, bg, statGlow }) => (
              <div className="lp-stat reveal-on-scroll" key={label} style={{ '--stat-glow': statGlow } as React.CSSProperties}>
                <div className="lp-stat-top">
                   <div className="lp-stat-icon" style={{ background: bg }}><Ico size={24} color="#fff" /></div>
                   <div className="lp-stat-indicator" />
                </div>
                <div>
                  <p className="lp-stat-val">{val} <span>{unit}</span></p>
                  <p className="lp-stat-label">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TIM PENGEMBANG (SWIPE CAROUSEL NATIVE) ── */}
        <div ref={teamRef} className="lp-team-section">
          <div className="lp-section-header reveal-on-scroll" style={{ marginBottom: '1rem' }}>
            <h2 className="lp-stitle">Tim Pengembang</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.5rem' }}>Pionir di balik Smart Canopy System.</p>
          </div>
          
          <TeamCarousel isDark={isDark} />
        </div>

        {/* Informasi Sistem Tambahan */}
        <div className="lp-info-simple reveal-on-scroll">
          <h2 className="lp-stitle" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
            Otomatisasi Penuh,<br/><span style={{ color: '#ec4899' }}>Tanpa Kompromi.</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: '1.5rem', marginTop: '1.5rem' }}>
            Dikendalikan oleh mikrokontroler presisi tinggi, sistem secara otonom menentukan kapan kanopi perlu dibuka atau ditutup tanpa memerlukan intervensi manual dari Anda.
          </p>
          
          <div className="lp-tags">
            <span className="lp-tag"><Activity size={18} color="#ec4899"/> Real-time Monitoring</span>
            <span className="lp-tag"><Cpu size={18} color="#ec4899"/> Modul ESP32</span>
            <span className="lp-tag"><Cloud size={18} color="#ec4899"/> Sinkronisasi Cloud</span>
            <span className="lp-tag"><Send size={18} color="#ec4899"/> Peringatan Telegram</span>
          </div>
        </div>

        {/* ── LOGO TEKNOLOGI YANG DIGUNAKAN ── */}
        <div className="lp-tech-stack reveal-on-scroll">
          <p className="lp-tech-title">Software & Technology Stack</p>
          <div className="lp-tech-logos">
             <img src="https://cdn.simpleicons.org/react/61DAFB" title="React" alt="React" />
             <img src="https://cdn.simpleicons.org/typescript/3178C6" title="TypeScript" alt="TypeScript" />
             <img src="https://cdn.simpleicons.org/javascript/F7DF1E" title="JavaScript" alt="JavaScript" />
             <img src="https://cdn.simpleicons.org/threedotjs/000000" title="Three.js" alt="Three.js" style={isDark ? { filter: 'grayscale(100%) invert(100%) opacity(0.5)' } : {}} />
             <img src="https://cdn.simpleicons.org/blender/F5792A" title="Blender" alt="Blender" />
             <img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" title="Tailwind CSS" alt="Tailwind CSS" />
             <img src="https://cdn.simpleicons.org/firebase/FFCA28" title="Firebase" alt="Firebase" />
             <img src="https://cdn.simpleicons.org/telegram/26A5E4" title="Telegram" alt="Telegram" />
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <p className="lp-copy">© 2026 Smart Canopy System</p>
          <div style={{ display: 'flex', gap: '2rem' }}>
             <a style={{ fontSize: '.85rem', color: '#64748b', cursor: 'pointer', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }} onClick={() => goto(infoRef)}>Fitur</a>
             <a style={{ fontSize: '.85rem', color: '#64748b', cursor: 'pointer', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }} onClick={() => navigate('/login')}>Dashboard</a>
          </div>
        </footer>

      </div>
    </>
  );
}

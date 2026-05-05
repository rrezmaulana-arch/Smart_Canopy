// 📁 src/pages/Dashboard.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CloudRain, Clock3, ThermometerSun, Zap, Home,
  ChevronRight, BarChart3, LineChart, Info, Navigation,
  Settings, Activity, Signal, Sliders, Sun
} from 'lucide-react';

import { useFirebaseData } from '@/contexts/FirebaseContext';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/ui/StatCard';


/**
 * COMPONENT: Graph
 */
function Graph({ data, isDark, height = 260, threshold }: any) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const padding = 20; // Dikurangi agar fit di mobile
  const width = 900;
  const strokeRef = useRef<SVGPathElement | null>(null);

  const maxVal = Math.max(100, ...(data?.map((d: any) => Math.max(d.rain, d.light)) || [0]));
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((val: any, idx: number) => {
      const x = padding + (idx / Math.max(1, data.length - 1)) * (width - padding * 2);
      const yRain = height - padding - ((val.rain - minVal) / range) * (height - padding * 2);
      const yLight = height - padding - ((val.light - minVal) / range) * (height - padding * 2);
      return { x, yRain, yLight, vRain: val.rain, vLight: val.light };
    });
  }, [data, height, range, minVal]);

  const rainPath = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((acc: string, point: any, i: number, a: any[]) => {
      if (i === 0) return `M ${point.x},${point.yRain}`;
      const p0 = a[i - 1];
      const cp1x = p0.x + (point.x - p0.x) / 2;
      return `${acc} C ${cp1x},${p0.yRain} ${cp1x},${point.yRain} ${point.x},${point.yRain}`;
    }, "");
  }, [points]);

  const lightPath = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((acc: string, point: any, i: number, a: any[]) => {
      if (i === 0) return `M ${point.x},${point.yLight}`;
      const p0 = a[i - 1];
      const cp1x = p0.x + (point.x - p0.x) / 2;
      return `${acc} C ${cp1x},${p0.yLight} ${cp1x},${point.yLight} ${point.x},${point.yLight}`;
    }, "");
  }, [points]);

  const thresholdY = useMemo(() => {
    return height - padding - (threshold / range) * (height - padding * 2);
  }, [threshold, height, range]);

  useEffect(() => {
    const path = strokeRef.current;
    if (!path || !rainPath) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
    path.style.strokeDashoffset = '0';
  }, [rainPath]);

  return (
    <div className="w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#EC4899" stopOpacity={isDark ? "0.2" : "0.08"} />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradRain" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor={isDark ? "#8B5CF6" : "#F472B6"} />
          </linearGradient>
          <linearGradient id="lineGradLight" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor={isDark ? "#D97706" : "#FCD34D"} />
          </linearGradient>
        </defs>

        <line
          x1={padding} y1={thresholdY} x2={width - padding} y2={thresholdY}
          stroke="#EC4899" strokeWidth={1.5}
          strokeDasharray="6 6" opacity={0.6}
          className="transition-all duration-300"
        />
        <text
          x={padding} y={thresholdY - 8}
          fill={isDark ? "#EC4899" : "#db2777"} fontSize="12" fontWeight="bold" opacity={0.8}
          style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
        >
          Threshold Limit
        </text>

        <path d={`${rainPath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`} fill="url(#areaGrad)" />
        <path ref={strokeRef} d={rainPath} fill="none" stroke="url(#lineGradRain)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d={lightPath} fill="none" stroke="url(#lineGradLight)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />

        {points.map((point: any, index: number) => (
          <g key={index}>
            <circle
              cx={point.x} cy={point.yRain} r={hoverIndex === index ? 6 : 0}
              fill="#fff" stroke="#EC4899" strokeWidth={2}
              className="transition-all duration-200"
            />
            <circle
              cx={point.x} cy={point.yLight} r={hoverIndex === index ? 6 : 0}
              fill="#fff" stroke="#F59E0B" strokeWidth={2}
              className="transition-all duration-200"
            />
            <rect
              x={point.x - 15} y={0} width={30} height={height}
              fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ==================== DASHBOARD MAIN ====================
export default function Dashboard() {
  const context = useOutletContext<{ isDark: boolean }>();
  const isDark = context?.isDark ?? true;
  const { user } = useAuth();

  // Menggunakan global state Firebase untuk mencegah lag & double query
  const { telemetry, isConnected, isHardwareOnline } = useFirebaseData();

  // Membongkar dari context
  const {
    intensitas = 0,
    cahaya = 0,
    Suhu = 0,
    status = 'UNKNOWN',
    mode = 'AUTO',
    threshold = 30
  } = telemetry;

  // Nilai dummy jika tidak terhubung
  const displayTemp = isHardwareOnline ? Suhu : '--';
  const displayRain = isHardwareOnline ? intensitas : '--';
  const displayLight = isHardwareOnline ? cahaya : '--';
  const displayStatus = isHardwareOnline ? (status === 'CLOSED' ? 'CLOSE' : 'OPEN') : 'OFFLINE';

  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
  const [chartGlowPos, setChartGlowPos] = useState({ x: 50, y: 50 });


  // ✨ LOGIKA ARRAY UNTUK GRAFIK (Ambil 1 hari / 24 data & simpan agar tidak kosong saat dibuka)
  const [chartData, setChartData] = useState<{rain: number, light: number}[]>(() => {
    const savedData = localStorage.getItem('canopy_chart_history_v2');
    if (savedData) {
      return JSON.parse(savedData);
    }
    return Array(24).fill({ rain: 0, light: 0 }); 
  });

  useEffect(() => {
    setChartData(prevData => {
      const newData = [...prevData.slice(1), { rain: intensitas, light: cahaya }];
      localStorage.setItem('canopy_chart_history_v2', JSON.stringify(newData));
      return newData;
    });
  }, [intensitas, cahaya]);

  const maxChartVal = Math.max(100, ...(chartData?.map(d => Math.max(d.rain, d.light)) || [0]));

  const handleChartMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setChartGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className={`max-w-[1400px] mx-auto p-4 sm:p-6 md:p-10 space-y-6 md:space-y-10 text-left transition-colors duration-700 relative`}>

      <div className={`absolute inset-0 pointer-events-none -z-10 opacity-[0.03] ${isDark ? 'invert-0' : 'invert'}`}
        style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      {/* HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 md:pb-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] flex items-center justify-center shrink-0 group transition-transform hover:scale-105">
            <Navigation size={24} className="text-white transform -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-green-500"></span>
              </span>
              <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Live System Node-A1
              </span>
            </div>
            <h1 className={`text-2xl md:text-4xl font-extrabold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Smart Canopy <span className="text-slate-400 font-light ml-1">Control</span>
            </h1>
          </div>
        </div>

        <div className={`flex items-center gap-4 md:gap-6 px-5 py-3 md:px-6 md:py-4 rounded-[2rem] w-full lg:w-auto transition-all duration-500 ${isDark ? 'bg-[#EC4899]/[0.06]' : 'bg-white shadow-sm'
          }`}>
          <div className="text-left md:text-right leading-tight flex-1 lg:flex-none">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter block mb-1">Ambient Temp</span>
            <span className={`text-xl md:text-2xl font-black tabular-nums ${!isConnected && 'opacity-30'} ${isDark ? 'text-white' : 'text-slate-800'}`}>{displayTemp}°C</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-slate-300/20" />
          <div className="p-2 md:p-2.5 bg-amber-500/10 rounded-xl">
            <ThermometerSun size={20} className="text-amber-500 animate-pulse md:w-6 md:h-6" />
          </div>
        </div>
      </header>

      {/* ✨ CARD STATISTIK REALTIME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Rain Flux Card */}
        <StatCard
          isDark={isDark}
          title="Rain Intensity"
          value={
            <div className="flex items-end gap-2">
              <span>{displayRain}</span>
              <span className={`text-xl font-bold mb-1 ${isDark ? 'text-pink-400/70' : 'text-pink-500/70'}`}>%</span>
            </div>
          }
          subtitle={
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              !isHardwareOnline ? (isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-400') :
              intensitas > threshold ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                !isHardwareOnline ? 'bg-slate-500' :
                intensitas > threshold ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'
              }`} />
              {!isHardwareOnline ? 'Awaiting device...' : intensitas > threshold ? 'Rain Detected' : 'Clear & Safe'}
            </span>
          }
          icon={<CloudRain />}
          iconColor="text-[#EC4899]"
        />

        {/* Canopy Status Card */}
        <StatCard
          isDark={isDark}
          title="Canopy Status"
          value={
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                !isHardwareOnline ? 'bg-slate-500' :
                status === 'CLOSED' ? 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
              } ${isHardwareOnline ? 'animate-pulse' : ''}`} />
              <span className={`${
                !isHardwareOnline ? (isDark ? 'text-slate-500' : 'text-slate-400') :
                status === 'CLOSED' ? 'text-rose-400' : 'text-emerald-400'
              }`}>{displayStatus}</span>
            </div>
          }
          subtitle={
            <span className="flex items-center gap-1">
              Live Telemetry <ChevronRight size={12} className={isDark ? 'text-pink-500/50' : 'text-slate-300'} />
            </span>
          }
          icon={<Home />}
          iconColor="text-[#EC4899]"
        />

        {/* Light Intensity Card */}
        <StatCard
          isDark={isDark}
          title="Light Intensity"
          value={
            <div className="flex items-end gap-2">
              <span>{displayLight}</span>
              <span className={`text-xl font-bold mb-1 ${isDark ? 'text-amber-400/70' : 'text-amber-500/70'}`}>Lux</span>
            </div>
          }
          subtitle={
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              !isHardwareOnline ? (isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-400') :
              cahaya < 40 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                !isHardwareOnline ? 'bg-slate-500' :
                cahaya < 40 ? 'bg-indigo-400' : 'bg-amber-400 animate-pulse'
              }`} />
              {!isHardwareOnline ? 'Awaiting device...' : cahaya < 40 ? 'Mendung / Cloudy' : 'Cerah / Sunny'}
            </span>
          }
          icon={<Sun />}
          iconColor="text-amber-500"
        />

        {/* Device Status Card */}
        <StatCard
          isDark={isDark}
          title="Device Status"
          value={
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                isHardwareOnline ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse' :
                isConnected ? 'bg-amber-500' : 'bg-slate-500'
              }`} />
              <span className={`text-2xl font-black ${
                isHardwareOnline ? 'text-emerald-400' :
                isConnected ? (isDark ? 'text-amber-400' : 'text-amber-600') :
                (isDark ? 'text-slate-500' : 'text-slate-400')
              }`}>
                {isHardwareOnline ? 'Online' : isConnected ? 'Standby' : 'Offline'}
              </span>
            </div>
          }
          subtitle={
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              isHardwareOnline ? 'bg-emerald-500/10 text-emerald-400' :
              isConnected ? 'bg-amber-500/10 text-amber-400' :
              (isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-400')
            }`}>
              {isHardwareOnline ? 'ESP32 Aktif' : isConnected ? 'DB Connected' : 'No Signal'}
            </span>
          }
          icon={<Signal className={!isHardwareOnline ? 'opacity-40' : ''} />}
          iconColor={isHardwareOnline ? 'text-emerald-500' : isConnected ? 'text-amber-500' : 'text-slate-500'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
        <section
          className={`lg:col-span-8 ${isDark ? "bg-[#03060C]/60 backdrop-blur-[40px]" : "bg-white/90 backdrop-blur-[40px]"} rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 relative overflow-hidden group/chart border ${isDark ? 'border-white/5' : 'border-slate-200/50 shadow-xl'}`}
          onMouseMove={handleChartMouseMove}
        >
          <div
            className="absolute inset-0 z-0 opacity-0 group-hover/chart:opacity-100 transition-opacity duration-1000 pointer-events-none"
            style={{
              background: isDark
                ? `radial-gradient(400px circle at ${chartGlowPos.x}% ${chartGlowPos.y}%, rgba(236, 72, 153, 0.1), transparent 70%)`
                : `radial-gradient(400px circle at ${chartGlowPos.x}% ${chartGlowPos.y}%, rgba(236, 72, 153, 0.04), transparent 70%)`
            }}
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-10 relative z-10 gap-4">
            <div>
              <h2 className={`text-lg md:text-xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Analisis Grafik Sensor
              </h2>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex -space-x-2">
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-transparent bg-pink-500`} />
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-transparent bg-amber-500`} />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Rain & Light Sync
                </span>
              </div>
            </div>

            <div className={`flex w-full sm:w-auto p-1.5 rounded-2xl transition-colors ${isDark ? 'bg-black/40' : 'bg-slate-100'}`}>
              <button
                onClick={() => setChartType('bar')}
                className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-bold transition-all ${chartType === 'bar' ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-500'}`}
              >
                <BarChart3 size={14} /> BAR
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-bold transition-all ${chartType === 'line' ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-500'}`}
              >
                <LineChart size={14} /> LINE
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-2 md:gap-6 h-[200px] md:h-[250px] min-w-[500px] md:min-w-0 relative z-10">
              <div className={`flex flex-col justify-between text-[9px] md:text-[10px] font-black uppercase pr-2 md:pr-6 border-r shrink-0 ${isDark ? 'text-slate-700 border-white/5' : 'text-slate-300 border-slate-100'}`}>
                <span>100%</span><span>50%</span><span>0%</span>
              </div>

              <div className="flex-1 flex items-end justify-between gap-[2px] md:gap-[4px] pt-4 relative">
                {chartType === 'bar' && (
                  <>
                    <div
                      className={`absolute left-0 right-0 border-t-2 border-dashed ${isDark ? 'border-pink-500/60' : 'border-pink-500/60'} z-20 pointer-events-none transition-all duration-300`}
                      style={{ bottom: `${(threshold / maxChartVal) * 100}%` }}
                    >
                      <span className={`absolute -top-4 left-0 text-[9px] md:text-[10px] font-bold ${isDark ? 'text-[#EC4899]' : 'text-pink-600'} uppercase tracking-widest`}>Threshold</span>
                    </div>

                    {chartData.map((val, idx) => (
                      <div key={idx} className="flex-1 relative group/bar flex items-end justify-center h-full cursor-pointer z-10 gap-[1px]">
                        {/* Bar Rain */}
                        <div
                          className={`w-1/2 rounded-t-sm md:rounded-t-md transition-all duration-500 ${isDark
                            ? 'bg-pink-500/40 group-hover/bar:bg-pink-400 group-hover/bar:scale-x-110'
                            : 'bg-pink-300/80 group-hover/bar:bg-pink-500 group-hover/bar:shadow-sm'
                            }`}
                          style={{ height: `${(val.rain / maxChartVal) * 100}%` }}
                        />
                        {/* Bar Light */}
                        <div
                          className={`w-1/2 rounded-t-sm md:rounded-t-md transition-all duration-500 ${isDark
                            ? 'bg-amber-500/40 group-hover/bar:bg-amber-400 group-hover/bar:scale-x-110'
                            : 'bg-amber-300/80 group-hover/bar:bg-amber-500 group-hover/bar:shadow-sm'
                            }`}
                          style={{ height: `${(val.light / maxChartVal) * 100}%` }}
                        />
                      </div>
                    ))}
                  </>
                )}
                {chartType === 'line' && (
                  <Graph data={chartData} isDark={isDark} threshold={threshold} />
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
          <StatCard
            isDark={isDark}
            title="System Integrity"
            value={isConnected ? "Nominal" : "Offline"}
            subtitle={<>{isConnected ? "All checks passed" : "Hardware connection failed"} <ChevronRight size={12} className={isDark ? "text-pink-500/50" : "text-slate-300"} /></>}
            icon={<Activity />}
            iconColor="text-[#EC4899]"
          >
            <div className={`w-full h-2 rounded-full mt-2 relative overflow-hidden ${isDark ? 'bg-black/40' : 'bg-slate-100'}`}>
              <div className={`absolute inset-0 transition-all ${isConnected ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-slate-500'}`} style={{ width: '100%' }} />
              {isConnected && <div className="absolute inset-0 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />}
            </div>
            <div className="flex justify-between mt-2 md:mt-3 text-[9px] md:text-[10px] font-bold text-slate-500">
              <span>Database Sync</span>
              <span className={isConnected ? "text-emerald-500" : "text-rose-500"}>{isConnected ? "Connected" : "Offline"}</span>
            </div>
          </StatCard>

          <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex-1 transition-all duration-500 flex flex-col justify-center border ${isDark ? 'bg-gradient-to-br from-[#EC4899]/[0.04] to-transparent border-white/5'
            : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
            }`}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-pink-500/10 text-pink-500' : 'bg-pink-50 text-pink-600'}`}>
                  <Sliders size={16} className="md:w-[18px] md:h-[18px]" />
                </div>
                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Batas Otomatis
                </span>
              </div>
              <span className={`text-2xl md:text-3xl font-black tabular-nums transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {threshold}<span className="text-pink-500 text-lg md:text-xl ml-0.5">%</span>
              </span>
            </div>

            <div className={`w-full h-1.5 rounded-full mb-4 md:mb-6 overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <div
                className="h-full bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] opacity-70 transition-all duration-300"
                style={{ width: `${threshold}%` }}
              />
            </div>

            <p className={`text-[10px] md:text-[11px] font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Sistem tertutup otomatis jika hujan di atas <span className={isDark ? "text-pink-400 font-bold" : "text-pink-600 font-bold"}>{threshold}%</span>.
            </p>
          </div>
        </div>
      </div>

      <footer className={`${isDark ? 'bg-[#03060C]/60 backdrop-blur-[40px] border border-white/5' : 'bg-white/90 backdrop-blur-[40px] border border-slate-200/50 shadow-xl'} rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-8 group transition-all duration-500`}>
        <div className="flex items-center gap-4 md:gap-6">
          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-500 ${isDark ? 'bg-white/5 text-slate-400 group-hover:bg-pink-500/10 group-hover:text-pink-500' : 'bg-slate-100 text-slate-500'}`}>
            <Clock3 size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="text-left">
            <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Mode Operasi</span>
            <div className={`text-lg md:text-xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {mode === 'AUTO' ? 'Sistem Otomatis' : 'Kendali Manual'} <span className="text-pink-500">.</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
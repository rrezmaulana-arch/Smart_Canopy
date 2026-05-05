// 📁 src/pages/Monitoring.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Activity, Waves, ShieldCheck, ArrowUpRight, Clock, Sun, Terminal, CloudRain, Wind, Cloud
} from 'lucide-react';

// ✨ IMPORT FIREBASE CONTEXT
import { useFirebaseData } from '../contexts/FirebaseContext';

const getGlassEffect = (isDark: boolean) => {
  return isDark
    ? "bg-[#03060C]/60 backdrop-blur-[40px] border-white/5 shadow-[0_0_60px_rgba(0,0,0,1)]"
    : "bg-white/90 backdrop-blur-[40px] border-slate-200/50 shadow-xl shadow-slate-200/50";
};

const MonitoringStatCard = ({ label, val, icon: Icon, color, glowColor, dot, isDark }: any) => {
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${getGlassEffect(isDark)} p-5 sm:p-7 rounded-2xl sm:rounded-3xl border relative overflow-hidden group text-left transition-all duration-500 hover:-translate-y-1`}
    >
      <div
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: isDark
            ? `radial-gradient(300px circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor.replace('0.15', '0.2')}, transparent 70%)`
            : `radial-gradient(300px circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor.replace('0.15', '0.08')}, transparent 70%)`
        }}
      />

      <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10 pointer-events-none">
        <span className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </span>
        <div className={`p-2 sm:p-2.5 rounded-xl transition-colors ${color} ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
          <Icon size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className={`text-3xl sm:text-4xl font-bold tracking-tight relative z-10 pointer-events-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {val}
      </div>

      <div className={`mt-4 sm:mt-5 text-[10px] sm:text-[11px] font-medium flex items-center gap-2 relative z-10 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dot} shadow-[0_0_8px_currentColor] animate-pulse`} />
        Real-time feed
      </div>
    </div>
  );
};

// ==================== TERMINAL LOG COMPONENT ====================
const TerminalLog = ({ isDark, telemetry, isConnected }: { isDark: boolean, telemetry: any, isConnected: boolean }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const lastTelemetry = React.useRef(telemetry);

  useEffect(() => {
    if (!telemetry) return;
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const newLogs: string[] = [];
    
    // Check transitions or updates
    if (telemetry.intensitas > 20 && lastTelemetry.current?.intensitas <= 20) {
      newLogs.push(`[${time}] - Rain detected (${telemetry.intensitas}%), closing canopy...`);
      newLogs.push(`[${time}] - Canopy fully closed.`);
    } else if (telemetry.cahaya !== lastTelemetry.current?.cahaya || telemetry.intensitas !== lastTelemetry.current?.intensitas) {
      newLogs.push(`[${time}] - Sensor update: Light ${telemetry.cahaya} Lux, Rain ${telemetry.intensitas}%.`);
      newLogs.push(`[${time}] - Sending data to Firebase... Success.`);
    } else if (logs.length === 0) {
      newLogs.push(`[${time}] - System initialized. Listening for telemetry...`);
      if (isConnected) newLogs.push(`[${time}] - Connected to Firebase real-time database.`);
    }

    if (newLogs.length > 0) {
      setLogs(prev => [...prev, ...newLogs].slice(-12));
    }
    lastTelemetry.current = telemetry;
  }, [telemetry, isConnected]);

  return (
    <div className={`${isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-slate-900 border-slate-800'} p-4 sm:p-5 rounded-2xl sm:rounded-3xl border font-mono text-xs shadow-2xl flex flex-col h-full min-h-[220px] overflow-hidden relative group`}>
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none text-white">
        <Terminal size={100} />
      </div>
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10 relative z-10">
        <Terminal size={16} className="text-emerald-500" />
        <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Real-time Activity Log</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col justify-end space-y-2 custom-scrollbar relative z-10">
        {logs.length === 0 && (
          <div className="text-slate-500 opacity-80">Waiting for system activities...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className={`${isDark ? 'text-slate-300' : 'text-slate-300'} break-words tracking-tight`}>
            {log.includes('Rain') || log.includes('closing') || log.includes('closed') ? (
              <span className="text-amber-400">{log}</span>
            ) : log.includes('Success') || log.includes('Connected') ? (
              <span className="text-emerald-400">{log}</span>
            ) : (
              <span className="opacity-80">{log}</span>
            )}
          </div>
        ))}
        {logs.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-emerald-500">root@canopy:~#</span>
            <span className="w-1.5 h-3.5 bg-slate-400 animate-pulse"></span>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== WEATHER REPORT COMPONENT ====================
const WeatherReport = ({ isDark }: { isDark: boolean }) => {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-7.9553&longitude=112.6125&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&timezone=Asia%2FJakarta')
      .then(res => res.json())
      .then(data => setWeather(data.current))
      .catch(err => console.error(err));
  }, []);

  const getWeatherDesc = (code: number) => {
    if (code <= 3) return 'Cerah / Berawan';
    if (code <= 48) return 'Berkabut';
    if (code <= 55) return 'Gerimis';
    if (code <= 65) return 'Hujan Sedang';
    if (code <= 77) return 'Hujan Salju';
    if (code <= 99) return 'Badai Petir';
    return 'Tidak Diketahui';
  };

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="text-amber-400 w-12 h-12 sm:w-16 sm:h-16" />;
    if (code <= 48) return <Cloud className="text-slate-400 w-12 h-12 sm:w-16 sm:h-16" />;
    if (code <= 65) return <CloudRain className="text-blue-400 w-12 h-12 sm:w-16 sm:h-16" />;
    return <CloudRain className="text-slate-400 w-12 h-12 sm:w-16 sm:h-16" />;
  };

  if (!weather) return (
     <div className={`${getGlassEffect(isDark)} p-5 rounded-2xl sm:rounded-3xl border flex items-center justify-center h-full min-h-[220px]`}>
       <div className="animate-pulse flex items-center gap-2 text-slate-400 font-medium text-sm">
         <Activity className="animate-spin" size={16} /> Memuat data cuaca...
       </div>
     </div>
  );

  return (
    <div className={`${getGlassEffect(isDark)} p-5 sm:p-7 rounded-2xl sm:rounded-3xl border flex flex-col justify-between h-full min-h-[220px] relative overflow-hidden group`}>
       <div className="absolute top-4 right-4 sm:top-6 sm:right-6 opacity-30 pointer-events-none group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700">
         {getWeatherIcon(weather.weather_code)}
       </div>
       <div className="relative z-10">
         <div className="flex items-center gap-2 mb-1 sm:mb-2">
           <div className={`p-1.5 sm:p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
             <CloudRain size={14} className="text-blue-500" />
           </div>
           <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
             Laporan Cuaca (Malang)
           </span>
         </div>
         <div className={`text-3xl sm:text-4xl lg:text-5xl font-black mt-2 tracking-tighter ${isDark ? 'text-white' : 'text-slate-800'}`}>
           {weather.temperature_2m}°<span className="text-2xl sm:text-3xl lg:text-4xl text-slate-400">C</span>
         </div>
         <div className={`text-xs sm:text-sm font-bold mt-1 tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
           {getWeatherDesc(weather.weather_code)}
         </div>
       </div>
       <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5 sm:mt-6 relative z-10">
         <div className={`flex flex-col gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
           <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
             <Wind size={12} /> Angin
           </div>
           <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{weather.wind_speed_10m} km/h</span>
         </div>
         <div className={`flex flex-col gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
           <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
             <Activity size={12} /> Lembab
           </div>
           <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{weather.relative_humidity_2m}%</span>
         </div>
       </div>
    </div>
  );
};

// ==================== GRAPH COMPONENT ====================
const Graph = ({ dataPoints, color, glow, isDark }: { dataPoints: any[]; color: string; glow: string; isDark: boolean }) => {
  if (dataPoints.length < 2) {
    return <div className="h-full flex items-center justify-center text-slate-500 text-sm font-medium">Waiting for Firebase data...</div>;
  }

  const MAX_DISPLAY_POINTS = 35;
  let displayData = dataPoints;

  if (dataPoints.length > MAX_DISPLAY_POINTS) {
    const step = Math.ceil(dataPoints.length / MAX_DISPLAY_POINTS);
    displayData = dataPoints.filter((_, i) => i % step === 0);
    if (displayData[displayData.length - 1] !== dataPoints[dataPoints.length - 1]) {
      displayData.push(dataPoints[dataPoints.length - 1]);
    }
  }

  const dataMaxRain = Math.max(...displayData.map(p => p.rain));
  const dataMaxLight = Math.max(...displayData.map(p => p.light));
  const dataMax = Math.max(dataMaxRain, dataMaxLight);
  const maxVal = dataMax === 0 ? 100 : Math.ceil(dataMax * 1.2);
  const minVal = 0;

  const svgWidth = 820;
  const svgHeight = 320;
  const padding = 40;

  const points = displayData.map((point, i) => {
    const x = padding + (i * (svgWidth - padding * 2)) / (displayData.length - 1);
    const normalizedRain = (point.rain - minVal) / (maxVal - minVal || 1);
    const normalizedLight = (point.light - minVal) / (maxVal - minVal || 1);
    const yRain = svgHeight - padding - normalizedRain * (svgHeight - padding * 2);
    const yLight = svgHeight - padding - normalizedLight * (svgHeight - padding * 2);
    return { x, yRain, yLight };
  });

  const pathDRain = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yRain}`).join(' ');
  const pathDLight = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yLight}`).join(' ');
  const areaPathD = `${pathDRain} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;

  const circleRadius = 4.5;
  const strokeW = "2.5";
  const mainLineW = "3.5";

  let lastRenderedTime = "";
  const gradientId = `fadeGradient-${color.replace('#', '')}`;

  return (
    // ✨ PERBAIKAN: Hapus preserveAspectRatio="none" agar font tidak melar saat SVG diskalakan.
    <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible font-sans">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={isDark ? "0.4" : "0.2"} />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line key={i} x1={padding} y1={svgHeight - padding - (svgHeight - padding * 2) * ratio} x2={svgWidth - padding} y2={svgHeight - padding - (svgHeight - padding * 2) * ratio} className={isDark ? "stroke-white/5" : "stroke-slate-200"} strokeWidth="1" strokeDasharray="4 4" />
      ))}

      <path d={areaPathD} fill={`url(#${gradientId})`} />
      
      {/* Rain Path */}
      <path d={pathDRain} fill="none" stroke={color} strokeWidth={mainLineW} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${glow})` }} />
      <path d={pathDRain} fill="none" stroke={color} strokeWidth="15" strokeOpacity={isDark ? "0.15" : "0.08"} strokeLinecap="round" strokeLinejoin="round" />

      {/* Light Path */}
      <path d={pathDLight} fill="none" stroke="#F59E0B" strokeWidth={mainLineW} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} style={{ filter: `drop-shadow(0 0 10px rgba(245,158,11,0.3))` }} />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.yRain} r={circleRadius} stroke={color} strokeWidth={strokeW} className={`${isDark ? 'fill-[#03060C]' : 'fill-white'} transition-all duration-300 cursor-pointer hover:r-[6px]`} />
          <circle cx={p.x} cy={p.yLight} r={circleRadius} stroke="#F59E0B" strokeWidth={strokeW} className={`${isDark ? 'fill-[#03060C]' : 'fill-white'} transition-all duration-300 cursor-pointer hover:r-[6px]`} />
        </g>
      ))}

      {displayData.map((point, i) => {
        const step = Math.max(1, Math.floor((displayData.length - 1) / 5));
        const isLabelPosition = i % step === 0 || i === displayData.length - 1;
        if (!isLabelPosition) return null;
        if (point.time === lastRenderedTime && i !== displayData.length - 1) return null;
        lastRenderedTime = point.time;

        const x = padding + (i * (svgWidth - padding * 2)) / (displayData.length - 1);
        return (
          <text key={i} x={x} y={svgHeight - 12} textAnchor="middle" className={isDark ? "fill-slate-400" : "fill-slate-500"} fontSize="11" fontWeight="bold">
            {point.time}
          </text>
        );
      })}

      <text x="12" y="44" className={isDark ? "fill-slate-400" : "fill-slate-500"} fontSize="11" fontWeight="bold">{maxVal}</text>
      <text x="12" y={svgHeight / 2 + 4} className={isDark ? "fill-slate-400" : "fill-slate-500"} fontSize="11" fontWeight="bold">{Math.ceil(maxVal / 2)}</text>
      <text x="12" y={svgHeight - 28} className={isDark ? "fill-slate-400" : "fill-slate-500"} fontSize="11" fontWeight="bold">0</text>
    </svg>
  );
};

export default function Monitoring() {
  const context = useOutletContext<{ isDark: boolean }>();
  const isDark = context?.isDark ?? true;

  const { telemetry, historyLogs, isConnected } = useFirebaseData();

  const [range, setRange] = useState<'1H' | '24H' | '7D'>('1H');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [graphGlowPos, setGraphGlowPos] = useState({ x: 50, y: 50 });

  // Map Context historyLogs to graph data format
  useEffect(() => {
    if (!historyLogs.length) {
      setHistoryList([]);
      return;
    }

    const now = Date.now();
    let timeThreshold = 0;

    if (range === '1H') timeThreshold = now - (1 * 60 * 60 * 1000);
    else if (range === '24H') timeThreshold = now - (24 * 60 * 60 * 1000);
    else if (range === '7D') timeThreshold = now - (7 * 24 * 60 * 60 * 1000);

    const formatted = historyLogs
      .filter((item) => (item.timestamp as number) >= timeThreshold)
      .sort((a, b) => (a.timestamp as number) - (b.timestamp as number)) // Urutkan kronologis
      .map((item) => {
        const dateObj = new Date(item.timestamp);
        let timeLabel = '';

        if (range === '1H') {
          timeLabel = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
        } else if (range === '24H') {
          timeLabel = `${dateObj.getHours().toString().padStart(2, '0')}:00`;
        } else if (range === '7D') {
          const namaHari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
          timeLabel = namaHari[dateObj.getDay()];
        }

        return {
          time: timeLabel,
          rain: item.intensitas || 0,
          light: item.cahaya || 0
        };
      });

    setHistoryList(formatted);
  }, [range, historyLogs]);

  const handleGraphMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGraphGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const theme = {
    '1H': { hex: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
    '24H': { hex: '#10B981', glow: 'rgba(16,185,129,0.3)' },
    '7D': { hex: '#8B5CF6', glow: 'rgba(139,92,246,0.3)' },
  }[range] || { hex: '#EC4899', glow: 'rgba(236,72,153,0.3)' };

  return (
    <div className={`max-w-[1400px] mx-auto p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-10 text-left transition-colors duration-700 relative`}>
      <div className={`absolute inset-0 pointer-events-none -z-10 opacity-[0.03] ${isDark ? 'invert-0' : 'invert'}`}
        style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      {/* HEADER */}
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pb-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} text-left`}>
        <div>
          <div className="flex items-center gap-3 mb-2 sm:mb-3">
            <div className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-[#EC4899] shadow-[0_0_10px_#ec4899]"></span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#EC4899] tracking-widest uppercase">Firebase Live</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Aktivitas \<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]">Pantau</span>
          </h1>
          <p className={`text-xs sm:text-sm font-medium mt-1 sm:mt-2 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Node: <span className={`font-bold tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>SN-01_VOKASI_UB</span>
          </p>
        </div>

        {/* UI STATUS KONEKSI */}
        <div className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[1.25rem] sm:rounded-[1.5rem] border transition-colors self-start sm:self-auto ${isDark ? 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}>
          <div className={`p-1.5 sm:p-2 rounded-xl transition-colors ${isConnected ? 'bg-emerald-500/10' : 'bg-red-500/10 animate-pulse'
            }`}>
            <ArrowUpRight className={`w-4 h-4 sm:w-5 sm:h-5 ${isConnected ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">DB Status</span>
            <span className={`text-xs sm:text-sm font-black tracking-wide ${isConnected ? 'text-emerald-500' : 'text-red-500'
              }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MonitoringStatCard isDark={isDark} label="Total Records" val={historyList.length} icon={Activity} color="text-pink-500" glowColor="rgba(236,72,153,0.15)" dot="bg-pink-500" />
        <MonitoringStatCard isDark={isDark} label="Light Intensity" val={`${telemetry.cahaya || 0} Lux`} icon={Sun} color="text-amber-500" glowColor="rgba(245,158,11,0.15)" dot="bg-amber-500" />
        <MonitoringStatCard isDark={isDark} label="Rain Intensity" val={`${telemetry.intensitas || 0}%`} icon={Waves} color="text-blue-500" glowColor="rgba(59,130,246,0.15)" dot="bg-blue-500" />
        <MonitoringStatCard isDark={isDark} label="System Status" val={isConnected ? "Active" : "Offline"} icon={ShieldCheck} color={isConnected ? "text-emerald-500" : "text-rose-500"} glowColor="rgba(16,185,129,0.15)" dot={isConnected ? "bg-emerald-500" : "bg-rose-500"} />
      </div>

      {/* NEW SECTION: WEATHER & TERMINAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
         <div className="lg:col-span-1">
            <WeatherReport isDark={isDark} />
         </div>
         <div className="lg:col-span-2">
            <TerminalLog isDark={isDark} telemetry={telemetry} isConnected={isConnected} />
         </div>
      </div>

      {/* GRAPH AREA */}
      <section
        className={`${getGlassEffect(isDark)} p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-[2.5rem] border relative overflow-hidden group/graph`}
        onMouseMove={handleGraphMouseMove}
      >
        <div className="absolute top-0 left-0 w-full h-[2px] transition-colors duration-700" style={{ backgroundColor: theme.hex, boxShadow: `0 0 20px ${theme.hex}` }} />
        <div
          className="absolute inset-0 z-0 opacity-0 group-hover/graph:opacity-100 transition-opacity duration-1000 pointer-events-none hidden sm:block"
          style={{
            background: isDark
              ? `radial-gradient(500px circle at ${graphGlowPos.x}% ${graphGlowPos.y}%, ${theme.glow.replace('0.3', '0.1')}, transparent 60%)`
              : `radial-gradient(500px circle at ${graphGlowPos.x}% ${graphGlowPos.y}%, ${theme.glow.replace('0.3', '0.04')}, transparent 60%)`
          }}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-10 relative z-10">
          <div className="text-left">
            <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Sensor Data Analysis</h3>
            <p className={`text-[10px] sm:text-xs font-bold mt-1 sm:mt-2 flex items-center gap-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <Clock size={14} /> Historical Scope
            </p>
          </div>

          <div className={`flex w-full md:w-auto p-1.5 rounded-2xl border overflow-x-auto hide-scrollbar ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            {(['1H', '24H', '7D'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 md:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-300 relative whitespace-nowrap ${range === r
                    ? `text-white shadow-md`
                    : `text-slate-500 hover:text-slate-800 ${isDark && 'hover:text-white hover:bg-white/5'}`
                  }`}
                style={{ backgroundColor: range === r ? theme.hex : 'transparent' }}
              >
                <span className="relative z-10">{r}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ✨ PERBAIKAN UTAMA: Wrapper dengan overflow-x-auto agar grafik bisa di-scroll di HP */}
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <div className="h-[250px] sm:h-[360px] min-w-[700px] relative z-10">
            <Graph dataPoints={historyList} color={theme.hex} glow={theme.glow} isDark={isDark} />
          </div>
        </div>
      </section>
    </div>
  );
}
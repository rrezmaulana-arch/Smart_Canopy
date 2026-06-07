// 📁 src/pages/Control.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CloudRain, Lock, Unlock,
  Cpu, Zap, Radio, Settings2,
  CheckCircle2, XCircle, Sun, Wifi, User
} from 'lucide-react';

import { ref, update, push } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import { useFirebaseData } from '../contexts/FirebaseContext';
import { useAuth } from '../hooks/useAuth';

// ─── DeviceBadge ─────────────────────────────────────────────────────────────
const DeviceBadge = ({ icon, label, model, active, isDark }: any) => (
  <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-700 ${
    active
      ? 'bg-pink-500/[0.06] border-pink-500/25 shadow-[0_0_20px_rgba(236,72,153,0.07)]'
      : isDark ? 'bg-white/[0.02] border-white/5 opacity-40' : 'bg-slate-50 border-slate-100 opacity-40'
  }`}>
    <div className={`p-2 rounded-xl transition-colors duration-700 ${active ? 'bg-pink-500/10 text-pink-400' : isDark ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 14 }) : icon}
    </div>
    <div className="text-left min-w-0">
      <div className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${active ? 'text-pink-400' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>{label}</div>
      <div className={`text-[11px] font-bold leading-none truncate ${active ? (isDark ? 'text-white' : 'text-slate-800') : isDark ? 'text-slate-600' : 'text-slate-400'}`}>{model}</div>
    </div>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse shrink-0" />}
  </div>
);

// ─── SensorPill ───────────────────────────────────────────────────────────────
const SensorPill = ({ icon, label, value, color, isDark }: any) => (
  <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50/80 border-slate-100'}`}>
    <div className={`p-2.5 rounded-xl ${color === 'blue' ? 'bg-blue-500/10 text-blue-400' : color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 16 }) : icon}
    </div>
    <div className="text-left">
      <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</div>
      <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Control() {
  const context = useOutletContext<{ isDark: boolean }>();
  const isDark = context?.isDark ?? false;
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Pengguna';
  const initial = displayName.charAt(0).toUpperCase();

  const [dbData, setDbData] = useState({
    intensitas: 0, cahaya: 0, status: 'OPEN', threshold: 65, mode: 'AUTO', position: 100
  });
  const [localMode, setLocalMode] = useState('AUTO');
  const [isActing, setIsActing] = useState(false);

  const { telemetry, isConnected, isHardwareOnline } = useFirebaseData();

  useEffect(() => {
    if (telemetry) {
      setDbData({
        intensitas: telemetry.intensitas,
        cahaya: telemetry.cahaya,
        status: telemetry.status,
        threshold: telemetry.threshold,
        mode: telemetry.mode,
        position: telemetry.position ?? (telemetry.status === 'CLOSED' ? 0 : 100),
      });
      setLocalMode(telemetry.mode);
    }
  }, [telemetry]);

  const saveToHistory = (actionLabel: string, changedData: any) => {
    push(ref(database, '/Data_Historis'), {
      sensors: {
        hujan: { intensitas: dbData.intensitas, isRaining: dbData.intensitas > 0 },
        cahaya: { lux: dbData.cahaya },
      },
      canopy: { status: dbData.status, position: dbData.position },
      settings: { mode: localMode, threshold: dbData.threshold },
      ...changedData,
      trigger: actionLabel,
      timestamp: Date.now()
    });
  };

  const toggleMode = () => {
    const newMode = localMode === 'AUTO' ? 'MANUAL' : 'AUTO';
    setLocalMode(newMode);
    update(ref(database, '/settings'), { mode: newMode })
      .then(() => saveToHistory(`Ubah Mode ke ${newMode}`, { settings: { mode: newMode } }));
  };

  const handleManualAction = async (newStatus: 'OPEN' | 'CLOSED') => {
    if (isActing) return;
    setIsActing(true);
    const newPos = newStatus === 'OPEN' ? 100 : 0;
    setLocalMode('MANUAL');
    try {
      await Promise.all([
        update(ref(database, '/canopy'), { status: newStatus, position: newPos }),
        update(ref(database, '/settings'), { mode: 'MANUAL' }),
      ]);
      saveToHistory(`Manual Command: ${newStatus}`, {
        canopy: { status: newStatus, position: newPos },
        settings: { mode: 'MANUAL' },
      });
    } finally {
      setTimeout(() => setIsActing(false), 1200);
    }
  };

  const isManual = localMode === 'MANUAL';
  const isClosed = dbData.status === 'CLOSED';
  const positionPct = dbData.position ?? (isClosed ? 0 : 100);

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-10 space-y-6 md:space-y-8 animate-in fade-in duration-700">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-all duration-700 shadow-lg ${
            isManual
              ? 'bg-gradient-to-br from-pink-500 to-rose-500 border-pink-400/30 text-white shadow-pink-500/30'
              : isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>{initial}</div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{displayName}</h1>
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Administrator</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
            isConnected
              ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-500'
          }`}>
            <Wifi size={12} />
            {isConnected ? 'Online' : 'Offline'}
          </div>
          {/* Mode Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-700 ${
            isManual
              ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isManual ? 'bg-pink-400' : 'bg-emerald-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isManual ? 'Manual' : 'Auto'}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 items-start">

        {/* LEFT — IoT Modules */}
        <div className="lg:col-span-3 space-y-3 order-3 lg:order-1">
          <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 pl-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>IoT Architecture</div>
          <DeviceBadge icon={<Cpu />} label="Processor" model="ESP-32 WROOM" active={isHardwareOnline} isDark={isDark} />
          <DeviceBadge icon={<Zap />} label="Actuator" model="Servo Motor" active={isManual} isDark={isDark} />
          <DeviceBadge icon={<Radio />} label="Network" model="Firebase RTDB" active={isConnected} isDark={isDark} />
          <DeviceBadge icon={<Settings2 />} label="Mode Kendali" model={isManual ? 'Manual Override' : 'Smart Auto'} active={true} isDark={isDark} />
          <DeviceBadge icon={<User />} label="Operator" model={displayName} active={isManual} isDark={isDark} />
        </div>

        {/* CENTER — Canopy Visualizer */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center gap-8">

          {/* Status ring + canopy visual */}
          <div className="relative flex flex-col items-center">
            {/* Outer glow ring */}
            <div className={`absolute inset-0 rounded-full blur-[60px] transition-all duration-1000 ${
              isClosed ? 'bg-rose-500/20' : 'bg-emerald-500/20'
            }`} style={{ top: '10%', left: '10%', right: '10%', bottom: '10%' }} />

            {/* Status label */}
            <div className={`text-[11px] font-black uppercase tracking-[0.8em] mb-4 transition-colors duration-700 ${
              isManual ? 'text-pink-400' : 'text-emerald-400'
            }`}>Current Status</div>

            {/* Big status text */}
            <h2 className={`text-6xl sm:text-7xl md:text-8xl font-black italic tracking-tighter uppercase leading-none transition-all duration-700 mb-2 ${
              isClosed
                ? isDark ? 'text-rose-400 drop-shadow-[0_0_30px_rgba(244,63,94,0.4)]' : 'text-rose-500'
                : isDark ? 'text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'text-emerald-600'
            }`}>
              {isClosed ? 'CLOSE' : 'OPEN'}
            </h2>

            {/* Position bar */}
            <div className="w-full max-w-xs mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Posisi Motor</span>
                <span className={`text-xs font-black tabular-nums ${isClosed ? 'text-rose-400' : 'text-emerald-400'}`}>{positionPct}%</span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-[1500ms] ease-in-out ${
                    isClosed
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                  }`}
                  style={{ width: `${positionPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                <span>Tertutup (0%)</span>
                <span>Terbuka (100%)</span>
              </div>
            </div>
          </div>

          {/* AUTO / MANUAL toggle */}
          <div className="flex flex-col items-center gap-3">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mode Sistem</span>
            <button
              onClick={toggleMode}
              className={`relative w-[220px] h-[68px] rounded-full border-4 flex items-center transition-all duration-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isManual
                  ? isDark ? 'bg-pink-500/10 border-pink-500/40 shadow-[0_0_30px_rgba(236,72,153,0.25)]' : 'bg-pink-50 border-pink-300'
                  : isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              {/* Sliding knob */}
              <div className={`absolute w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-xl transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isManual
                  ? 'left-[calc(100%-60px)] bg-gradient-to-tr from-pink-500 to-rose-400 border-pink-300/30 shadow-pink-500/50'
                  : `left-[4px] border-white/20 ${isDark ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-emerald-400 shadow-emerald-400/40'}`
              }`}>
                {isManual ? <Lock size={22} className="text-white" /> : <Unlock size={22} className="text-white" />}
              </div>
              <span className={`absolute w-full text-center text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${
                isManual ? 'text-pink-400/60 pr-10' : 'text-emerald-500/60 pl-10'
              }`}>
                {isManual ? 'Manual' : 'Otomatis'}
              </span>
            </button>
            <p className={`text-[10px] text-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {isManual ? 'Kontrol manual aktif — panel kendali siap digunakan' : 'Sistem berjalan otomatis berdasarkan sensor'}
            </p>
          </div>
        </div>

        {/* RIGHT — Sensor Data */}
        <div className="lg:col-span-3 space-y-3 order-2 lg:order-3">
          <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 pl-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Data Sensor Langsung</div>
          <SensorPill icon={<CloudRain />} label="Status Hujan" value={dbData.intensitas > 0 ? '🌧 Hujan' : '☀️ Cerah'} color="blue" isDark={isDark} />
          <SensorPill icon={<Sun />} label="Intensitas Cahaya" value={`${dbData.cahaya} Lux`} color="amber" isDark={isDark} />
          <SensorPill icon={<Zap />} label="Status Kanopi" value={isClosed ? '🔴 Tertutup' : '🟢 Terbuka'} color="emerald" isDark={isDark} />

          {/* Threshold display-only */}
          <div className={`p-4 rounded-2xl border mt-2 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Batas Hujan Auto</div>
            <div className="flex items-center gap-3">
              <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-500" style={{ width: `${dbData.threshold}%` }} />
              </div>
              <span className={`text-sm font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>{dbData.threshold}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MANUAL CONTROL PANEL ───────────────────────────────────────── */}
      <div className={`relative rounded-[2rem] md:rounded-[2.5rem] border overflow-hidden transition-all duration-700 ${
        !isManual ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'
      } ${isDark ? 'bg-[#03060C]/60 backdrop-blur-[40px] border-white/5' : 'bg-white/90 backdrop-blur-[40px] border-slate-200/50 shadow-xl'}`}>

        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] transition-colors duration-700 ${isManual ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-transparent'}`} />

        <div className="p-6 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-500'}`}>
              <Settings2 size={18} />
            </div>
            <div>
              <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Kendali Manual Kanopi</h3>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {isManual ? 'Pilih aksi di bawah untuk mengirim perintah ke ESP32' : 'Aktifkan mode manual untuk menggunakan panel ini'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">

            {/* CLOSE button */}
            <button
              onClick={() => handleManualAction('CLOSED')}
              disabled={isActing}
              className={`group relative flex flex-col items-center justify-center p-8 md:p-10 rounded-3xl border-2 transition-all duration-500 gap-4 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                isClosed
                  ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                  : `border-slate-500/10 ${isDark ? 'bg-white/[0.02] text-slate-500' : 'bg-slate-50 text-slate-400'} hover:border-rose-500/40 hover:bg-rose-500/5 hover:text-rose-400`
              } disabled:cursor-wait`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-rose-500/0 group-hover:from-rose-500/5 group-hover:to-rose-500/10 transition-all duration-500 rounded-3xl" />
              {isActing && isClosed ? (
                <div className="w-10 h-10 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
              ) : (
                <XCircle size={40} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
              )}
              <div className="text-center">
                <div className="text-[13px] font-black uppercase tracking-[0.2em]">Tutup Kanopi</div>
                <div className="text-[10px] mt-1 opacity-60 font-medium">Posisi → 0% (Tertutup)</div>
              </div>
              {isClosed && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              )}
            </button>

            {/* OPEN button */}
            <button
              onClick={() => handleManualAction('OPEN')}
              disabled={isActing}
              className={`group relative flex flex-col items-center justify-center p-8 md:p-10 rounded-3xl border-2 transition-all duration-500 gap-4 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                !isClosed
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                  : `border-slate-500/10 ${isDark ? 'bg-white/[0.02] text-slate-500' : 'bg-slate-50 text-slate-400'} hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-400`
              } disabled:cursor-wait`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10 transition-all duration-500 rounded-3xl" />
              {isActing && !isClosed ? (
                <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              ) : (
                <CheckCircle2 size={40} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
              )}
              <div className="text-center">
                <div className="text-[13px] font-black uppercase tracking-[0.2em]">Buka Kanopi</div>
                <div className="text-[10px] mt-1 opacity-60 font-medium">Posisi → 100% (Terbuka)</div>
              </div>
              {!isClosed && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// 📁 src/pages/Control.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Wind, CloudRain, Lock, Unlock,
  Cpu, Zap, Radio, Settings2, Activity, Sliders, Target,
  CheckCircle2, XCircle, Sun
} from 'lucide-react';

import { ref, update, push, serverTimestamp } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import { useFirebaseData } from '../contexts/FirebaseContext';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '@/components/ui/GlassCard';

interface DeviceBadgeProps {
  icon: React.ReactNode;
  label: string;
  model: string;
  active: boolean;
  isDark: boolean;
}

const DeviceBadge: React.FC<DeviceBadgeProps> = ({ icon, label, model, active, isDark }) => {
  const inactiveBg = isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200/40';
  const iconColor = active ? 'text-[#EC4899]' : isDark ? 'text-slate-600' : 'text-slate-400';
  const labelColor = active ? 'text-[#F472B6]' : isDark ? 'text-slate-600' : 'text-slate-400';
  const modelColor = active ? (isDark ? 'text-white' : 'text-slate-900') : isDark ? 'text-slate-700' : 'text-slate-500';

  return (
    <div className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-[800ms] ease-out ${active ? 'bg-pink-500/5 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)] translate-x-0' : `${inactiveBg} opacity-60`
      }`}>
      <div className={`transition-colors duration-[800ms] ${iconColor}`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 16 }) : icon}
      </div>
      <div className="text-left">
        <div className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 transition-colors duration-[800ms] ${labelColor}`}>{label}</div>
        <div className={`text-[11px] font-bold uppercase italic leading-none transition-colors duration-[800ms] ${modelColor}`}>{model}</div>
      </div>
    </div>
  );
};

export default function Control() {
  const context = useOutletContext<{ isDark: boolean }>();
  const isDark = context?.isDark ?? false;
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Pengguna';
  const initials = displayName.substring(0, 2).toUpperCase();

  const [dbData, setDbData] = useState({
    intensitas: 0,
    cahaya: 0,
    status: 'OPEN',
    threshold: 65,
    mode: 'AUTO'
  });

  const [localMode, setLocalMode] = useState('AUTO');
  const [localThreshold, setLocalThreshold] = useState(65);
  const [localPosition, setLocalPosition] = useState(100);

  // ✨ PERBAIKAN: Gunakan useRef untuk melacak status drag slider.
  // Ini mencegah Firebase menimpa nilai slider lokal saat kita sedang menggesernya.
  const isDraggingRef = useRef(false);

  const { telemetry, isConnected } = useFirebaseData();

  // Sync telemetry ke local state (sama seperti onValue sebelumnya)
  useEffect(() => {
    if (telemetry) {
      setDbData({
        intensitas: telemetry.intensitas,
        cahaya: telemetry.cahaya,
        status: telemetry.status,
        threshold: telemetry.threshold,
        mode: telemetry.mode
      });

      // Hanya update input lokal jika user tidak sedang menggeser
      if (!isDraggingRef.current) {
        setLocalMode(telemetry.mode);
        setLocalThreshold(telemetry.threshold);

        if (telemetry.position !== undefined) {
          setLocalPosition(telemetry.position);
        } else {
          if (telemetry.status === 'CLOSED') setLocalPosition(0);
          else if (telemetry.status === 'OPEN') setLocalPosition(100);
        }
      }
    }
  }, [telemetry]);

  const saveToHistory = (actionLabel: string, changedData: any) => {
    const historyRef = ref(database, '/Data_Historis');
    const logData = {
      intensitas: dbData.intensitas,
      cahaya: dbData.cahaya,
      status: dbData.status,
      mode: localMode,
      threshold: localThreshold,
      ...changedData,
      trigger: actionLabel,
      timestamp: serverTimestamp()
    };
    push(historyRef, logData);
  };

  const toggleMode = () => {
    const newMode = localMode === 'AUTO' ? 'MANUAL' : 'AUTO';
    setLocalMode(newMode);
    update(ref(database, '/'), { mode: newMode })
      .then(() => saveToHistory(`Ubah Mode ke ${newMode}`, { mode: newMode }));
  };

  const handleManualAction = (newStatus: 'OPEN' | 'CLOSED') => {
    const newPos = newStatus === 'OPEN' ? 100 : 0;
    setLocalPosition(newPos);
    setLocalMode('MANUAL');

    update(ref(database, '/'), {
      status: newStatus,
      position: newPos,
      mode: 'MANUAL'
    }).then(() => {
      saveToHistory(`Manual Command: ${newStatus}`, {
        status: newStatus,
        position: newPos,
        mode: 'MANUAL'
      });
    });
  };

  // ✨ PERBAIKAN: onChange HANYA mengubah state lokal untuk animasi UI yang mulus
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true; // Tandai bahwa user sedang memegang slider
    const val = Number(e.target.value);
    setLocalPosition(val);
  };

  // ✨ PERBAIKAN: onRelease (MouseUp/TouchEnd) baru menembak data ke Firebase
  const handlePositionRelease = (e: React.MouseEvent | React.TouchEvent) => {
    const val = Number((e.target as HTMLInputElement).value);
    const newStatus = val === 0 ? 'CLOSED' : val === 100 ? 'OPEN' : 'PARTIAL';

    setLocalMode('MANUAL'); // Paksa mode manual jika slider digerakkan

    update(ref(database, '/'), {
      position: val,
      mode: 'MANUAL',
      status: newStatus
    }).then(() => {
      saveToHistory(`Manual Slider: ${val}%`, {
        position: val,
        mode: 'MANUAL',
        status: newStatus
      });
      isDraggingRef.current = false; // Lepaskan tanda drag setelah selesai update
    });
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true; // Tandai sedang geser
    setLocalThreshold(Number(e.target.value));
  };

  const handleThresholdRelease = () => {
    update(ref(database, '/'), { threshold: localThreshold })
      .then(() => {
        saveToHistory(`Ubah Threshold (${localThreshold}%)`, { threshold: localThreshold });
        isDraggingRef.current = false; // Lepaskan tanda drag
      });
  };

  const isManual = localMode === 'MANUAL';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';
  const sliderTrack = isDark ? 'bg-white/10' : 'bg-slate-200';

  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-[800ms] relative">
      <div className={`absolute inset-0 pointer-events-none -z-10 opacity-[0.03] ${isDark ? 'invert-0' : 'invert'}`}
        style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg italic border transition-all duration-[800ms] ${isManual ? 'bg-pink-500/20 border-pink-500/40 text-pink-500' : isDark ? 'bg-white/5 border-white/10 text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>{initials.charAt(0)}</div>
          <div className="text-left">
            <h1 className={`text-2xl font-black italic uppercase tracking-tight leading-none ${textMain}`}>{displayName}</h1>
            <span className={`text-[10px] mt-1.5 block font-black uppercase tracking-[0.3em] ${textMuted}`}>Administrator</span>
          </div>
        </div>
        <div className={`px-5 py-2.5 rounded-full border transition-all duration-[800ms] flex items-center gap-3 ${isManual ? 'bg-pink-500/10 border-pink-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <div className={`w-2 h-2 rounded-full ${isManual ? 'bg-pink-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest italic ${isManual ? 'text-pink-500' : 'text-emerald-500'}`}>
            {isManual ? 'Manual Mode' : 'Auto Mode'}
          </span>
        </div>
      </div>

      {/* Central Control Hub */}
      <GlassCard isDark={isDark} className={`rounded-[3rem] p-8 md:p-14 relative overflow-hidden transition-all duration-1000`}>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
            <div className="text-left border-l-[3px] border-[#EC4899] pl-4 mb-8">
              <div className="text-[10px] font-black text-[#EC4899] uppercase tracking-[0.4em] mb-1.5">Module</div>
              <div className={`text-sm font-bold uppercase italic ${textMain}`}>IoT Architecture</div>
            </div>
            <div className="grid grid-cols-1 gap-3.5">
              <DeviceBadge icon={<Cpu />} label="Processor" model="ESP-32 WROOM" active={true} isDark={isDark} />
              <DeviceBadge icon={<Zap />} label="Actuator" model="Servo Motor" active={isManual} isDark={isDark} />
              <DeviceBadge icon={<Radio />} label="Network" model="Firebase DB" active={true} isDark={isDark} />
              <DeviceBadge icon={<Settings2 />} label="Mode" model={localMode === 'AUTO' ? 'Auto' : 'Manual'} active={isManual} isDark={isDark} />
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
            <div className="mb-14 text-center">
              <div className={`text-[11px] font-black uppercase tracking-[0.8em] mb-4 ${isManual ? 'text-[#EC4899]' : 'text-emerald-500'}`}>Current Status</div>
              <h2 className={`text-7xl md:text-[6.5rem] font-black italic tracking-tighter uppercase leading-none transition-all duration-700 ${isDark ? 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'text-slate-900 drop-shadow-[0_0_20px_rgba(236,72,153,0.15)]'}`}>
                {dbData.status === 'CLOSED' ? 'CLOSE' : dbData.status === 'OPEN' ? 'OPEN' : dbData.status}
              </h2>
            </div>

            <div className={`relative p-5 rounded-full border transition-all duration-[800ms] ${isManual ? 'bg-[#EC4899]/5 border-[#EC4899]/30 shadow-[0_0_40px_rgba(236,72,153,0.15)]' : 'bg-transparent border-transparent'}`}>
              <div className={`w-[260px] md:w-[300px] h-[90px] md:h-[100px] rounded-full border-[6px] relative flex items-center ${isDark ? 'bg-[#05070a] border-[#1a1f26]' : 'bg-slate-100 border-white shadow-inner'}`}>
                <button
                  onClick={toggleMode}
                  className={`absolute z-20 w-[68px] h-[68px] md:w-[76px] md:h-[76px] rounded-full flex items-center justify-center border-4 transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isManual
                    ? 'left-[calc(100%-68px-10px)] md:left-[calc(100%-76px-10px)] bg-gradient-to-tr from-[#EC4899] to-[#F43F5E] border-white/30 shadow-[0_0_40px_rgba(236,72,153,0.7)]'
                    : `left-[10px] ${isDark ? 'bg-emerald-600 border-white/20' : 'bg-emerald-500 border-emerald-200'}`
                    }`}
                >
                  {isManual ? <Lock size={28} className="text-white" /> : <Unlock size={28} className="text-white" />}
                </button>
                <span className={`absolute w-full text-center text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isManual ? 'text-pink-500/50 pr-8' : 'text-emerald-500/50 pl-8'}`}>
                  {isManual ? 'Manual' : 'Auto'}
                </span>
              </div>
            </div>
          </div>

          <div className={`lg:col-span-3 space-y-8 order-3`}>
            <div className="text-right border-r-[3px] border-[#3B82F6] pr-4 mb-8">
              <div className="text-[10px] font-black text-[#3B82F6] uppercase tracking-[0.3em] mb-1.5">Data Langsung</div>
              <div className={`text-sm font-bold uppercase italic ${textMain}`}>Info Cuaca</div>
            </div>
            <div className="space-y-7">
              <div className="text-right">
                <div className={`text-[10px] font-black uppercase mb-2 flex items-center justify-end gap-2 ${textMuted}`}><Wind size={14} /> Kec. Angin</div>
                <div className={`text-4xl font-black italic leading-none ${textMuted}`}>12.4 <span className="text-[12px] not-italic ml-1">km/h</span></div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-black uppercase mb-2 flex items-center justify-end gap-2 text-[#10B981]`}><CloudRain size={14} /> Curah Hujan</div>
                <div className={`text-4xl font-black italic leading-none ${textMain}`}>{dbData.intensitas} <span className="text-[12px] text-slate-400 not-italic ml-1">%</span></div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-black uppercase mb-2 flex items-center justify-end gap-2 text-amber-500`}><Sun size={14} /> Int. Cahaya</div>
                <div className={`text-4xl font-black italic leading-none ${textMain}`}>{dbData.cahaya} <span className="text-[12px] text-slate-400 not-italic ml-1">Lux</span></div>
              </div>
              <div className={`pt-7 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                <div className="flex flex-col items-end gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#EC4899]">Posisi Motor</span>
                  <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? 'bg-black border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <div className={`h-full transition-all duration-[1200ms] bg-[#EC4899] shadow-[0_0_10px_rgba(236,72,153,0.5)]`} style={{ width: `${localPosition}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Manual Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard isDark={isDark} className={`rounded-[2.5rem] p-8 space-y-6 transition-all duration-500 ${!isManual ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 border-b pb-4 border-slate-500/10">
            <Sliders size={20} className="text-pink-500" />
            <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${textMain}`}>Kendali Manual</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleManualAction('CLOSED')}
              className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 gap-3 ${dbData.status === 'CLOSED'
                ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-lg'
                : `border-slate-500/10 ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'} hover:border-pink-500/30`
                }`}
            >
              <XCircle size={32} strokeWidth={1.5} />
              <span className="text-[11px] font-black uppercase tracking-widest">Tutup Kanopi</span>
            </button>

            <button
              onClick={() => handleManualAction('OPEN')}
              className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 gap-3 ${dbData.status === 'OPEN'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg'
                : `border-slate-500/10 ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'} hover:border-emerald-500/30`
                }`}
            >
              <CheckCircle2 size={32} strokeWidth={1.5} />
              <span className="text-[11px] font-black uppercase tracking-widest">Buka Kanopi</span>
            </button>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-500/10">
            <div className="flex justify-between items-center mb-4">
              <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Atur Posisi</span>
              <span className={`text-sm font-black tabular-nums ${isDark ? 'text-pink-400' : 'text-pink-500'}`}>{localPosition}%</span>
            </div>
            <input
              type="range" min="0" max="100"
              value={localPosition}
              onChange={handlePositionChange}
              onMouseUp={handlePositionRelease}
              onTouchEnd={handlePositionRelease}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-pink-500 ${sliderTrack}`}
            />
            <div className="flex justify-between mt-2 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
              <span>0% (Tertutup)</span>
              <span>100% (Terbuka)</span>
            </div>
          </div>

          <p className={`text-[10px] text-center italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Tekan tombol untuk buka/tutup instan, atau geser slider untuk posisi tertentu.
          </p>
        </GlassCard>

        <GlassCard isDark={isDark} className={`rounded-[2.5rem] p-8 space-y-6 transition-all duration-500 ${!isManual ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-center border-b pb-4 border-slate-500/10">
            <div className="flex items-center gap-3">
              <Target size={20} className="text-emerald-500" />
              <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${textMain}`}>Sensitivitas Hujan</h3>
            </div>
            <span className={`text-2xl font-black tabular-nums ${textMain}`}>{localThreshold}%</span>
          </div>

          <input
            type="range" min="0" max="100"
            value={localThreshold}
            onChange={handleThresholdChange}
            onMouseUp={handleThresholdRelease}
            onTouchEnd={handleThresholdRelease}
            disabled={!isManual}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${sliderTrack} disabled:cursor-not-allowed`}
          />
          <div className="flex justify-between mt-2 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
            <span>Sangat Sensitif (0%)</span>
            <span>Kurang Sensitif (100%)</span>
          </div>
          {!isManual && (
            <p className={`text-[10px] text-center italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Alihkan ke Mode Manual untuk mengubah sensitivitas.
            </p>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
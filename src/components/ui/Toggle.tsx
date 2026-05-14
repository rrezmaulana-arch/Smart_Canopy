'use client';

import React from 'react';

// 1. Tipe data props wajib ada di sini
export type Props = {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  subLabel?: string;
  isDark?: boolean;
};

// 2. Wajib ada tulisan ": Props" di dalam kurung agar dikenali TypeScript
export default function Toggle({ on, onChange, label, subLabel, isDark = true }: Props) {
  return (
    <div 
      className={`flex items-center justify-between w-full group select-none p-3 rounded-2xl transition-all duration-500 border ${
        on 
          ? (isDark ? 'bg-[#EC4899]/10 border-[#EC4899]/30' : 'bg-pink-50 border-pink-200 shadow-sm') 
          : (isDark ? 'bg-white/[0.02] border-white/[0.05] hover:border-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
      }`}
    >
      <div className="text-left flex flex-col gap-0.5 pointer-events-none">
        {subLabel && (
          <div className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 transition-colors duration-500 ${
            on ? 'text-[#EC4899]' : (isDark ? 'text-slate-500' : 'text-slate-400')
          }`}>
            {subLabel}
          </div>
        )}
        {label && (
          <div className={`text-[11px] font-bold tracking-wide transition-colors duration-500 ${
            isDark ? 'text-white' : 'text-slate-700'
          }`}>
            {label}
          </div>
        )}
      </div>

      <div
        role="switch"
        aria-checked={on}
        tabIndex={0}
        onClick={() => onChange(!on)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!on);
          }
        }}
        className={`relative w-[56px] h-[28px] rounded-full p-1 transition-all duration-500 cursor-pointer border overflow-hidden shrink-0 ${
          on 
            ? 'bg-[#EC4899] border-[#EC4899] shadow-[0_0_20px_rgba(236,72,153,0.4)]' 
            : (isDark 
                ? 'bg-[#0F172A] border-white/10 shadow-inner' 
                : 'bg-slate-200 border-slate-300 shadow-inner')
        }`}
      >
        <div className={`absolute inset-0 transition-transform duration-700 ease-in-out bg-gradient-to-r from-[#EC4899] via-[#FF71B9] to-[#8B5CF6] ${
          on ? 'translate-x-0' : '-translate-x-full'
        }`} />
        
        <div
          className={`relative w-full h-full flex items-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            on ? 'translate-x-[28px]' : 'translate-x-0'
          }`}
        >
          <div
            className={`w-[20px] h-[20px] rounded-full transition-all duration-500 flex items-center justify-center shadow-lg ${
              on 
                ? 'bg-white' 
                : (isDark ? 'bg-slate-400' : 'bg-white')
            }`}
          >
            <div className={`transition-all duration-500 rounded-full ${
              on 
                ? 'w-2.5 h-2.5 bg-[#EC4899] shadow-[0_0_8px_#EC4899]' 
                : 'w-1.5 h-1.5 bg-slate-500/40'
            }`} />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-full" />
      </div>
    </div>
  );
}
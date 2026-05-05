import React, { useState } from 'react';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconColor?: string;
  glowColor?: string;
  badge?: React.ReactNode;
  isDark?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = "text-pink-500",
  glowColor = "rgba(236,72,153,0.15)",
  badge,
  isDark = true,
  className = "",
  children
}: StatCardProps) {
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const glassClass = isDark
    ? "bg-[#03060C]/60 backdrop-blur-[40px] border border-white/5 shadow-2xl"
    : "bg-white/90 backdrop-blur-[40px] border border-slate-200/50 shadow-xl shadow-slate-200/50";

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${glassClass} p-5 sm:p-7 rounded-2xl md:rounded-3xl relative overflow-hidden group text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-pink-500/10 flex flex-col h-full ${className}`}
    >
      {/* Background Glow */}
      <div
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: isDark
            ? `radial-gradient(300px circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 70%)`
            : `radial-gradient(300px circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor.replace(/0\.\d+/, '0.08')}, transparent 70%)`
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10 pointer-events-none gap-2">
        <span className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </span>
        {icon && (
          <div className={`p-2 sm:p-2.5 rounded-xl transition-colors shrink-0 ${iconColor} ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
            {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 20 }) : icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight relative z-10 pointer-events-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </div>

      {/* Subtitle / Badge */}
      {(subtitle || badge) && (
        <div className={`mt-4 sm:mt-5 text-[10px] sm:text-[11px] font-medium flex items-center gap-2 relative z-10 pointer-events-none transition-colors ${isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'}`}>
          {badge}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}

      {/* Embedded Children */}
      {children && (
        <div className="mt-4 sm:mt-5 relative z-10 w-full flex-1 flex flex-col justify-end">
          {children}
        </div>
      )}
    </div>
  );
}

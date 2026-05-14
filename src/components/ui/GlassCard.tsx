import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isDark?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({
  isDark = true,
  children,
  className = '',
  ...props
}: GlassCardProps) {
  const glassClass = isDark
    ? 'bg-[#03060C]/60 backdrop-blur-[40px] border border-white/5 shadow-2xl'
    : 'bg-white/90 backdrop-blur-[40px] border border-slate-200/50 shadow-xl shadow-slate-200/50';

  return (
    <div className={`${glassClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

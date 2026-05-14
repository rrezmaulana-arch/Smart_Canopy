// 📁 src/layouts/AuthLayout.tsx
'use client';

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

interface AuthLayoutProps {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
}

const AuthLayout = ({ isDark, setIsDark }: AuthLayoutProps) => {
  useEffect(() => {
    const bg = isDark ? '#030508' : '#F8FAFC';
    // Lock scroll and set background sync
    document.documentElement.style.cssText = `background-color:${bg}; overflow:hidden; height:100%;`;
    document.body.style.cssText = `background-color:${bg}; overflow:hidden; height:100%; margin:0; padding:0;`;
    
    return () => {
      document.documentElement.style.cssText = '';
      document.body.style.cssText = '';
    };
  }, [isDark]);

  return (
    <div className="fixed inset-0 flex items-center justify-center transition-colors duration-700 bg-transparent">
      {/* Background Layer (Subtle color blobs) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-15%] left-[-10%] w-[55%] h-[55%] blur-[130px] rounded-full ${isDark ? 'bg-pink-500/10' : 'bg-pink-400/20'}`} />
        <div className={`absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] blur-[130px] rounded-full ${isDark ? 'bg-violet-600/10' : 'bg-violet-400/15'}`} />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full max-w-[420px] px-4 animate-in fade-in zoom-in-95 duration-1000">
        <Outlet context={{ isDark, setIsDark }} />
      </div>
    </div>
  );
};

export default AuthLayout;

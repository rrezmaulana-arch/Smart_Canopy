import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

interface DashboardLayoutProps {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
}

const DashboardLayout = ({ isDark, setIsDark }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync body background with theme to prevent bleed-through on scroll
  useEffect(() => {
    const bg = isDark ? '#030508' : '#F8FAFC';
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.body.style.minHeight = '100vh';
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, [isDark]);

  return (
    <div
      className={`relative min-h-screen w-full flex transition-colors duration-700 bg-transparent ${
        isDark ? 'text-slate-200' : 'text-slate-900'
      }`}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDark={isDark}
        setIsDark={setIsDark}
      />

      {/* Main content scroll container */}
      <div className="flex-1 relative z-10 min-h-screen h-screen overflow-y-auto overflow-x-hidden scroll-smooth">
        
        {/* Mobile top bar */}
        <div className={`md:hidden px-4 py-3 sticky top-0 z-50 flex justify-between items-center backdrop-blur-md border-b transition-colors ${
          isDark
            ? 'bg-[#030508]/80 border-white/5'
            : 'bg-white/80 border-slate-200/60'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/10 text-pink-400'
                  : 'bg-slate-50 border-slate-200 text-pink-600'
              }`}
            >
              ☰
            </button>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-pink-500">SmartCanopy</span>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-end px-8 py-4 sticky top-0 z-[100] pointer-events-none">
          <div className="pointer-events-auto">
          </div>
        </div>

        <main className="w-full max-w-[1400px] mx-auto px-4 py-4 md:px-8 md:py-4 lg:px-10 lg:py-8">
          <Outlet context={{ isDark }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
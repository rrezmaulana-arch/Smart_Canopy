// 📁 src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Terminal, Bell,
  Database, X, LogOut, Sun, Moon, Cloud, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFirebaseData } from '@/contexts/FirebaseContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/monitoring', label: 'Monitoring', icon: Activity },
  { path: '/control', label: 'Control', icon: Terminal },
  { path: '/data', label: 'Data Historis', icon: Database },
];

export default function Sidebar({ isOpen, onClose, isDark, setIsDark }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Fitur Collapsible Desktop
  const [isCollapsed, setIsCollapsed] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Admin';
  const initials = displayName.substring(0, 2).toUpperCase();

  const { historyLogs } = useFirebaseData();
  const unreadCount = historyLogs.filter(log => !log.isRead).length;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebarWidth = isCollapsed ? 'w-[90px]' : 'w-[280px]';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed inset-y-0 left-0 md:relative z-50
        ${sidebarWidth} shrink-0 flex flex-col h-full md:h-[calc(100vh-2rem)]
        transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}
        rounded-r-[2.5rem] md:my-5 md:ml-8 md:rounded-[2.5rem]
        ${isDark
          ? 'bg-black/50 border border-white/5 backdrop-blur-[40px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_50px_rgba(0,0,0,0.8)]'
          : 'bg-white/90 border border-black/8 backdrop-blur-[32px] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_15px_40px_rgba(0,0,0,0.08)]'}
      `}>
        {/* Top: Logo + Close */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center border-b border-white/5' : 'justify-between'} px-5 py-6 transition-all duration-500`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/30 shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}>
              <Cloud size={20} className="text-white" />
            </div>

            {!isCollapsed && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className={`text-sm font-black uppercase tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Smart<span className="text-pink-500">Canopy</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-pink-400/80 mt-0.5">IoT Platform</div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleNav('/notifications')}
                className={`relative p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-pink-100 text-pink-500 hover:text-pink-600'}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsCollapsed(true)}
                className={`hidden md:flex relative p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-pink-100 text-pink-500'}`}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={onClose}
                className={`md:hidden p-1.5 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-pink-100 text-pink-500'}`}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {isCollapsed && (
          <div className="w-full flex flex-col items-center gap-3 mt-4">
            <button
              onClick={() => setIsCollapsed(false)}
              className={`hidden md:flex relative p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-pink-100 text-pink-500'}`}
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handleNav('/notifications')}
              className={`relative p-3 rounded-2xl transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-pink-100 text-pink-500'}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} space-y-2 overflow-y-auto mt-4 transition-all duration-300`}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                title={isCollapsed ? label : undefined}
                className={`relative w-full flex items-center ${isCollapsed ? 'justify-center p-3.5 rounded-2xl aspect-square' : 'gap-4 px-5 py-3.5 rounded-full'} font-bold transition-all duration-[400ms] outline-none overflow-hidden
                    ${active
                    ? (isDark
                      ? 'bg-white/90 text-black shadow-[0_4px_25px_rgba(255,255,255,0.2)]'
                      : 'bg-slate-900 text-white shadow-[0_4px_25px_rgba(0,0,0,0.15)]')
                    : (isDark
                      ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                  }
                `}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`shrink-0 ${active ? '' : 'opacity-80'}`} />
                {!isCollapsed && <span className="tracking-wide text-[15px] whitespace-nowrap">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom: User info */}
        <div className={`px-4 pb-5 pt-4 border-t ${isDark ? 'border-white/5' : 'border-black/10'} space-y-4`}>

          {/* Authentic Glass Theme Toggle */}
          <div className="flex justify-center w-full my-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`relative flex items-center transition-all duration-500 overflow-visible
                    ${isCollapsed ? 'w-[52px] h-[52px] rounded-[24px] justify-center' : 'w-[140px] h-[46px] rounded-[24px] px-4 justify-between'} 
                    ${isDark ? 'bg-black/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_4px_15px_rgba(0,0,0,1)]' : 'bg-slate-100 backdrop-blur-md border border-black/10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]'}
                  `}
            >
              {/* Texts behind the handle (Only visible when expanded) */}
              {!isCollapsed && (
                <div className="absolute inset-0 flex justify-between items-center w-full px-5 pointer-events-none">
                  <span className={`text-[12px] font-black uppercase tracking-widest transition-opacity duration-300 ${!isDark ? 'opacity-0' : 'text-slate-500'}`}>Dark</span>
                  <span className={`text-[12px] font-black uppercase tracking-widest transition-opacity duration-300 ${isDark ? 'opacity-0' : 'text-slate-600'}`}>Light</span>
                </div>
              )}

              {/* The VERTICAL OVAL ('Lonjong Tegak') Glass Lens Handle - Hitam Glossy */}
              <div className={`absolute flex items-center justify-center transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] 
                      shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_20px_rgba(0,0,0,0.6)] border bg-black/40 backdrop-blur-[24px]
                      ${isCollapsed ? 'w-full h-full left-0 border-white/20 rounded-[20px]' : 'w-[50px] h-[64px] rounded-[24px]'}
                      ${!isCollapsed && isDark ? 'left-[140px] -translate-x-[50px] border-white/10' : ''}
                      ${!isCollapsed && !isDark ? 'left-[0px] border-white/60 bg-white/40' : ''}
                  `}>
                {isDark ? (
                  <Moon size={20} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
                ) : (
                  <Sun size={20} className="text-slate-800 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </div>
            </button>
          </div>

          {/* User info card (Soft Neumorphic Style) */}
          {!isCollapsed ? (
            <div className={`flex items-center gap-3 p-2.5 rounded-full transition-all ${isDark ? 'bg-black/20 border border-white/5 shadow-[5px_5px_20px_rgba(0,0,0,0.4),-2px_-2px_15px_rgba(255,255,255,0.02)]' : 'bg-slate-100 border border-black/8 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'}`}>
              
              {/* Avatar Crater */}
              <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-black/30 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)]' : 'bg-slate-200/50 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-2px_-2px_6px_rgba(255,255,255,0.5)]'}`}>
                 <span className={`font-bold text-[15px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{initials[0]}</span>
              </div>
              
              <div className="flex-1 min-w-0 text-left pl-1">
                <div className={`text-[13px] font-semibold tracking-wide truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{displayName}</div>
                <div className={`text-[10px] font-medium tracking-wide mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Administrator</div>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all mr-1 ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center w-full mt-2">
              {/* Avatar Crater */}
              <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-black/30 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)]' : 'bg-slate-200/50 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-2px_-2px_6px_rgba(255,255,255,0.5)]'}`}>
                 <span className={`font-bold text-[16px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{initials[0]}</span>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className={`w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-black/20 text-slate-400 hover:text-slate-200 shadow-[5px_5px_15px_rgba(0,0,0,0.4),-2px_-2px_10px_rgba(255,255,255,0.02)] border border-white/5 hover:bg-white/5' : 'bg-slate-100 text-slate-600 hover:text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/10 hover:bg-slate-200'}`}
              >
                <LogOut size={18} strokeWidth={2}/>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

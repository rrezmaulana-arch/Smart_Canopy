// 📁 src/pages/Notifications.tsx
'use client';

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bell, AlertTriangle, ShieldCheck, Info,
  CheckCircle2, Clock, Trash2
} from 'lucide-react';
import { useFirebaseData } from '../contexts/FirebaseContext';
import { ref, update, remove } from 'firebase/database';
import { database } from '../services/firebaseConfig';

export default function Notifications() {
  const context = useOutletContext<{ isDark: boolean }>();
  // default to true if context not present (though it should be)
  const isDark = context?.isDark ?? true;
  const { historyLogs } = useFirebaseData();

  const markAsRead = (id: string, currentIsRead: boolean) => {
    if (currentIsRead) return;
    update(ref(database, `/Data_Historis/${id}`), { isRead: true }).catch(console.error);
  };

  const markAllAsRead = () => {
    historyLogs.forEach(log => {
      if (!log.isRead) {
        update(ref(database, `/Data_Historis/${log.id}`), { isRead: true }).catch(console.error);
      }
    });
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    remove(ref(database, `/Data_Historis/${id}`)).catch(console.error);
  };

  const clearAllNotifications = () => {
    if (window.confirm('Yakin ingin menghapus semua data histori / notifikasi dari Firebase?')) {
      remove(ref(database, `/Data_Historis`)).catch(console.error);
    }
  };

  // UI mapping
  const unreadCount = historyLogs.filter(log => !log.isRead).length;

  return (
    <div className={`max-w-[1400px] mx-auto p-4 sm:p-6 md:p-10 space-y-6 md:space-y-10 text-left transition-colors duration-700 relative`}>
      <div className={`absolute inset-0 pointer-events-none -z-10 opacity-[0.03] ${isDark ? 'invert-0' : 'invert'}`}
        style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      {/* HEADER */}
      <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 md:pb-8 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
            </span>
            <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              System Alerts
            </span>
          </div>
          <h1 className={`text-3xl md:text-5xl font-black tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pusat <span className="text-pink-500">Notifikasi</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-300 ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              <CheckCircle2 size={16} /> Mark All Read
            </button>
          )}
          {historyLogs.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-300 ${isDark ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'}`}
            >
              <Trash2 size={16} /> Delete All
            </button>
          )}
        </div>
      </header>

      {/* GRID LAYOUT NOTIFICATIONS */}
      <div className="space-y-4">
        {historyLogs.length === 0 ? (
           <div className={`p-10 text-center rounded-[2.5rem] border ${isDark ? 'bg-white/[0.02] border-white/5 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
              <Bell size={48} className={`mx-auto mb-4 opacity-50`} />
              <p className="font-bold">Tidak ada notifikasi aktif saat ini.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {historyLogs.map(log => {
               const isWarning = log.type === 'warning' || log.type === 'critical';
               const isSuccess = log.type === 'success';
               
               const icon = isWarning ? <AlertTriangle size={20} className={isDark ? 'text-amber-500' : 'text-amber-600'} /> :
                            isSuccess ? <ShieldCheck size={20} className={isDark ? 'text-emerald-500' : 'text-emerald-600'} /> :
                            <Info size={20} className={isDark ? 'text-blue-500' : 'text-blue-600'} />;
               
               const bgBadge = isWarning ? (isDark ? 'bg-amber-500/10' : 'bg-amber-100') :
                               isSuccess ? (isDark ? 'bg-emerald-500/10' : 'bg-emerald-100') :
                               (isDark ? 'bg-blue-500/10' : 'bg-blue-100');
                               
               return (
                 <div 
                   key={log.id}
                   onClick={() => markAsRead(log.id, log.isRead)}
                   className={`group relative flex flex-col items-start p-5 md:p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden ${
                     !log.isRead 
                     ? (isDark ? 'bg-[#03060C]/60 backdrop-blur-[40px] border-[#EC4899]/50 hover:bg-white/[0.05] shadow-[0_10px_30px_rgba(236,72,153,0.1)] hover:-translate-y-1' 
                               : 'bg-white border-pink-300 hover:bg-pink-50 shadow-xl shadow-pink-500/10 hover:-translate-y-1') 
                     : (isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' 
                               : 'bg-slate-50 border-slate-100 hover:bg-slate-100/80')
                   }`}
                 >
                   {!log.isRead && (
                      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-[2rem]">
                        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-pink-500 m-6 animate-pulse" />
                      </div>
                   )}

                   <div className="flex items-center gap-4 w-full mb-4">
                     <div className={`p-3 md:p-4 rounded-xl shrink-0 ${bgBadge}`}>
                       {icon}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-sm md:text-base leading-tight truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {log.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 mt-1 text-[10px] md:text-xs font-bold whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Clock size={12} /> {log.date} @ {log.time}
                        </span>
                     </div>
                   </div>
                   
                   <p className={`text-xs md:text-sm font-medium leading-relaxed mb-6 pr-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                     {log.message}
                   </p>

                   <div className="mt-auto w-full pt-4 border-t border-slate-500/20 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {log.isRead ? 'Already Read' : 'Click to Mark Read'}
                     </span>
                     <button
                       onClick={(e) => deleteNotification(log.id, e)}
                       className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-rose-500/20 text-rose-500' : 'hover:bg-rose-100 text-rose-600'}`}
                       title="Hapus notifikasi ini"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  );
}

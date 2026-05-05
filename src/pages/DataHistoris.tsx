// 📁 src/pages/DataHistoris.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Calendar, Activity, Sun, ShieldCheck,
  Search, Download, Filter, ChevronRight,
  CloudRain, SunMedium, CloudLightning,
  Sparkles, BrainCircuit, ChevronDown,
  FileText, FileSpreadsheet, X, CheckCircle2, Info,
  ArrowLeft, ArrowRight, Loader2, Database
} from 'lucide-react';

// ✅ IMPORT FIREBASE CONTEXT
import { useFirebaseData } from '../contexts/FirebaseContext';
import { database } from '../services/firebaseConfig';
import { ref as dbRef, query, orderByChild, endBefore, limitToLast, get } from 'firebase/database';
import { HistoryLog } from '../types';

export interface UIRow {
  id: string;
  date: string;
  time: string;
  weather: string;
  icon: React.ReactElement;
  status: string;
  luminosity: number;
  color: string;
  dot: string;
  trigger: string;
  timestamp: number;
  cahaya: number;
}

/**
 * UTILITY: getGlassEffect
 */
const getGlassEffect = (isDark: boolean) => {
  return isDark
    ? "bg-[#03060C]/60 backdrop-blur-[40px]"
    : "bg-white/90 backdrop-blur-[40px]";
};

/**
 * COMPONENT: Custom Date Picker
 */
const CustomDatePicker = ({ selectedDate, onSelect, isDark }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const handleSelectDate = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelect(newDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelect(today);
    setIsOpen(false);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const sDate = new Date(selectedDate);
    return sDate.getDate() === day && sDate.getMonth() === currentMonth.getMonth() && sDate.getFullYear() === currentMonth.getFullYear();
  };

  return (
    <div className="relative flex items-center px-3 border-r border-slate-500/30" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 pl-6 pr-2 py-1.5 bg-transparent border-none outline-none text-[11px] font-bold cursor-pointer transition-colors ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
          }`}
      >
        <Calendar size={14} className="absolute left-3" />
        {selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-3 p-4 rounded-2xl shadow-2xl z-50 border w-64 animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-[#0A0F1C]/95 border-white/10 backdrop-blur-xl' : 'bg-white/95 border-slate-200 backdrop-blur-xl'
          }`}>
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              <ArrowLeft size={14} />
            </button>
            <span className={`text-[13px] font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className={`text-center text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);
              return (
                <button
                  key={day}
                  onClick={() => handleSelectDate(day)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${selected
                      ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                      : today
                        ? (isDark ? 'bg-white/10 text-pink-400' : 'bg-slate-100 text-pink-600')
                        : (isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100')
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className={`flex justify-between items-center pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            <button onClick={handleClear} className={`text-[10px] font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-pink-400' : 'text-slate-500 hover:text-pink-600'}`}>Clear</button>
            <button onClick={handleToday} className={`text-[10px] font-bold transition-colors ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-500'}`}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * COMPONENT: StatCard
 */
const StatCard = ({ title, value, sub, icon, color = "text-[#EC4899]", isDark }: any) => {
  const glowRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (glowRef.current) {
      glowRef.current.style.background = isDark
        ? `radial-gradient(250px circle at ${x}% ${y}%, rgba(236, 72, 153, 0.15), transparent 80%)`
        : `radial-gradient(250px circle at ${x}% ${y}%, rgba(236, 72, 153, 0.08), transparent 80%)`;
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${getGlassEffect(isDark)} group relative isolate rounded-3xl p-6 
                  transition-all duration-500 hover:-translate-y-1 overflow-hidden h-full border ${isDark ? 'border-white/5' : 'border-slate-100 shadow-xl shadow-slate-200/50'}`}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      />

      <div className="flex justify-between items-start relative z-10 pointer-events-none text-left">
        <div className="flex-1">
          <p className={`text-[11px] font-bold tracking-wider uppercase mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {title}
          </p>
          <h3 className={`text-3xl font-black tracking-tight leading-none transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {value}
          </h3>
          <p className={`text-[11px] font-medium mt-4 tracking-wide transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {sub}
          </p>
        </div>
        <div className={`${color} p-3.5 rounded-2xl transition-all duration-500 ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 22 }) : icon}
        </div>
      </div>
    </div>
  );
};

export default function DataHistoris() {
  const context = useOutletContext<{ isDark: boolean }>();
  const isDark = context?.isDark ?? true;

  const [logs, setLogs] = useState<UIRow[]>([]);
  const [olderLogs, setOlderLogs] = useState<UIRow[]>([]);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const tableGlowRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 4;

  const [exportDate, setExportDate] = useState<Date | null>(null);
  const [exportFormat, setExportFormat] = useState('CSV');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<UIRow | null>(null);

  // ✨ MAP HISTORY LOGS DARI CONTEXT
  const { historyLogs } = useFirebaseData();

  useEffect(() => {
    setIsLoading(true);
    const threshold = parseInt(localStorage.getItem('automation-threshold') || '65', 10);

    if (historyLogs.length > 0) {
      const fetchedLogs = historyLogs.map(item => {
        const val = item.intensitas || 0;
        const dateObj = new Date(item.timestamp);

        // UI Status
        const uiStatus = item.status === 'CLOSED' ? 'Close' : 'Open';

        return {
          id: item.id,
          date: dateObj.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: dateObj.toLocaleTimeString('en-GB', { hour12: false }),
          weather: val >= threshold ? 'Heavy Rain' : val >= 40 ? 'Light Rain' : 'Clear Sky',
          icon: val >= threshold ? <CloudRain /> : val >= 40 ? <SunMedium /> : <Sun />,
          status: uiStatus,
          luminosity: val,
          color: item.status === 'CLOSED' ? 'text-pink-500' : 'text-emerald-500',
          dot: item.status === 'CLOSED' ? 'bg-pink-500' : 'bg-emerald-500',
          trigger: item.title || 'Auto',
          timestamp: item.timestamp,
          cahaya: item.cahaya || 0
        } as UIRow;
      });

      // Combine Context logs (latest 100) with manually fetched older logs
      setLogs([...fetchedLogs, ...olderLogs]);
    } else {
      setLogs([...olderLogs]);
    }

    setIsLoading(false);
  }, [historyLogs, olderLogs]);

  const loadMoreData = async () => {
    if (logs.length === 0 || isFetchingOlder || !hasMoreData) return;
    setIsFetchingOlder(true);

    // Temukan timestamp log paling tua yang ada di layar
    const oldestLog = logs[logs.length - 1];

    try {
      const historyTable = query(
        dbRef(database, '/Data_Historis'),
        orderByChild('timestamp'),
        endBefore(oldestLog.timestamp),
        limitToLast(100)
      );

      const snap = await get(historyTable);
      if (snap.exists()) {
        const rawData = snap.val();
        const threshold = parseInt(localStorage.getItem('automation-threshold') || '65', 10);

        const loadedArray = Object.keys(rawData).map((key) => {
          const item = rawData[key];
          const ts = item.timestamp ? new Date(item.timestamp) : new Date();
          const val = item.intensitas || 0;
          const uiStatus = item.status === 'CLOSED' ? 'Close' : 'Open';

          return {
            id: key,
            date: ts.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: ts.toLocaleTimeString('en-GB', { hour12: false }),
            weather: val >= threshold ? 'Heavy Rain' : val >= 40 ? 'Light Rain' : 'Clear Sky',
            icon: val >= threshold ? <CloudRain /> : val >= 40 ? <SunMedium /> : <Sun />,
            status: uiStatus,
            luminosity: val,
            color: item.status === 'CLOSED' ? 'text-pink-500' : 'text-emerald-500',
            dot: item.status === 'CLOSED' ? 'bg-pink-500' : 'bg-emerald-500',
            trigger: item.title || item.trigger || 'Auto',
            timestamp: item.timestamp || Date.now(),
            cahaya: item.cahaya || 0
          } as UIRow;
        });

        // Firebase limitToLast(100) urutannya dari lama ke baru. Kita harus reverse agar kronologis menurun.
        const sortedDesceding = loadedArray.sort((a, b) => b.timestamp - a.timestamp);
        setOlderLogs(prev => [...prev, ...sortedDesceding]);

        if (loadedArray.length < 100) {
          setHasMoreData(false);
        }
      } else {
        setHasMoreData(false);
      }
    } catch (err) {
      console.error("Failed fetching older logs", err);
    }
    setIsFetchingOlder(false);
  };

  const handleTableMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (tableGlowRef.current) {
      tableGlowRef.current.style.background = isDark
        ? `radial-gradient(600px circle at ${x}% ${y}%, rgba(236, 72, 153, 0.1), transparent 60%)`
        : `radial-gradient(600px circle at ${x}% ${y}%, rgba(236, 72, 153, 0.04), transparent 60%)`;
    }
  };

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      setToastMessage(`Data exported successfully as ${exportFormat}!`);
      setTimeout(() => setToastMessage(null), 3000);
    }, 1500);
  };

  const filteredRows = useMemo(() => {
    return logs.filter((r) => {
      const matchSearch =
        r.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.time.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.weather.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.trigger.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFilter = filterStatus === 'All' || r.status.includes(filterStatus);

      const matchDate = exportDate
        ? r.date === exportDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : true;

      return matchSearch && matchFilter && matchDate;
    });
  }, [searchTerm, filterStatus, logs, exportDate]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`max-w-[1400px] mx-auto p-6 md:p-10 space-y-8 text-left transition-colors duration-700 relative`}>
      <div className={`absolute inset-0 pointer-events-none -z-10 opacity-[0.03] ${isDark ? 'invert-0' : 'invert'}`}
        style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-8 fade-in duration-500 ${isDark ? 'bg-[#0A0F1C] border-emerald-500/30 text-white' : 'bg-white border-emerald-200 text-slate-800'
          }`}>
          <div className="bg-emerald-500/10 p-1.5 rounded-full text-emerald-500">
            <CheckCircle2 size={18} />
          </div>
          <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRow(null)} />
          <div className={`relative w-full max-w-md rounded-[2.5rem] p-8 border shadow-2xl transform scale-100 animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#0A0F1C]/90 border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200'
            }`}>
            <button
              onClick={() => setSelectedRow(null)}
              className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-pink-500/10 text-pink-500' : 'bg-pink-50 text-pink-600'}`}>
                <Info size={24} />
              </div>
              <div>
                <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Detail Aktivitas</h3>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Log ID: {selectedRow.id}</p>
              </div>
            </div>

            <div className={`space-y-4 rounded-2xl p-5 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-center pb-4 border-b border-slate-500/20">
                <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Waktu</span>
                <div className="text-right">
                  <p className={`font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedRow.date}</p>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedRow.time}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-500/20">
                <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Weather</span>
                <div className="flex items-center gap-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{React.cloneElement(selectedRow.icon as any, { size: 16 })}</span>
                  <p className={`font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedRow.weather}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-500/20">
                <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Action Trigger</span>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedRow.trigger}</p>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-500/20">
                <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status Kanopi</span>
                <p className={`font-black uppercase tracking-wider text-[11px] ${selectedRow.color}`}>{selectedRow.status}</p>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-500/20">
                <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Intensitas Hujan</span>
                <p className={`font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedRow.luminosity}%</p>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Intensitas Cahaya</span>
                <p className={`font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedRow.cahaya} Lux</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedRow(null)}
              className={`w-full mt-8 py-3 rounded-xl font-bold tracking-wide transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 z-20 relative">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
            </span>
            <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Catatan Kronologis
            </span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-black tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Riwayat \<span className="text-slate-400 font-light ml-1">Data</span>
          </h1>
        </div>

        <div className={`flex flex-wrap items-center gap-3 p-2 rounded-[2rem] transition-all duration-500 relative ${isDark ? 'bg-white/[0.02] border border-white/5' : 'bg-white/50 border border-slate-200'}`}>
          {/* Search */}
          <div className="relative group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-[#EC4899]' : 'text-slate-400 group-focus-within:text-pink-500'}`} size={16} />
            <input
              type="text"
              placeholder="Search Telemetry..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium tracking-wide focus:outline-none transition-all w-full sm:w-64 ${isDark
                  ? 'bg-black/40 text-white placeholder:text-slate-500 focus:bg-black/60'
                  : 'bg-slate-100 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:shadow-sm'
                }`}
            />
          </div>

          {/* Filter Status */}
          <div className="relative z-50">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-2xl transition-all ${isDark ? (isFilterOpen ? 'bg-pink-500/20 text-pink-500' : 'bg-black/40 text-slate-400 hover:text-white') : (isFilterOpen ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500 hover:text-slate-800')
                }`}>
              <Filter size={18} />
            </button>
            {isFilterOpen && (
              <div className={`absolute top-full right-0 mt-2 w-40 rounded-xl p-2 shadow-2xl z-50 border backdrop-blur-xl animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-[#0A0F1C]/95 border-white/10' : 'bg-white/95 border-slate-200'
                }`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 pb-2 mb-1 border-b ${isDark ? 'text-slate-500 border-white/10' : 'text-slate-400 border-slate-100'}`}>Filter Status</div>
                {['All', 'Deployed', 'Fully Closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => { setFilterStatus(status); setIsFilterOpen(false); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filterStatus === status
                        ? (isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-50 text-pink-600')
                        : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker & Export */}
          <div className={`flex items-center p-1 rounded-2xl gap-1 ${isDark ? 'bg-black/40' : 'bg-slate-100'}`}>
            <CustomDatePicker selectedDate={exportDate} onSelect={setExportDate} isDark={isDark} />

            <div className="relative z-40">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-white text-slate-700 shadow-sm'
                  }`}
              >
                {exportFormat === 'CSV' ? <FileText size={14} className="text-pink-500" /> : <FileSpreadsheet size={14} className="text-emerald-500" />}
                {exportFormat}
                <ChevronDown size={14} className={`transition-transform duration-300 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportMenuOpen && (
                <div className={`absolute top-full left-0 mt-2 w-32 rounded-xl p-1 shadow-2xl z-50 border backdrop-blur-xl animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-[#0A0F1C]/95 border-white/10' : 'bg-white/95 border-slate-100'
                  }`}>
                  <button
                    onClick={() => { setExportFormat('CSV'); setIsExportMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <FileText size={14} className="text-pink-500" /> CSV Format
                  </button>
                  <button
                    onClick={() => { setExportFormat('Excel'); setIsExportMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <FileSpreadsheet size={14} className="text-emerald-500" /> Excel Format
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ml-1 ${isExporting ? 'opacity-70 cursor-wait' : 'active:scale-95'
                } ${isDark ? 'bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white hover:opacity-90 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                }`}>
              {isExporting ? <Activity size={14} className="animate-spin" /> : <Download size={14} />}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      {/* AI INSIGHT */}
      <div className={`relative overflow-hidden rounded-3xl p-6 border transition-all duration-500 z-10 ${isDark ? 'bg-indigo-950/20 border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05)]' : 'bg-indigo-50 border-indigo-100 shadow-sm'
        }`}>
        <div className={`absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 rounded-full blur-[60px] pointer-events-none ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10'
          }`} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className={`p-4 rounded-2xl shrink-0 flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
            }`}>
            <BrainCircuit size={28} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={14} className={isDark ? "text-[#EC4899]" : "text-pink-500"} />
              <h2 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Telemetry AI Insight</h2>
            </div>
            <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-indigo-200/70' : 'text-indigo-900/70'}`}>
              Berdasarkan sinkronisasi <strong className={isDark ? "text-indigo-300" : "text-indigo-700"}>{logs.length} baris telemetri</strong> terakhir, AI mendeteksi bahwa sistem merespon secara dinamis terhadap simulasi cuaca. Sistem merekomendasikan penyesuaian <span className="italic">automation threshold</span> jika frekuensi siklus buka/tutup mekanis terlalu tinggi.
            </p>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <StatCard isDark={isDark} title="Total Catatan" value={logs.length.toString()} sub="Nodes logged dynamically" icon={<Activity />} color="text-blue-500" />
        <StatCard isDark={isDark} title="Rasio Terbuka" value={`${Math.round((logs.filter(l => l.status === 'Deployed').length / Math.max(logs.length, 1)) * 100)}%`} sub="Waktu kanopi terbuka" icon={<Sun />} color="text-pink-500" />
        <StatCard isDark={isDark} title="Status Sistem" value="99.8%" sub="Uptime sistem normal" icon={<ShieldCheck />} color="text-emerald-500" />
      </div>

      {/* DATA TABLE SECTION */}
      <section
        className={`${getGlassEffect(isDark)} rounded-[2.5rem] relative overflow-hidden group/table border flex flex-col ${isDark ? 'border-white/5' : 'border-slate-100 shadow-xl shadow-slate-200/50'}`}
        onMouseMove={handleTableMouseMove}
      >
        <div
          ref={tableGlowRef}
          className="absolute inset-0 z-0 opacity-0 group-hover/table:opacity-100 transition-opacity duration-1000 pointer-events-none"
        />

        <div className="overflow-x-auto relative z-10 min-h-[300px] flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/5' : 'border-slate-200/60'}`}>
                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Waktu</th>
                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Kondisi Cuaca</th>
                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status Kanopi</th>
                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Int. Hujan</th>
                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Int. Cahaya</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>

              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className={`inline-flex flex-col items-center justify-center p-8 rounded-[2rem] border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
                      }`}>
                      <Loader2 size={32} className={`mb-4 animate-spin ${isDark ? 'text-pink-500' : 'text-pink-500'}`} />
                      <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Syncing with Firebase...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((r, i) => (
                  <tr key={r.id || i} className={`group transition-colors duration-200 ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-8 py-5">
                      <div className="flex flex-col text-left">
                        <span className={`text-sm font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>{r.date}</span>
                        <span className="text-[11px] text-slate-500 font-medium mt-1">{r.time}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/[0.03] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          {React.cloneElement(r.icon as any, { size: 16 })}
                        </div>
                        <span className={`text-sm font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {r.weather}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${r.dot} animate-pulse`} />
                        <span className={`text-[11px] font-black uppercase tracking-widest ${r.color}`}>
                          {r.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`text-sm font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {r.luminosity}%
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`text-sm font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {r.cahaya} Lux
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => setSelectedRow(r)}
                        className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className={`inline-flex flex-col items-center justify-center p-8 rounded-[2rem] border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
                      }`}>
                      <Search size={32} className={`mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                      <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tidak ada data yang cocok dengan kriteria pencarian.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className={`flex items-center justify-between px-8 py-5 border-t relative z-10 ${isDark ? 'border-white/5' : 'border-slate-200/60'}`}>
          <div className="flex items-center gap-4">
            <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Page {currentPage} of {totalPages}
            </span>
            {hasMoreData && (
              <button
                onClick={loadMoreData}
                disabled={isFetchingOlder}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-pink-400' : 'bg-slate-100 hover:bg-slate-200 text-pink-600'
                  }`}
              >
                {isFetchingOlder ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                {isFetchingOlder ? 'Loading...' : 'Fetch Databases'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white disabled:opacity-30' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40'}`}
            >
              <ChevronRight size={18} className="rotate-180" />
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white disabled:opacity-30' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
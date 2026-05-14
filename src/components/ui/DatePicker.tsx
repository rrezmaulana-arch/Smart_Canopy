import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  selectedDate: string;
  onChange: (dateStr: string) => void;
  isDark?: boolean;
}

export default function DatePicker({ selectedDate, onChange, isDark = true }: DatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleDateSelect = (day: number) => {
    const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate === selectedDate ? '' : formattedDate);
    setIsCalendarOpen(false);
  };

  const getGlassEffect = () => {
    return isDark 
      ? "bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl"
      : "bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl";
  };

  return (
    <div className="relative" ref={calendarRef}>
      <button 
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className={`w-full flex items-center justify-between pl-9 pr-4 py-2 rounded-xl text-sm border transition-all ${
          isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
        } ${selectedDate ? 'border-pink-500/50 text-pink-500 font-semibold' : ''}`}
      >
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <span className="truncate">{selectedDate || 'Select Date'}</span>
        {selectedDate && (
          <X 
            size={14} 
            className="hover:text-rose-500 z-10 transition-colors" 
            onClick={(e) => { e.stopPropagation(); onChange(''); }} 
          />
        )}
      </button>

      {isCalendarOpen && (
        <div className={`absolute top-[110%] right-0 z-50 p-4 w-72 rounded-2xl shadow-xl ${getGlassEffect()} animate-in fade-in zoom-in-95 duration-200`}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft size={16} className={isDark ? 'text-white' : 'text-slate-800'} />
            </button>
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronRight size={16} className={isDark ? 'text-white' : 'text-slate-800'} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(day => <div key={day} className="text-center text-[10px] font-bold text-slate-500 py-1">{day}</div>)}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={day} onClick={() => handleDateSelect(day)}
                  className={`w-7 h-7 rounded-full text-xs font-medium mx-auto transition-all ${
                    isSelected ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' : (isDark ? 'text-slate-300 hover:bg-pink-500/20' : 'text-slate-700 hover:bg-pink-500/10')
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

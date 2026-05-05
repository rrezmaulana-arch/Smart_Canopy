// 📁 src/pages/Login.tsx
'use client';

import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
// Tambahkan Sun dan Moon di baris import ini
import { Cloud, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function Login() {
  // Ambil isDark dan setIsDark dari context agar tombolnya bisa mengubah state
  const context = useOutletContext<{ isDark: boolean; setIsDark: (val: boolean) => void } | null>();
  const isDark = context?.isDark ?? true;
  const setIsDark = context?.setIsDark ?? (() => { });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Invalid Identification or Security Key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative font-sans transition-colors duration-700 bg-transparent">

      {/* ✨ TOMBOL TOGGLE DI UJUNG KANAN ATAS ✨ */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md border transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${isDark
          ? 'bg-white/10 border-white/20 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
          : 'bg-slate-900/5 border-slate-200 text-slate-700 shadow-sm'
          }`}
        title="Toggle Theme"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-700">

        <div className={`p-8 sm:p-10 rounded-[2.5rem] border transition-all duration-500 shadow-2xl relative overflow-hidden ${isDark
          ? 'bg-[#0b0d13]/90 border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]'
          : 'bg-white border-slate-200 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)]'
          }`}>

          <div className="mb-10 text-center flex flex-col items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl group hover:rotate-3 transition-transform duration-500 ${isDark ? 'bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600' : 'bg-gradient-to-br from-pink-400 to-pink-500'
              }`}>
              <Cloud className="text-white drop-shadow-md" size={32} />
            </div>

            <h1 className={`text-3xl font-black tracking-tighter leading-tight mb-3 italic uppercase ${isDark ? 'text-white' : 'text-slate-900'
              }`}>
              Smart <span className="inline-block px-1 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Canopy</span>
            </h1>

            <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Secure Access Protocol
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl text-[11px] font-bold text-red-500 text-center animate-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}

            <div className="group space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] ml-1 text-slate-500 group-focus-within:text-pink-500 transition-colors">Identification (Email)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-pink-500 transition-colors" size={18} />
                <input
                  required
                  type="email"
                  placeholder="admin@smartcanopy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border transition-all duration-300 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${isDark
                    ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-700 focus:border-pink-500/50 focus:ring-pink-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-pink-500/50 focus:ring-pink-500/20'
                    }`}
                />
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] ml-1 text-slate-500 group-focus-within:text-pink-500 transition-colors">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-pink-500 transition-colors" size={18} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border transition-all duration-300 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${isDark
                    ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-700 focus:border-pink-500/50 focus:ring-pink-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-pink-500/50 focus:ring-pink-500/20'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-500 transition-colors p-1 rounded-md"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_20px_-10px_rgba(236,72,153,0.5)] hover:shadow-[0_10px_25px_-5px_rgba(236,72,153,0.6)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />

                {isLoading ? (
                  <Loader2 className="animate-spin relative z-10" size={18} />
                ) : (
                  <>
                    <span className="relative z-10">Authorize Access</span>
                    <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center space-y-2 opacity-80 hover:opacity-100 transition-opacity">
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
            &copy; 2026 Moetia Safitri Agustina
          </p>
        </div>
      </div>
    </div>
  );
}
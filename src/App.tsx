'use client';

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ✨ PENTING: Import Auth & Layouts
import { AuthProvider } from '@/hooks/useAuth';
import { FirebaseDataProvider } from '@/contexts/FirebaseContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SpaceBackground from '@/components/effects/SpaceBackground';
import CustomCursor from '@/components/effects/CustomCursor';
import DashboardLayout from '@/layouts/DashboardLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Monitoring from '@/pages/Monitoring';
import Control from '@/pages/Control';
import DataHistoris from '@/pages/DataHistoris';
import Notifications from '@/pages/Notifications';

// ==================== MAIN APP ====================
function App() {
  const [isDark, setIsDark] = useState(true);

  // Sinkronisasi isDark state ke tag <html> untuk Tailwind Dark Mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <AuthProvider>

        {/* BACKGROUND BINTANG (Hanya muncul saat Dark Mode) */}
        <div className="fixed inset-0 z-0 transition-opacity duration-1000 opacity-0 pointer-events-none dark:opacity-100 dark:pointer-events-auto">
          <SpaceBackground />
        </div>

        {/* Mesmerizing Fluid Effect (Global Layer) */}
        <CustomCursor isDark={isDark} />

        <FirebaseDataProvider>
        {/* z-20 → selalu di atas canvas fluid cursor (z-[10]) */}
        <div className="relative z-20 w-full min-h-screen pointer-events-auto">
          <Routes>

            {/* 🌟 ROOT PATH: 3D Animated Landing Showcase */}
            <Route path="/" element={<LandingPage isDark={isDark} setIsDark={setIsDark} />} />

            {/* 1. Public Routes: Login Area */}
            <Route element={<AuthLayout isDark={isDark} setIsDark={setIsDark} />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* 2. Protected Routes: Dashboard Area (Butuh Login & Ada Sidebar) */}
            {/* Tambahkan path="/" di parent ini agar struktur URL anaknya lebih jelas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout isDark={isDark} setIsDark={setIsDark} />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="control" element={<Control />} />
              <Route path="data" element={<DataHistoris />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* 🌟 Fallback: Jika user mengakses path ngawur (404), lempar ke login bukan ke dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        </FirebaseDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
// 📁 src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Kalau Firebase masih ngecek sesi login, tampilkan layar kosong / loading
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-pink-500">Authenticating...</div>; 
  }

  // Kalau nggak ada user (belum login), tendang ke /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kalau aman, silakan masuk
  return <>{children}</>;
}
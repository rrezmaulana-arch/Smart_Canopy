// 📁 src/types/index.ts

/**
 * Interface untuk struktur data Telemetri Real-time (Node Utama di Firebase)
 */
export interface TelemetryData {
  Suhu: number;
  intensitas: number;
  cahaya: number;
  status: 'OPEN' | 'CLOSED' | 'PARTIAL' | string;
  mode: 'AUTO' | 'MANUAL';
  position: number;
  threshold: number;
  lastConnected?: number; // Timestamp letak denyut jantung hardware
}

/**
 * Interface untuk struktur data Firebase di `/Data_Historis`
 */
export interface HistoryLog {
  id: string; // The firebase key
  timestamp: number;
  intensitas: number;
  cahaya: number;
  status: string;
  title: string;
  message: string;
  time: string;
  date: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  isRead: boolean;
}

/**
 * Interface gabungan State di Context Aplikasi
 */
export interface FirebaseContextState {
  telemetry: TelemetryData;
  historyLogs: HistoryLog[];
  isConnected: boolean;       // Browser → Firebase terkoneksi
  isBrowserConnected: boolean; // Hanya koneksi browser API
  isHardwareOnline: boolean;  // Hardware (ESP32) aktif dalam 60 detik terakhir
}

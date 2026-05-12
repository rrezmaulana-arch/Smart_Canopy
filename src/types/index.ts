// 📁 src/types/index.ts

// ─── Struktur Sensor (Node Terpisah di Firebase) ──────────────────────────

/** Node: /sensors/hujan/ */
export interface SensorHujan {
  isRaining: boolean;       // true = hujan terdeteksi
  intensitas: number;       // 0 (kering) atau 100 (hujan)
  lastUpdated: number;      // Firebase server timestamp
}

/** Node: /sensors/cahaya/ */
export interface SensorCahaya {
  lux: number;              // 0-100 (persen, dipetakan dari ADC)
  raw: number;              // 0-4095 (nilai ADC mentah ESP32)
  lastUpdated: number;      // Firebase server timestamp
}

/** Node: /canopy/ */
export interface CanopyState {
  status: 'OPEN' | 'CLOSED' | 'PARTIAL' | string;
  position: number;         // 0-100 (% posisi motor)
  lastMoved?: number;
}

/** Node: /settings/ */
export interface SystemSettings {
  mode: 'AUTO' | 'MANUAL';
  threshold: number;        // 0-100 (batas hujan untuk auto-close)
}

/** Node: /system/ */
export interface SystemInfo {
  lastConnected: number;    // Timestamp heartbeat ESP32 terakhir
}

// ─── Flat Telemetry View (dipakai komponen UI) ───────────────────────────

/**
 * Data telemetri yang sudah diflat-kan dari semua node Firebase.
 * Diisi oleh FirebaseContext sehingga komponen UI tidak perlu tahu
 * tentang struktur nested di database.
 */
export interface TelemetryData {
  // dari /sensors/hujan/
  isRaining: boolean;
  intensitas: number;
  hujanLastUpdated?: number;

  // dari /sensors/cahaya/
  cahaya: number;           // alias lux (%)
  cahayaRaw?: number;       // raw ADC
  cahayaLastUpdated?: number;

  // dari /canopy/
  status: 'OPEN' | 'CLOSED' | 'PARTIAL' | string;
  position: number;

  // dari /settings/
  mode: 'AUTO' | 'MANUAL';
  threshold: number;

  // dari /system/
  lastConnected?: number;
}

// ─── History Log ─────────────────────────────────────────────────────────

/**
 * Interface untuk data di /Data_Historis/{key}
 * Mendukung struktur baru (nested) dan lama (flat) untuk backward compatibility.
 */
export interface HistoryLog {
  id: string;               // Firebase push key
  timestamp: number;

  // Sensor data (nested baru)
  intensitas: number;       // sensors/hujan/intensitas ATAU intensitas (flat lama)
  cahaya: number;           // sensors/cahaya/lux ATAU cahaya (flat lama)
  isRaining?: boolean;

  // Kanopi
  status: string;           // canopy/status ATAU status (flat lama)
  position?: number;

  // Setting
  mode?: string;
  threshold?: number;

  // Metadata UI
  title: string;
  message: string;
  trigger?: string;
  time: string;
  date: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  isRead: boolean;
}

// ─── Context State ────────────────────────────────────────────────────────

export interface FirebaseContextState {
  telemetry: TelemetryData;
  historyLogs: HistoryLog[];
  isConnected: boolean;
  isBrowserConnected: boolean;
  isHardwareOnline: boolean;
}

// 📁 src/contexts/FirebaseContext.tsx
// Mendukung struktur database baru:
//   /sensors/hujan/   → sensor hujan
//   /sensors/cahaya/  → sensor LDR
//   /canopy/          → status & posisi
//   /settings/        → mode & threshold
//   /system/          → heartbeat ESP32

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ref, onValue, off, query, limitToLast } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import { TelemetryData, HistoryLog, FirebaseContextState } from '../types';

const defaultTelemetry: TelemetryData = {
  isRaining: false,
  intensitas: 0,
  cahaya: 0,
  cahayaRaw: 0,
  status: 'UNKNOWN',
  position: 0,
  mode: 'AUTO',
  threshold: 65,
  lastConnected: 0,
};

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>(defaultTelemetry);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [isBrowserConnected, setIsBrowserConnected] = useState(false);
  const [isHardwareOnline, setIsHardwareOnline] = useState(false);

  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // ─── 1. Cek koneksi browser ke Firebase ───────────────────────────────
    const connectedRef = ref(database, '.info/connected');
    const connListener = onValue(connectedRef, (snap) => {
      setIsBrowserConnected(snap.val() === true);
    });

    // ─── 2. Listener per field sensor (struktur baru) ─────────────────────
    // Kita listen ke masing-masing node, lalu flat-kan ke TelemetryData.
    //
    // Mapping:
    //   /sensors/hujan/isRaining  → telemetry.isRaining
    //   /sensors/hujan/intensitas → telemetry.intensitas
    //   /sensors/cahaya/lux       → telemetry.cahaya
    //   /sensors/cahaya/raw       → telemetry.cahayaRaw
    //   /canopy/status            → telemetry.status
    //   /canopy/position          → telemetry.position
    //   /settings/mode            → telemetry.mode
    //   /settings/threshold       → telemetry.threshold
    //   /system/lastConnected     → telemetry.lastConnected

    const fieldListeners: Array<() => void> = [];

    const watchField = (
      path: string,
      onData: (val: any) => void
    ) => {
      const fieldRef = ref(database, path);
      const unsub = onValue(
        fieldRef,
        (snap) => onData(snap.exists() ? snap.val() : null),
        (err) => console.error(`[Firebase] Error on ${path}:`, err)
      );
      fieldListeners.push(() => off(fieldRef, 'value', unsub));
    };

    // /sensors/hujan/
    watchField('/sensors/hujan/isRaining', (val) => {
      if (val === null) return;
      setTelemetry(prev => prev.isRaining === val ? prev : { ...prev, isRaining: Boolean(val) });
    });
    watchField('/sensors/hujan/intensitas', (val) => {
      if (val === null) return;
      setTelemetry(prev => prev.intensitas === val ? prev : { ...prev, intensitas: Number(val) });
    });
    watchField('/sensors/hujan/lastUpdated', (val) => {
      if (val === null) return;
      setTelemetry(prev => ({ ...prev, hujanLastUpdated: Number(val) }));
    });

    // /sensors/cahaya/
    watchField('/sensors/cahaya/lux', (val) => {
      if (val === null) return;
      setTelemetry(prev => prev.cahaya === val ? prev : { ...prev, cahaya: Number(val) });
    });
    watchField('/sensors/cahaya/raw', (val) => {
      if (val === null) return;
      setTelemetry(prev => ({ ...prev, cahayaRaw: Number(val) }));
    });
    watchField('/sensors/cahaya/lastUpdated', (val) => {
      if (val === null) return;
      setTelemetry(prev => ({ ...prev, cahayaLastUpdated: Number(val) }));
    });

    // /canopy/
    watchField('/canopy/status', (val) => {
      if (val === null) return;
      setTelemetry(prev => prev.status === val ? prev : { ...prev, status: String(val) });
    });
    watchField('/canopy/position', (val) => {
      if (val === null) return;
      setTelemetry(prev => prev.position === val ? prev : { ...prev, position: Number(val) });
    });

    // /settings/
    watchField('/settings/mode', (val) => {
      if (val === null) return;
      setTelemetry(prev => prev.mode === val ? prev : { ...prev, mode: val as 'AUTO' | 'MANUAL' });
    });
    watchField('/settings/threshold', (val) => {
      if (val === null) return;
      setTelemetry(prev => prev.threshold === val ? prev : { ...prev, threshold: Number(val) });
    });

    // /system/lastConnected  (heartbeat ESP32)
    watchField('/system/lastConnected', (val) => {
      if (val === null) return;
      const hwTimeMs = Number(val);
      setTelemetry(prev => ({ ...prev, lastConnected: hwTimeMs }));

      const alive = (Date.now() - hwTimeMs) < 60000;
      setIsHardwareOnline(alive);

      if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setTimeout(() => {
        setIsHardwareOnline(false);
      }, 65000);
    });

    // ─── 3. History Logs (100 terbaru) ────────────────────────────────────
    const historyRef = query(ref(database, '/Data_Historis'), limitToLast(100));
    const historyUnsub = onValue(historyRef, (snapshot) => {
      if (!snapshot.exists()) {
        setHistoryLogs([]);
        return;
      }

      const rawHistory = snapshot.val();
      const logsArray: HistoryLog[] = Object.keys(rawHistory).map((key) => {
        const item = rawHistory[key];
        const ts = item.timestamp ? new Date(item.timestamp) : new Date();

        // Dukung struktur baru (nested) & lama (flat)
        const intensitas =
          item.sensors?.hujan?.intensitas ??
          item.intensitas ??
          0;
        const cahaya =
          item.sensors?.cahaya?.lux ??
          item.cahaya ??
          0;
        const status =
          item.canopy?.status ??
          item.status ??
          '';
        const position =
          item.canopy?.position ??
          item.position ??
          0;
        const mode =
          item.settings?.mode ??
          item.mode ??
          'AUTO';
        const threshold =
          item.settings?.threshold ??
          item.threshold ??
          65;
        const trigger = item.trigger || item.title || 'System Action';
        const isRaining = item.sensors?.hujan?.isRaining ?? (intensitas > 0);

        let type: HistoryLog['type'] = 'info';
        if (intensitas > 80)        type = 'critical';
        else if (status === 'CLOSED') type = 'warning';
        else if (status === 'OPEN')   type = 'success';

        return {
          id: key,
          type,
          title: trigger,
          message: `Status: ${status} | Position: ${position}%`,
          time: ts.toLocaleTimeString('id-ID', { hour12: false }),
          date: ts.toISOString().split('T')[0],
          isRead: item.isRead || false,
          timestamp: item.timestamp || Date.now(),
          intensitas,
          cahaya,
          isRaining,
          status,
          position,
          mode,
          threshold,
          trigger,
        } as HistoryLog;
      });

      setHistoryLogs(logsArray.reverse()); // terbaru di atas
    });

    // ─── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      off(connectedRef, 'value', connListener);
      off(historyRef,   'value', historyUnsub);
      fieldListeners.forEach((unsub) => unsub());
      if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);
    };
  }, []);

  return (
    <FirebaseContext.Provider value={{
      telemetry,
      historyLogs,
      isConnected: isBrowserConnected,
      isBrowserConnected,
      isHardwareOnline,
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebaseData = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseData must be used within a FirebaseDataProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ref, onValue, off, query, limitToLast, orderByChild } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import { TelemetryData, HistoryLog, FirebaseContextState } from '../types';

const defaultTelemetry: TelemetryData = {
  Suhu: 0,
  intensitas: 0,
  cahaya: 0,
  status: 'UNKNOWN',
  mode: 'AUTO',
  position: 0,
  threshold: 30,
};

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>(defaultTelemetry);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [isBrowserConnected, setIsBrowserConnected] = useState(false);
  const [isHardwareOnline, setIsHardwareOnline] = useState(false);
  
  // Timer for heartbeat monitoring
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 1. Connection Listener (Browser API -> Firebase)
    const connectedRef = ref(database, '.info/connected');
    const connListener = onValue(connectedRef, (snap) => {
      setIsBrowserConnected(snap.val() === true);
    });

    // 2. Realtime Telemetry Monitor (Optimized for Flat DB)
    // 💥 PERBAIKAN KRITIS: JANGAN mendengarkan root '/' karena akan menarik seluruh database
    // termasuk '/Data_Historis' yang bisa sangat besar setiap detiknya, menyebabkan LAG EKSTREM.
    const keys = ['intensitas', 'status', 'Suhu', 'mode', 'threshold', 'position', 'lastConnected', 'cahaya'];
    const listeners: ReturnType<typeof onValue>[] = [];
    
    keys.forEach(key => {
      const fieldRef = ref(database, `/${key}`);
      const listener = onValue(fieldRef, (snapshot) => {
        const val = snapshot.exists() ? snapshot.val() : undefined;
        
        setTelemetry(prev => {
          // Hanya render ulang komponen jika nilai benar-benar berubah (Deep Mencegah Lag)
          if (prev[key as keyof TelemetryData] === val) return prev;
          
          return { ...prev, [key]: val ?? defaultTelemetry[key as keyof TelemetryData] };
        });

        if (key === 'lastConnected') {
          const hwTimeMs = Number(val || 0);
          const alive = (Date.now() - hwTimeMs) < 60000;
          setIsHardwareOnline(alive);

          if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);
          heartbeatTimerRef.current = setTimeout(() => {
             setIsHardwareOnline(false);
          }, 65000);
        }
      }, (error) => console.error(`Firebase error on ${key}:`, error));
      
      listeners.push(listener);
    });

    // 3. Independent History Logs listener for the latest 100 entries (protecting RAM bandwidth)
    const historyRef = query(ref(database, '/Data_Historis'), limitToLast(100));
    const historyListener = onValue(historyRef, (snapshot) => {
       if (snapshot.exists()) {
          const rawHistory = snapshot.val();
          const logsArray = Object.keys(rawHistory).map((key) => {
            const item = rawHistory[key];
            const ts = item.timestamp ? new Date(item.timestamp) : new Date();
            
            let type: HistoryLog['type'] = 'info';
            if (item.status === 'CLOSED') type = 'warning';
            if (item.status === 'OPEN') type = 'success';
            if ((item.intensitas || 0) > 80) type = 'critical';

            return {
               id: key,
               type: type,
               title: item.title || item.trigger || 'System Action',
               message: item.message || `Status: ${item.status || '-'} | Position: ${item.position || 0}%`,
               time: ts.toLocaleTimeString('en-GB'),
               date: ts.toISOString().split('T')[0],
               isRead: item.isRead || false,
               status: item.status || '',
               intensitas: item.intensitas || 0,
               cahaya: item.cahaya || 0,
               position: item.position || 0,
               timestamp: item.timestamp || Date.now(),
            } as HistoryLog;
          });
          setHistoryLogs(logsArray.reverse());
       } else {
          setHistoryLogs([]);
       }
    });

    return () => {
      off(connectedRef, 'value', connListener);
      off(historyRef, 'value', historyListener);
      
      // Matikan semua listener untuk setiap key agar tidak terjadi memory leak
      keys.forEach((key, index) => {
        const fieldRef = ref(database, `/${key}`);
        off(fieldRef, 'value', listeners[index]);
      });
      
      if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);
    };
  }, []);

  const combinedConnection = isBrowserConnected;

  return (
    <FirebaseContext.Provider value={{ 
      telemetry, 
      historyLogs, 
      isConnected: combinedConnection, 
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

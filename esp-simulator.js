// ============================================================
//  ESP SIMULATOR - Smart Canopy (Struktur Database v2.0)
//  Digunakan untuk testing web TANPA hardware ESP32 fisik.
//
//  Cara pakai: node esp-simulator.js
//
//  Struktur path yang disimulasikan:
//    WRITE → /sensors/hujan/   (isRaining, intensitas)
//    WRITE → /sensors/cahaya/  (lux, raw)
//    WRITE → /canopy/status & position
//    WRITE → /system/lastConnected
//    WRITE → /Data_Historis (push)
//    READ  → /settings/mode & threshold
//    READ  → /canopy/status (perintah manual)
// ============================================================

import 'dotenv/config';
import { initializeApp } from "firebase/app";
import {
  getDatabase, ref, onValue, update, push,
  serverTimestamp, query, limitToFirst, get
} from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

const MAX_RECORDS = 1000; // Rolling window: simpan maks 1000 record

console.log("🚀 Menghubungkan ke Firebase...");

signInWithEmailAndPassword(auth, process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD)
  .then(() => {
    console.log("🟢 Simulator Terautentikasi! Memulai simulasi...");
    startSimulator();
  })
  .catch((error) => console.error("🔴 Gagal Login Simulator:", error.message));


// ─── Rolling Window: hapus data history lama ──────────────────────────────
async function applyRollingWindow() {
  const historyRef = ref(db, "Data_Historis");
  try {
    const snapshot = await get(historyRef);
    if (snapshot.exists() && snapshot.size > MAX_RECORDS) {
      const excess = snapshot.size - MAX_RECORDS;
      const oldestQuery = query(historyRef, limitToFirst(excess));
      const oldestSnapshot = await get(oldestQuery);
      const updates = {};
      oldestSnapshot.forEach((child) => { updates[child.key] = null; });
      await update(historyRef, updates);
      console.log(`🧹 Rolling Window: Hapus ${excess} data lama.`);
    }
  } catch (err) {
    console.error("🔴 Gagal rolling window:", err);
  }
}


// ─── Main Simulator ───────────────────────────────────────────────────────
function startSimulator() {
  let state = {
    mode:          "AUTO",
    threshold:     65,
    canopyStatus:  "OPEN",
    manualStatus:  "OPEN",
    statusTerakhir: "",
  };

  let waktuLogTerakhir   = 0;
  const INTERVAL_HISTORY = 60000;  // Log berkala tiap 1 menit

  // Nilai sensor awal
  let intensitas = 0;    // 0-100
  let cahaya     = 60;   // 0-100 (persen)
  let ldrRaw     = 1638; // simulasi ADC raw (0-4095)

  // ─── Baca settings & kanopi dari Firebase ─────────────────────────────
  onValue(ref(db, "/settings/mode"),      (s) => { state.mode      = s.val() || "AUTO"; });
  onValue(ref(db, "/settings/threshold"), (s) => { state.threshold = s.val() || 65; });
  onValue(ref(db, "/canopy/status"),      (s) => { state.manualStatus = s.val() || "OPEN"; });

  // ─── Simulasi tiap 3 detik ────────────────────────────────────────────
  setInterval(async () => {
    const now = Date.now();

    // — Simulasi fluktuasi cahaya —
    cahaya += Math.floor(Math.random() * 21) - 10;
    cahaya  = Math.max(5, Math.min(100, cahaya));
    ldrRaw  = Math.round(map(cahaya, 0, 100, 4095, 0)); // inverse mapping

    // — Korelasi cuaca realistis —
    if (cahaya > 40) {
      intensitas = 0; // Cerah = tidak hujan
    } else {
      intensitas += Math.floor(Math.random() * 15) - 5;
      intensitas  = Math.max(0, Math.min(100, intensitas));
      if (intensitas > 30) {
        cahaya -= Math.floor(Math.random() * 10);
        cahaya  = Math.max(0, cahaya);
      }
    }

    const isRaining = intensitas > 0;

    // — Logika status kanopi —
    let statusSekarang;
    if (state.mode === "AUTO") {
      // Menutup jika hujan ATAU jika cahaya lebih rendah dari threshold (terlalu gelap)
      statusSekarang = (isRaining || cahaya < state.threshold) ? "CLOSED" : "OPEN";
    } else {
      statusSekarang = state.manualStatus; // Ikut perintah web di mode MANUAL
    }

    // ─── WRITE: /sensors/hujan/ ────────────────────────────────────────
    await update(ref(db, "/sensors/hujan"), {
      isRaining,
      intensitas,
      lastUpdated: Date.now(),
    });

    // ─── WRITE: /sensors/cahaya/ ───────────────────────────────────────
    await update(ref(db, "/sensors/cahaya"), {
      lux:         cahaya,
      raw:         ldrRaw,
      lastUpdated: Date.now(),
    });

    // ─── WRITE: /canopy/ ───────────────────────────────────────────────
    await update(ref(db, "/canopy"), {
      status:   statusSekarang,
      position: statusSekarang === "OPEN" ? 100 : 0,
    });

    // ─── WRITE: /system/lastConnected (heartbeat) ──────────────────────
    await update(ref(db, "/system"), {
      lastConnected: Date.now(),
    });

    state.canopyStatus = statusSekarang;

    // ─── WRITE: /Data_Historis (hanya saat ada perubahan / berkala) ────
    const statusBerubah    = statusSekarang !== state.statusTerakhir;
    const waktunyaBerkala  = (now - waktuLogTerakhir) >= INTERVAL_HISTORY;

    if (statusBerubah || waktunyaBerkala) {
      const trigger = statusBerubah
        ? (state.mode === "AUTO"
            ? `Auto: ${isRaining ? "Hujan Terdeteksi" : "Cerah"} -> ${statusSekarang}`
            : `Manual: ${statusSekarang}`)
        : "Periodic Log";

      await push(ref(db, "Data_Historis"), {
        // Struktur baru (nested) agar sinkron dengan web
        sensors: {
          hujan:  { isRaining, intensitas },
          cahaya: { lux: cahaya, raw: ldrRaw },
        },
        canopy: {
          status:   statusSekarang,
          position: statusSekarang === "OPEN" ? 100 : 0,
        },
        settings: {
          mode:      state.mode,
          threshold: state.threshold,
        },
        trigger,
        timestamp: Date.now(),  // ✅ Pakai client timestamp, bukan server timestamp
      });

      console.log(`💾 [HISTORY] ${trigger}`);
      await applyRollingWindow();

      state.statusTerakhir = statusSekarang;
      waktuLogTerakhir     = now;
    }

    console.log(
      `⚡ [LIVE] Hujan: ${isRaining ? "YA" : "TIDAK"} (${intensitas}%) | ` +
      `Cahaya: ${cahaya}% (raw:${ldrRaw}) | Status: ${statusSekarang} | Mode: ${state.mode}`
    );

  }, 3000);
}

// ─── Helper: map() seperti Arduino ────────────────────────────────────────
function map(value, inMin, inMax, outMin, outMax) {
  return Math.round(((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin);
}
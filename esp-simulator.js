import { initializeApp } from "firebase/app";
import { 
  getDatabase, ref, onValue, update, push, 
  serverTimestamp, query, limitToFirst, get 
} from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyChn7VdSPluklKEiNaHCY4chWSwjm4iNGw",
  authDomain: "smartcanopy-57d8a.firebaseapp.com",
  projectId: "smartcanopy-57d8a",
  storageBucket: "smartcanopy-57d8a.firebasestorage.app",
  messagingSenderId: "1004945227100",
  appId: "1:1004945227100:web:7b1ca799e42b023d9dd599",
  databaseURL: "https://smartcanopy-57d8a-default-rtdb.firebaseio.com" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); 

// ✨ KONFIGURASI ROLLING WINDOW
const MAX_RECORDS = 1000; // Simpan maksimal 1000 data terakhir saja

console.log("🚀 Menghubungkan ke Firebase...");

signInWithEmailAndPassword(auth, "rrezmaulana@gmail.com", "123456")
  .then(() => {
    console.log("🟢 Simulator Terautentikasi!");
    startSimulator();
  })
  .catch((error) => console.error("🔴 Gagal Login:", error.message));

// Fungsi untuk membersihkan data lama
async function applyRollingWindow() {
  const historyRef = ref(db, 'Data_Historis');
  
  try {
    const snapshot = await get(historyRef);
    if (snapshot.exists()) {
      const totalData = snapshot.size;
      
      if (totalData > MAX_RECORDS) {
        const excess = totalData - MAX_RECORDS;
        // Ambil data tertua sebanyak jumlah kelebihan (excess)
        const oldestQuery = query(historyRef, limitToFirst(excess));
        const oldestSnapshot = await get(oldestQuery);
        
        const updates = {};
        oldestSnapshot.forEach((child) => {
          updates[child.key] = null; // Set null untuk menghapus
        });
        
        await update(historyRef, updates);
        console.log(`🧹 Rolling Window: Menghapus ${excess} data lama.`);
      }
    }
  } catch (err) {
    console.error("🔴 Gagal membersihkan data:", err);
  }
}

function startSimulator() {
  let state = {
    currentMode: "AUTO",
    currentThreshold: 65,
    manualPosition: 100,
    statusTerakhir: "",
    remoteStatus: "OPEN"
  };

  let waktuLogTerakhir = 0;
  const INTERVAL_LOG_HISTORIS = 60000; // Log tiap 1 menit
  let intensitas = 20;
  let cahaya = 50;

  onValue(ref(db, 'mode'), (s) => state.currentMode = s.val() || "AUTO");
  onValue(ref(db, 'status'), (s) => state.remoteStatus = s.val() || "OPEN");
  onValue(ref(db, 'threshold'), (s) => state.currentThreshold = s.val() || 65);
  onValue(ref(db, 'position'), (s) => state.manualPosition = s.val() || 100);

  setInterval(async () => {
    cahaya += Math.floor(Math.random() * 21) - 10;
    if (cahaya > 100) cahaya = 100;
    if (cahaya < 10) cahaya = 10; // minimal ada sedikit cahaya di siang hari
    
    // Korelasi Cuaca Realistis
    if (cahaya > 40) {
      // Kondisi Cerah -> Tidak mungkin hujan
      intensitas = 0;
    } else {
      // Kondisi Mendung / Gelap -> Berpeluang turun hujan
      intensitas += Math.floor(Math.random() * 15) - 5; 
      if (intensitas > 100) intensitas = 100;
      if (intensitas < 0) intensitas = 0;
      
      // Jika hujan deras, cahaya jadi sangat gelap
      if (intensitas > 30) {
        cahaya -= Math.floor(Math.random() * 10);
        if (cahaya < 0) cahaya = 0;
      }
    }
    
    // Logika buka tutup
    let statusSekarang = state.currentMode === "AUTO" 
      ? (intensitas > state.currentThreshold ? "CLOSED" : "OPEN")
      : state.remoteStatus; // Bila MANUAL, ikuti apa yang ada di Firebase (diubah oleh Bot/Web)

    // A. UPDATE LIVE
    update(ref(db, '/'), { 
      intensitas,
      cahaya,
      status: statusSekarang,
      lastConnected: Date.now() 
    });

    // B. SIMPAN KE HISTORY & TERAPKAN ROLLING
    const sekarang = Date.now();
    const statusBerubah = statusSekarang !== state.statusTerakhir;
    const waktunyaLogBerkala = (sekarang - waktuLogTerakhir) >= INTERVAL_LOG_HISTORIS;

    if (statusBerubah || waktunyaLogBerkala) {
      await push(ref(db, 'Data_Historis'), {
        intensitas,
        cahaya,
        status: statusSekarang,
        mode: state.currentMode,
        timestamp: serverTimestamp()
      });
      
      console.log(`💾 [HISTORY SAVED]`);
      
      // ✨ Jalankan Rolling Window setelah data masuk
      await applyRollingWindow();
      
      state.statusTerakhir = statusSekarang;
      waktuLogTerakhir = sekarang;
    }

    console.log(`⚡ [LIVE] Rain: ${intensitas}% | Light: ${cahaya} Lux | Status: ${statusSekarang}`);
  }, 3000);
}
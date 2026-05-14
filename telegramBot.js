import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, push, serverTimestamp, query, limitToLast, onChildAdded, onValue } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// 🔑 Token API Telegram terbaru dari BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// ✨ Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Login agar bot memiliki akses WRTE (Permission Auth)
signInWithEmailAndPassword(auth, process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD)
  .then(() => {
    console.log("🟢 Telegram Bot Terautentikasi ke Firebase (Write Access Granted)!");
  })
  .catch((error) => console.error("🔴 Gagal Login Firebase:", error.message));

// Menjalankan Telebot dengan teknik Polling
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram Bot Smart Canopy sedang berjalan & terhubung ke Firebase!');

// Set penyimpanan subscriber (Siapa saja yang menyalakan fitur notif otomatis)
const activeSubscribers = new Set();

// Mendaftarkan tombol menu otomatis di User Interface Telegram Client pengguna
bot.setMyCommands([
  { command: '/start', description: 'Mulai & Tampilkan Menu Utama' },
  { command: '/status', description: 'Cek Sensor (Hujan, Cahaya, Posisi)' },
  { command: '/buka', description: 'Buka Kanopi Secara Manual' },
  { command: '/tutup', description: 'Tutup Kanopi Secara Manual' },
  { command: '/otomatis', description: 'Kembalikan kendali sistem ke Auto' },
  { command: '/notifikasi', description: 'Atur on/off notif otomatis' },
  { command: '/riwayat', description: 'Lihat 10 data historis terakhir' },
  { command: '/unduh', description: 'Download semua data (CSV/Excel)' },
  { command: '/help', description: 'Panduan Penggunaan' }
]);

// Listener Firebase untuk notifikasi otomatis
let isInitialLoad = true;
const historyQuery = query(ref(database, 'Data_Historis'), limitToLast(1));
onChildAdded(historyQuery, (snapshot) => {
  if (isInitialLoad) return; // Jangan kirim notifikasi saat bot baru dinyalakan (untuk data lama)
  const data = snapshot.val();
  
  if (data) {
    const icon = data.type === 'critical' || data.type === 'warning' ? '⚠️' : 'ℹ️';
    const msg = `🔔 *INFO SISTEM BARU*\n\n${icon} *${data.title}*\n${data.message}\n\n⏱ Waktu: ${new Date(data.timestamp).toLocaleString()}`;
    
    activeSubscribers.forEach((chatId) => {
      bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    });
  }
});
setTimeout(() => isInitialLoad = false, 3000);

// Helper untuk mencatat Log ke Riwayat Web & Monitoring saat Telegram memberikan aksi
const letakDataRiwayat = async (actionText) => {
  try {
    const [snapHujan, snapCahaya, snapCanopy, snapSettings] = await Promise.all([
      get(ref(database, '/sensors/hujan')),
      get(ref(database, '/sensors/cahaya')),
      get(ref(database, '/canopy')),
      get(ref(database, '/settings'))
    ]);

    const hujanVal = snapHujan.val() || { intensitas: 0, isRaining: false };
    const cahayaVal = snapCahaya.val() || { lux: 0, raw: 0 };
    const canopyVal = snapCanopy.val() || { status: 'OPEN', position: 100 };
    const settingsVal = snapSettings.val() || { mode: 'AUTO', threshold: 50 };

    push(ref(database, 'Data_Historis'), {
      sensors: {
        hujan: hujanVal,
        cahaya: cahayaVal
      },
      canopy: canopyVal,
      settings: settingsVal,
      trigger: actionText,
      message: `Admin mengontrol melalui Telegram Bot: ${actionText}`,
      title: actionText,
      type: 'info',
      isRead: false,
      timestamp: serverTimestamp()
    });
  } catch(e) {
    console.error("Gagal mencatat log dari Telegram:", e);
  }
};


// 🔹 COMMAND: /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username ? `@${msg.from.username}` : msg.from?.first_name || 'Admin';

  const welcomeMessage = `
🌟 *Selamat datang ${username} di Smart Canopy Bot!* 🌟

Saya bisa membantu Anda memantau dan mengontrol sistem Kanopi Pintar secara real-time langsung dari Telegram genggaman Anda.

Gunakan bagian Menu (tanda ☰ di sebelah kiri bawah) atau ketik /help untuk melihat fitur bot.
`;
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});


// 🔹 COMMAND: /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
⚙️ *PANDUAN PENGOPERASIAN SISTEM* ⚙️

Berikut kendali yang langsung tersambung ke _Cloud Controller_:
➡️ /start - Menampilkan pesan pembuka
➡️ /status - Cek Data Sensor Terkini (Air, Cahaya, Status Kanopi)
➡️ /buka - Mengajukan perintah "Buka Kanopi" secara manual (Akan mem-bypass mode otomatis!)
➡️ /tutup - Mengajukan perintah "Tutup Kanopi" secara manual
➡️ /otomatis - Melepas manual bypass dan mengembalikan sistem ke Mode Pintar (Otomatis)
➡️ /help - Panduan bantuan ini
`;
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});


// 🔹 COMMAND: /status
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const [snapHujan, snapCahaya, snapCanopy, snapSettings] = await Promise.all([
      get(ref(database, '/sensors/hujan')),
      get(ref(database, '/sensors/cahaya')),
      get(ref(database, '/canopy')),
      get(ref(database, '/settings'))
    ]);

    const hujanVal = snapHujan.val() || {};
    const cahayaVal = snapCahaya.val() || {};
    const canopyVal = snapCanopy.val() || {};
    const settingsVal = snapSettings.val() || {};

    const isRaining = hujanVal.isRaining || false;
    const lux = cahayaVal.lux || 0;
    const suhuKonversi = Math.round(24 + (lux * 0.12));

    const statusMessage = `
☁️ *STATUS SISTEM CENSOR SAAT INI* ☁️

🌧️ *Status Hujan:* ${isRaining ? 'Hujan' : 'Cerah'}
☀️ *Iluminasi Cahaya:* ${lux} Lux
🌡️ *Temperatur Udara:* ${suhuKonversi}°C
🔄 *Kondisi Kanopi:* ${canopyVal.status === 'CLOSED' ? '🔴 Tertutup' : '🟢 Terbuka'}
⚙️ *Mode Kendali:* \`${settingsVal.mode || 'AUTO'}\`
📈 *Batas Threshold Cahaya:* ${settingsVal.threshold || 0}
⏱️ *Posisi Motor Lengan:* ${canopyVal.position || 0}%
`;
    bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `⚠️ Gagal membaca Firebase DB: ${error.message}`);
  }
});


// 🔹 COMMAND: /buka
bot.onText(/\/buka/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    await Promise.all([
      update(ref(database, '/settings'), { mode: 'MANUAL' }),
      update(ref(database, '/canopy'), { status: 'OPEN', position: 100 })
    ]);
    
    // Simpan ke notifikasi Dashboard WEB
    await letakDataRiwayat('Buka Kanopi');

    bot.sendMessage(chatId, '✅ *PROSES DIKIRIM!* Perintah MENGUBAH mode menjadi *MANUAL* dan MEMBUKA kanopi berhasil tercatat di Cloud Firebase.', { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `⚠️ Kegagalan Bypass Firebase: ${error.message}`);
  }
});


// 🔹 COMMAND: /tutup
bot.onText(/\/tutup/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    await Promise.all([
      update(ref(database, '/settings'), { mode: 'MANUAL' }),
      update(ref(database, '/canopy'), { status: 'CLOSED', position: 0 })
    ]);
    
    // Simpan ke notifikasi Dashboard WEB
    await letakDataRiwayat('Tutup Kanopi');

    bot.sendMessage(chatId, '🚨 *PROSES DIKIRIM!* Perintah MENGUBAH mode menjadi *MANUAL* dan MENUTUP kanopi berhasil tercatat di Cloud Firebase.', { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `⚠️ Kegagalan Bypass Firebase: ${error.message}`);
  }
});

// 🔹 COMMAND: /otomatis
bot.onText(/\/otomatis/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    await update(ref(database, '/settings'), { 
      mode: 'AUTO'
    });
    
    // Simpan ke notifikasi Dashboard WEB
    await letakDataRiwayat('Ubah Mode ke Auto');

    bot.sendMessage(chatId, '🤖 *MODE OTOMATIS AKTIF!* Sistem kini kembali beroperasi secara otonom berdasarkan data sensor (Hujan & Cahaya).', { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `⚠️ Gagal Mengubah Mode Firebase: ${error.message}`);
  }
});

// 🔹 COMMAND: /notifikasi
bot.onText(/\/notifikasi/, (msg) => {
  const chatId = msg.chat.id;
  if (activeSubscribers.has(chatId)) {
    activeSubscribers.delete(chatId);
    bot.sendMessage(chatId, '🔕 *Notifikasi Otomatis DIMATIKAN*.\nAnda tidak akan menerima pembaruan sistem secara langsung via chat ini lagi.', { parse_mode: 'Markdown' });
  } else {
    activeSubscribers.add(chatId);
    bot.sendMessage(chatId, '🔔 *Notifikasi Otomatis DIAKTIFKAN*.\nSistem akan mengirimkan push notification pada chat ini setiap kali ada perubahan status perangkat IoT Anda!', { parse_mode: 'Markdown' });
  }
});

// 🔹 COMMAND: /riwayat
bot.onText(/\/riwayat/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const snapshot = await get(query(ref(database, 'Data_Historis'), limitToLast(10)));
    if (snapshot.exists()) {
      const logs = [];
      snapshot.forEach(child => {
        logs.push(child.val());
      });
      
      const reversedLogs = logs.reverse();
      let replyMessage = `📜 *10 RIWAYAT TERAKHIR SISTEM PINTAR ANDA*\n\n`;
      
      reversedLogs.forEach((log, index) => {
        const icon = log.type === 'critical' ? '🔴' : log.type === 'warning' ? '🟠' : '🟢';
        const dateObj = new Date(log.timestamp);
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        replyMessage += `${index + 1}. ${icon} *${log.title}*\n`;
        replyMessage += `   ├ Waktu: ${timeStr}\n`;
        replyMessage += `   └ Detail: ${log.message}\n\n`;
      });
      
      bot.sendMessage(chatId, replyMessage, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '📭 Belum ada riwayat aktivitas di database saat ini.', { parse_mode: 'Markdown' });
    }
  } catch (err) {
    bot.sendMessage(chatId, `⚠️ Gagal membaca riwayat: ${err.message}`);
  }
});

// 🔹 COMMAND: /unduh
bot.onText(/\/unduh/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '⏳ Sedang mengkompilasi file data, mohon tunggu...');
  
  try {
    const snapshot = await get(ref(database, 'Data_Historis'));
    if (snapshot.exists()) {
      let csvContent = 'Tanggal,Jam,StatusKanopi,Mode,Pesan\n';
      
      snapshot.forEach(child => {
        const log = child.val();
        const dateObj = new Date(log.timestamp);
        const tanggalLengkap = dateObj.toLocaleDateString('id-ID');
        const rincianJam = dateObj.toLocaleTimeString('id-ID');
        const safeMem = String(log.message).replace(/,/g, ':'); // Hapus koma di string message agar tidak bentrok CSV
        
        const status = log.canopy?.status || log.status || '-';
        const mode = log.settings?.mode || log.mode || '-';
        csvContent += `${tanggalLengkap},${rincianJam},${status},${mode},${safeMem}\n`;
      });

      const buffer = Buffer.from(csvContent, 'utf-8');
      
      bot.sendDocument(chatId, buffer, {
        caption: '✅ Data berhasi diunduh dari Cloud!'
      }, {
        filename: 'Data_Historis_Canopy.csv',
        contentType: 'text/csv'
      });
      
    } else {
      bot.sendMessage(chatId, '📭 Database historis masih kosong!', { parse_mode: 'Markdown' });
    }
  } catch (err) {
    bot.sendMessage(chatId, `⚠️ Gagal mengkonversi rekaman data: ${err.message}`);
  }
});

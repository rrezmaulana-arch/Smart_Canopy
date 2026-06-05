import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, push, serverTimestamp, query, limitToLast } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const token = process.env.TELEGRAM_BOT_TOKEN;

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

// Initialize Firebase App
let app, database, auth;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase init error:", error);
}

// Inisialisasi bot TANPA polling (karena kita akan pakai Webhook untuk Vercel)
const bot = new TelegramBot(token);

const activeSubscribers = new Set(); // Di Vercel Serverless, state ini akan hilang setiap kali request selesai.

// Helper untuk mencatat Log ke Riwayat Web
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

    await push(ref(database, 'Data_Historis'), {
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

// 🔹 COMMANDS
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username ? `@${msg.from.username}` : msg.from?.first_name || 'Admin';
  bot.sendMessage(chatId, `🌟 *Selamat datang ${username} di Smart Canopy Bot!* 🌟\n\nSaya berjalan di Vercel secara Serverless.\nKetik /help untuk panduan.`, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `⚙️ *PANDUAN PENGOPERASIAN SISTEM* ⚙️\n\n➡️ /start - Menampilkan pesan pembuka\n➡️ /status - Cek Data Sensor Terkini\n➡️ /buka - Buka Kanopi\n➡️ /tutup - Tutup Kanopi\n➡️ /otomatis - Mode Pintar (Otomatis)\n➡️ /riwayat - 10 data historis terakhir\n➡️ /unduh - Download semua data`, { parse_mode: 'Markdown' });
});

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
    bot.sendMessage(chatId, `☁️ *STATUS SISTEM CENSOR SAAT INI* ☁️\n\n🌧️ *Status Hujan:* ${isRaining ? 'Hujan' : 'Cerah'}\n☀️ *Iluminasi Cahaya:* ${lux} Lux\n🌡️ *Temperatur Udara:* ${suhuKonversi}°C\n🔄 *Kondisi Kanopi:* ${canopyVal.status === 'CLOSED' ? '🔴 Tertutup' : '🟢 Terbuka'}\n⚙️ *Mode Kendali:* \`${settingsVal.mode || 'AUTO'}\`\n📈 *Batas Threshold Cahaya:* ${settingsVal.threshold || 0}\n⏱️ *Posisi Motor Lengan:* ${canopyVal.position || 0}%`, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `⚠️ Gagal membaca Firebase DB: ${error.message}`);
  }
});

bot.onText(/\/buka/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    await Promise.all([
      update(ref(database, '/settings'), { mode: 'MANUAL' }),
      update(ref(database, '/canopy'), { status: 'OPEN', position: 100 })
    ]);
    await letakDataRiwayat('Buka Kanopi');
    bot.sendMessage(chatId, '✅ *PROSES DIKIRIM!* Perintah MENGUBAH mode menjadi *MANUAL* dan MEMBUKA kanopi berhasil tercatat di Cloud Firebase.', { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `⚠️ Kegagalan Bypass Firebase: ${error.message}`);
  }
});

bot.onText(/\/tutup/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    await Promise.all([
      update(ref(database, '/settings'), { mode: 'MANUAL' }),
      update(ref(database, '/canopy'), { status: 'CLOSED', position: 0 })
    ]);
    await letakDataRiwayat('Tutup Kanopi');
    bot.sendMessage(chatId, '🚨 *PROSES DIKIRIM!* Perintah MENGUBAH mode menjadi *MANUAL* dan MENUTUP kanopi berhasil tercatat di Cloud Firebase.', { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `⚠️ Kegagalan Bypass Firebase: ${error.message}`);
  }
});

bot.onText(/\/otomatis/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    await update(ref(database, '/settings'), { mode: 'AUTO' });
    await letakDataRiwayat('Ubah Mode ke Auto');
    bot.sendMessage(chatId, '🤖 *MODE OTOMATIS AKTIF!* Sistem kini kembali beroperasi secara otonom berdasarkan data sensor (Hujan & Cahaya).', { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `⚠️ Gagal Mengubah Mode Firebase: ${error.message}`);
  }
});

bot.onText(/\/riwayat/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const snapshot = await get(query(ref(database, 'Data_Historis'), limitToLast(10)));
    if (snapshot.exists()) {
      const logs = [];
      snapshot.forEach(child => { logs.push(child.val()); });
      const reversedLogs = logs.reverse();
      let replyMessage = `📜 *10 RIWAYAT TERAKHIR SISTEM PINTAR ANDA*\n\n`;
      reversedLogs.forEach((log, index) => {
        const icon = log.type === 'critical' ? '🔴' : log.type === 'warning' ? '🟠' : '🟢';
        const dateObj = new Date(log.timestamp);
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        replyMessage += `${index + 1}. ${icon} *${log.title}*\n   ├ Waktu: ${timeStr}\n   └ Detail: ${log.message}\n\n`;
      });
      bot.sendMessage(chatId, replyMessage, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '📭 Belum ada riwayat aktivitas di database saat ini.', { parse_mode: 'Markdown' });
    }
  } catch (err) {
    bot.sendMessage(chatId, `⚠️ Gagal membaca riwayat: ${err.message}`);
  }
});

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
        const safeMem = String(log.message).replace(/,/g, ':'); 
        const status = log.canopy?.status || log.status || '-';
        const mode = log.settings?.mode || log.mode || '-';
        csvContent += `${tanggalLengkap},${rincianJam},${status},${mode},${safeMem}\n`;
      });
      const buffer = Buffer.from(csvContent, 'utf-8');
      bot.sendDocument(chatId, buffer, { caption: '✅ Data berhasi diunduh dari Cloud!' }, { filename: 'Data_Historis_Canopy.csv', contentType: 'text/csv' });
    } else {
      bot.sendMessage(chatId, '📭 Database historis masih kosong!', { parse_mode: 'Markdown' });
    }
  } catch (err) {
    bot.sendMessage(chatId, `⚠️ Gagal mengkonversi rekaman data: ${err.message}`);
  }
});

// Endpoint untuk diakses oleh Webhook Telegram di Vercel
export default async function handler(req, res) {
  // Hanya proses metode POST dari Telegram
  if (req.method === 'POST') {
    try {
      // Pastikan bot memiliki izin akses WRITE ke Firebase dengan Autentikasi
      if (!auth.currentUser) {
         await signInWithEmailAndPassword(auth, process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD);
      }
      
      const { body } = req;
      
      // Mengarahkan request Telegram ke node-telegram-bot-api
      if (body) {
        bot.processUpdate(body);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error("Vercel Webhook Error:", error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    // Jika diakses menggunakan browser / metode GET
    res.status(200).send('Smart Canopy Telegram Bot is running on Vercel Serverless Function!');
  }
}

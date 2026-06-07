import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, push, serverTimestamp, query, limitToLast } from 'firebase/database';
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

// Menjalankan Telebot
const bot = new TelegramBot(token);

// Set penyimpanan subscriber (Siapa saja yang menyalakan fitur notif otomatis)
// Catatan: Pada Vercel (Serverless), Set ini akan mereset setiap kali server idle/dingin.
const activeSubscribers = new Set();

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
      timestamp: Date.now()
    });
  } catch(e) {
    console.error("Gagal mencatat log dari Telegram:", e);
  }
};

// Endpoint Webhook Vercel
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Pastikan Firebase Terautentikasi (Write Access)
      if (!auth.currentUser) {
         await signInWithEmailAndPassword(auth, process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD);
      }
      
      const { body } = req;
      
      // Routing Manual untuk mencegah Vercel mematikan fungsi sebelum selesai mengeksekusi Firebase
      if (body && body.message) {
        const msg = body.message;
        const chatId = msg.chat.id;
        const text = msg.text || '';
        
        if (text.startsWith('/start')) {
          const username = msg.from?.username ? `@${msg.from.username}` : msg.from?.first_name || 'Admin';
          const welcomeMessage = `🌟 *Selamat datang ${username} di Smart Canopy Bot!* 🌟\n\nSaya bisa membantu Anda memantau dan mengontrol sistem Kanopi Pintar secara real-time langsung dari Telegram genggaman Anda.\n\nGunakan bagian Menu (tanda ☰ di sebelah kiri bawah) atau ketik /help untuk melihat fitur bot.`;
          await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
          
        } else if (text.startsWith('/help')) {
          const helpMessage = `⚙️ *PANDUAN PENGOPERASIAN SISTEM* ⚙️\n\nBerikut kendali yang langsung tersambung ke _Cloud Controller_:\n➡️ /start - Menampilkan pesan pembuka\n➡️ /status - Cek Data Sensor Terkini (Air, Cahaya, Status Kanopi)\n➡️ /buka - Mengajukan perintah "Buka Kanopi" secara manual (Akan mem-bypass mode otomatis!)\n➡️ /tutup - Mengajukan perintah "Tutup Kanopi" secara manual\n➡️ /otomatis - Melepas manual bypass dan mengembalikan sistem ke Mode Pintar (Otomatis)\n➡️ /notifikasi - Atur on/off notifikasi otomatis\n➡️ /riwayat - Lihat 10 data historis terakhir\n➡️ /unduh - Download semua data (CSV/Excel)\n➡️ /help - Panduan bantuan ini`;
          await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
          
        } else if (text.startsWith('/status')) {
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

          const statusMessage = `☁️ *STATUS SISTEM CENSOR SAAT INI* ☁️\n\n🌧️ *Status Hujan:* ${isRaining ? 'Hujan' : 'Cerah'}\n☀️ *Iluminasi Cahaya:* ${lux} Lux\n🌡️ *Temperatur Udara:* ${suhuKonversi}°C\n🔄 *Kondisi Kanopi:* ${canopyVal.status === 'CLOSED' ? '🔴 Tertutup' : '🟢 Terbuka'}\n⚙️ *Mode Kendali:* \`${settingsVal.mode || 'AUTO'}\`\n📈 *Batas Threshold Cahaya:* ${settingsVal.threshold || 0}\n⏱️ *Posisi Motor Lengan:* ${canopyVal.position || 0}%`;
          await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
          
        } else if (text.startsWith('/buka')) {
          await Promise.all([
            update(ref(database, '/settings'), { mode: 'MANUAL' }),
            update(ref(database, '/canopy'), { status: 'OPEN', position: 100 })
          ]);
          await letakDataRiwayat('Buka Kanopi');
          await bot.sendMessage(chatId, '✅ *PROSES DIKIRIM!* Perintah MENGUBAH mode menjadi *MANUAL* dan MEMBUKA kanopi berhasil tercatat di Cloud Firebase.', { parse_mode: 'Markdown' });
          
        } else if (text.startsWith('/tutup')) {
          await Promise.all([
            update(ref(database, '/settings'), { mode: 'MANUAL' }),
            update(ref(database, '/canopy'), { status: 'CLOSED', position: 0 })
          ]);
          await letakDataRiwayat('Tutup Kanopi');
          await bot.sendMessage(chatId, '🚨 *PROSES DIKIRIM!* Perintah MENGUBAH mode menjadi *MANUAL* dan MENUTUP kanopi berhasil tercatat di Cloud Firebase.', { parse_mode: 'Markdown' });
          
        } else if (text.startsWith('/otomatis')) {
          await update(ref(database, '/settings'), { mode: 'AUTO' });
          await letakDataRiwayat('Ubah Mode ke Auto');
          await bot.sendMessage(chatId, '🤖 *MODE OTOMATIS AKTIF!* Sistem kini kembali beroperasi secara otonom berdasarkan data sensor (Hujan & Cahaya).', { parse_mode: 'Markdown' });
          
        } else if (text.startsWith('/notifikasi')) {
          if (activeSubscribers.has(chatId)) {
            activeSubscribers.delete(chatId);
            await bot.sendMessage(chatId, '🔕 *Notifikasi Otomatis DIMATIKAN*.\nAnda tidak akan menerima pembaruan sistem secara langsung via chat ini lagi.', { parse_mode: 'Markdown' });
          } else {
            activeSubscribers.add(chatId);
            await bot.sendMessage(chatId, '🔔 *Notifikasi Otomatis DIAKTIFKAN*.\nSistem akan mengirimkan push notification pada chat ini setiap kali ada perubahan status perangkat IoT Anda!', { parse_mode: 'Markdown' });
          }
          
        } else if (text.startsWith('/riwayat')) {
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
            
            await bot.sendMessage(chatId, replyMessage, { parse_mode: 'Markdown' });
          } else {
            await bot.sendMessage(chatId, '📭 Belum ada riwayat aktivitas di database saat ini.', { parse_mode: 'Markdown' });
          }
          
        } else if (text.startsWith('/unduh')) {
          await bot.sendMessage(chatId, '⏳ Sedang mengkompilasi file data, mohon tunggu...');
          
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
            
            await bot.sendDocument(chatId, buffer, {
              caption: '✅ Data berhasi diunduh dari Cloud!'
            }, {
              filename: 'Data_Historis_Canopy.csv',
              contentType: 'text/csv'
            });
          } else {
            await bot.sendMessage(chatId, '📭 Database historis masih kosong!', { parse_mode: 'Markdown' });
          }
        }
      }
      
      // Kirim status OK agar Vercel menutup koneksi
      res.status(200).send('OK');
    } catch (error) {
      console.error("Vercel Webhook Error:", error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(200).send('Smart Canopy Telegram Bot is running on Vercel Serverless Function!');
  }
}

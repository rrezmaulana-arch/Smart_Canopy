# 🌂 Smart Canopy — IoT Automated Canopy System

<p align="center">
  <img src="https://img.shields.io/badge/Platform-ESP32-blue?style=for-the-badge&logo=espressif" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Database-Firebase%20RTDB-FFCA28?style=for-the-badge&logo=firebase" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38BDF8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Mobile-Capacitor%20(Android)-3880FF?style=for-the-badge&logo=capacitor" />
</p>

> **Smart Canopy** adalah sistem atap/kanopi otomatis berbasis IoT yang dapat membuka dan menutup kanopi secara otomatis berdasarkan kondisi cuaca (sensor hujan & cahaya) — atau dikendalikan secara manual via dashboard web real-time yang terhubung ke perangkat keras ESP32.

---

## 📸 Preview

> _Dashboard monitoring real-time dengan desain glassmorphism modern._

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|---|---|
| 🌧️ **Mode AUTO** | Kanopi menutup otomatis saat hujan terdeteksi, membuka kembali saat cuaca cerah |
| 🕹️ **Mode MANUAL** | Kontrol buka/tutup langsung dari web dashboard |
| 📊 **Dashboard Real-time** | Data sensor (hujan, cahaya) diperbarui langsung tanpa refresh halaman |
| 📈 **Riwayat Data** | Log historis setiap aksi kanopi dengan timestamp (hingga 100 entri terbaru) |
| 🔔 **Notifikasi** | Sistem notifikasi event penting |
| 🤖 **Telegram Bot** | Pelaporan status otomatis via bot Telegram |
| 🔐 **Auth Firebase** | Akses dashboard dilindungi autentikasi Firebase (Email & Password) |
| 📱 **Android App** | Dapat di-build sebagai APK Android menggunakan Capacitor |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    SMART CANOPY SYSTEM                   │
├──────────────────┬──────────────────┬────────────────────┤
│   HARDWARE       │   CLOUD          │   FRONTEND         │
│                  │                  │                    │
│  ESP32           │  Firebase RTDB   │  React + TypeScript│
│  ├─ Rain Sensor  │  ├─ /sensors     │  ├─ Dashboard      │
│  ├─ LDR Sensor   │  ├─ /canopy      │  ├─ Control Panel  │
│  ├─ Limit Switch │  ├─ /settings    │  ├─ Monitoring     │
│  └─ Motor DC     │  ├─ /Data_Histor.│  ├─ Data Historis  │
│     (L298N)      │  └─ /system      │  └─ Notifications  │
│                  │                  │                    │
└──────────────────┴──────────────────┴────────────────────┘
```

**Alur Kerja:**
1. Sensor hujan & LDR pada ESP32 membaca kondisi cuaca setiap 800ms
2. Data dikirim ke **Firebase Realtime Database** via WiFi
3. Dashboard web menerima update instan melalui koneksi **WebSocket** Firebase
4. Perintah dari web (buka/tutup) dikirim kembali ke ESP32 via stream Firebase
5. ESP32 menggerakkan motor DC menggunakan driver L298N, dengan limit switch sebagai safety stop

---

## 🛠️ Tech Stack

### Hardware
- **ESP32** — Mikrokontroler utama (WiFi + Bluetooth built-in)
- **Sensor Hujan** — Deteksi kondisi basah/kering
- **LDR (Light Dependent Resistor)** — Deteksi intensitas cahaya
- **Motor DC + Driver L298N** — Menggerakkan mekanisme buka/tutup kanopi
- **Limit Switch** — Pembatas posisi aman (fully open / fully closed)

### Firmware
- **Arduino Framework** (C++) pada ESP32
- Library: `Firebase_ESP_Client`, `WiFi.h`

### Frontend (Web Dashboard)
- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool & dev server
- **Tailwind CSS** — Styling utility-first
- **Firebase SDK** — Real-time database & auth
- **Recharts** — Visualisasi grafik sensor
- **React Three Fiber / Three.js** — Elemen 3D interaktif
- **React Router DOM** — Navigasi halaman

### Backend / Infra
- **Firebase Realtime Database** — Database NoSQL real-time
- **Firebase Authentication** — Manajemen pengguna
- **Telegram Bot** (`node-telegram-bot-api`) — Notifikasi otomatis
- **Capacitor** — Build Android APK dari web app

---

## 📁 Struktur Proyek

```
Smart_Canopy/
├── firmware/
│   └── SmartCanopy_ESP32.ino   # Kode firmware ESP32
├── src/
│   ├── components/             # Komponen React reusable
│   ├── contexts/
│   │   └── FirebaseContext.tsx # Context utama data real-time Firebase
│   ├── hooks/                  # Custom React hooks
│   ├── layouts/                # Layout wrapper halaman
│   ├── pages/
│   │   ├── LandingPage.tsx     # Halaman utama / intro
│   │   ├── Login.tsx           # Autentikasi pengguna
│   │   ├── Dashboard.tsx       # Dashboard monitoring utama
│   │   ├── Control.tsx         # Panel kontrol manual
│   │   ├── Monitoring.tsx      # Monitoring sensor detail
│   │   ├── DataHistoris.tsx    # Riwayat log aktivitas
│   │   └── Notifications.tsx   # Pusat notifikasi
│   ├── services/               # Layanan API Firebase
│   └── types/
│       └── index.ts            # Type definitions TypeScript
├── database.rules.json         # Aturan keamanan Firebase RTDB
├── telegramBot.js              # Script Telegram bot
├── esp-simulator.js            # Simulator ESP32 untuk testing
├── .env.example                # Template environment variables
└── capacitor.config.ts         # Konfigurasi build Android
```

---

## 🚀 Cara Setup & Menjalankan

### Prasyarat
- Node.js >= 18
- Akun [Firebase](https://firebase.google.com/) (gratis)
- Arduino IDE / PlatformIO (untuk upload firmware)
- Hardware ESP32 + komponen sensor

---

### 1. Clone Repository

```bash
git clone https://github.com/rrezmaulana-arch/Smart_Canopy.git
cd Smart_Canopy
```

### 2. Setup Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan **Realtime Database** dan **Authentication** (Email/Password)
3. Deploy aturan keamanan database:
   ```bash
   # Salin isi database.rules.json ke Firebase Rules
   ```

### 3. Konfigurasi Environment Variables

Salin `.env.example` menjadi `.env` dan isi dengan kredensial Firebase kamu:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Install Dependencies & Jalankan Web

```bash
npm install
npm run dev
```

Akses di browser: `http://localhost:5173`

### 5. Upload Firmware ke ESP32

1. Buka `firmware/SmartCanopy_ESP32.ino` di Arduino IDE
2. Install library: **Firebase ESP Client** (via Library Manager)
3. Edit bagian konfigurasi di atas file:

```cpp
#define WIFI_SSID       "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD   "PASSWORD_WIFI"
#define API_KEY         "FIREBASE_API_KEY"
#define DATABASE_URL    "https://project-id-rtdb.firebaseio.com"
#define USER_EMAIL      "email@gmail.com"
#define USER_PASSWORD   "password_firebase"
```

4. Pilih board **ESP32 Dev Module**, lalu Upload

### 6. (Opsional) Jalankan Telegram Bot

```bash
npm run bot
```

---

## 📌 Konfigurasi Pin ESP32

| Pin GPIO | Fungsi |
|---|---|
| GPIO 27 | Motor IN1 (L298N) |
| GPIO 33 | Motor IN2 (L298N) |
| GPIO 14 | Motor Enable (PWM Speed) |
| GPIO 25 | Limit Switch Dalam (posisi TERBUKA) |
| GPIO 32 | Limit Switch Luar (posisi TERTUTUP) |
| GPIO 26 | Sensor Hujan |
| GPIO 34 | Sensor LDR (Cahaya) |

---

## 🔒 Keamanan

- Semua akses Firebase RTDB dilindungi rule `auth != null` — hanya user yang sudah login yang bisa baca/tulis data
- Kredensial sensitif disimpan di `.env` (tidak di-commit ke GitHub)
- `.gitignore` sudah dikonfigurasi untuk mengecualikan `.env` dan `node_modules`

---

## 🧪 Testing Tanpa Hardware

Gunakan **ESP Simulator** untuk mensimulasikan data sensor tanpa perangkat fisik:

```bash
node esp-simulator.js
```

Script ini akan mengirim data palsu ke Firebase sehingga dashboard dapat diuji sepenuhnya dari browser.

---

## 📱 Build Android APK

```bash
npm run build
npx cap sync android
npx cap open android
```

Kemudian build APK dari Android Studio.

---

## 📄 Lisensi

Proyek ini menggunakan lisensi [MIT](LICENSE).

---

## 👨‍💻 Dibuat oleh

**Reza Moetia** — [@rrezmaulana-arch](https://github.com/rrezmaulana-arch)

> _"Dari sensor ke cloud, dari cloud ke layar, dari layar ke dunia nyata."_

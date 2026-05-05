# 📋 PANDUAN HARDWARE - Smart Canopy ESP32

> **Dokumen ini dibuat untuk Engineer Hardware.**  
> Ikuti langkah di bawah ini agar sistem bisa terhubung dengan Web App.

---

## 📦 Komponen yang Digunakan

| No | Komponen              | Jumlah | Keterangan                              |
|----|-----------------------|--------|-----------------------------------------|
| 1  | ESP32 Dev Board       | 1      | Mikrokontroler utama                    |
| 2  | Sensor Hujan (Analog) | 1      | Gunakan pin **AO** (bukan DO)           |
| 3  | Sensor Cahaya LDR     | 1      | Gunakan pin **AO** (bukan DO)           |
| 4  | Motor DC Gearbox      | 1      | Digerakkan via Driver L298N             |
| 5  | Driver Motor L298N    | 1      | Kontrol arah & kecepatan motor          |
| 6  | Micro Limit Switch    | 2      | Satu untuk posisi BUKA, satu TUTUP      |
| 7  | Adaptor 5V 2A         | 1      | Sumber daya utama                       |

---

## 🔌 Wiring / Koneksi PIN

```
[SENSOR HUJAN]
  AO  ───────────────────── GPIO 34 (ESP32)
  VCC ───────────────────── 3.3V (ESP32)
  GND ───────────────────── GND (ESP32)

[SENSOR CAHAYA LDR]
  AO  ───────────────────── GPIO 35 (ESP32)
  VCC ───────────────────── 3.3V (ESP32)
  GND ───────────────────── GND (ESP32)

[DRIVER MOTOR L298N]
  IN1 ───────────────────── GPIO 25 (ESP32)
  IN2 ───────────────────── GPIO 26 (ESP32)
  ENA ───────────────────── GPIO 27 (ESP32) [PWM]
  VCC (Motor) ───────────── 5V / Adaptor langsung
  GND ───────────────────── GND (ESP32 + Adaptor)

[LIMIT SWITCH - POSISI BUKA]
  PIN 1 ──────────────────── GPIO 18 (ESP32)
  PIN 2 ──────────────────── GND
  (Pakai mode INPUT_PULLUP, tidak perlu resistor eksternal)

[LIMIT SWITCH - POSISI TUTUP]
  PIN 1 ──────────────────── GPIO 19 (ESP32)
  PIN 2 ──────────────────── GND
```

> ⚠️ **Penting:** GPIO 34 dan 35 pada ESP32 adalah **INPUT ONLY** (tidak bisa output), cocok untuk sensor analog.

---

## 💻 Cara Upload Firmware

### 1. Install Arduino IDE
Download di: https://www.arduino.cc/en/software

### 2. Tambahkan Board ESP32
- Buka **File → Preferences**
- Tambahkan URL berikut di "Additional boards manager URLs":
  ```
  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
  ```
- Buka **Tools → Board → Boards Manager**, cari `esp32`, install.

### 3. Install Library yang Dibutuhkan
Buka **Sketch → Include Library → Manage Libraries**, install:
- ✅ `Firebase ESP Client` by **Mobizt**
- ✅ `DHT sensor library` by **Adafruit** (opsional, jika ada sensor suhu)
- ✅ `Adafruit Unified Sensor` (opsional, jika ada sensor suhu)

### 4. Buka File Firmware
Buka file `SmartCanopy_ESP32.ino`

### 5. Edit Konfigurasi WiFi di File
Cari bagian ini dan isi sesuai jaringan WiFi kamu:
```cpp
#define WIFI_SSID       "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD   "PASSWORD_WIFI_KAMU"
```
> ⚠️ **Jangan ubah baris lain selain WiFi SSID dan PASSWORD!**

### 6. Upload
- Pilih Board: **Tools → Board → ESP32 Dev Module**
- Pilih Port yang benar (misal: COM3)
- Klik tombol **Upload** (▶)
- Setelah selesai, buka **Serial Monitor** (baud rate: **115200**)

---

## 🔍 Cara Verifikasi Sistem Bekerja

Setelah upload, buka **Serial Monitor**. Kamu akan melihat:

```
========================================
  SMART CANOPY - ESP32 Booting...
========================================
[WIFI] Menghubungkan ke NamaWiFi..........
[WIFI] Terhubung! IP: 192.168.x.x
[FIREBASE] Menunggu autentikasi...
[FIREBASE] Siap!
[INIT] Mode: AUTO | Threshold: 30% | Status: OPEN
[BOOT] Selesai. Memulai loop utama...

[SENSOR] Hujan: 5% | Cahaya: 450 Lux | Suhu: 28.5°C
[FIREBASE] Data sensor terkirim.
[FIREBASE] Heartbeat OK.
```

Jika muncul pesan di atas, **sistem sudah terhubung dengan Web App** ✅

---

## ⚙️ Kalibrasi Sensor (Penting!)

### Sensor Hujan
1. Dalam kondisi **KERING**, baca nilai ADC (terlihat di Serial Monitor)
2. Dalam kondisi **BASAH** (siram air ke sensor), baca nilai ADC
3. Jika nilai tidak sesuai (misal hujan 0% saat basah), ubah logika map di kode:
   ```cpp
   // Baris 161 di firmware - sesuaikan 4095 dan 0
   sensorHujan = map(rawHujan, 4095, 0, 0, 100);
   ```

### Motor & Limit Switch
1. Pastikan limit switch tertekan saat canopy di posisi **TERBUKA PENUH** (GPIO 18)
2. Pastikan limit switch tertekan saat canopy di posisi **TERTUTUP PENUH** (GPIO 19)
3. Jika motor berputar arah terbalik, swap PIN IN1 dan IN2:
   ```cpp
   #define PIN_MOTOR_IN1   26   // Tukar
   #define PIN_MOTOR_IN2   25   // Tukar
   ```
4. Jika motor terlalu lambat/kencang, ubah nilai:
   ```cpp
   #define MOTOR_SPEED  200  // Range: 0-255
   ```

---

## ❓ Troubleshooting

| Problem | Solusi |
|---------|--------|
| Serial Monitor kosong | Pastikan baud rate = **115200** |
| WiFi gagal konek | Cek SSID & Password, pastikan WiFi 2.4GHz |
| Firebase GAGAL | Pastikan koneksi internet stabil |
| Motor tidak bergerak | Cek wiring L298N, cek supply 5V |
| Sensor selalu 0 | Cek kabel AO sensor terhubung ke pin yang benar |
| `[LIMIT] Sudah di posisi...` terus menerus | Cek limit switch wiring (harus ke GND) |

---

## 📞 Kontak Jika Ada Masalah

Jika ada error di Serial Monitor yang tidak ada di tabel di atas, screenshot pesan error-nya dan kirim ke Software Engineer.

**Yang TIDAK perlu ditanya:** Kamu tidak perlu akses ke kode Web App, dashboard Firebase, atau file konfigurasi lainnya.

**Yang bisa kamu akses:** Dashboard Firebase Realtime Database untuk memverifikasi data masuk/keluar.
URL: `https://console.firebase.google.com/project/smartcanopy-57d8a/database`

---

*Dokumen ini dibuat oleh Software Engineer. Versi: 1.0*

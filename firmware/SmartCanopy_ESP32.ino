/**
 * ============================================================
 *  SMART CANOPY - ESP32 FIRMWARE
 *  Project: SmartCanopy - Vokasi Universitas Brawijaya
 * ============================================================
 *  Hardware yang digunakan:
 *  - ESP32 Dev Board
 *  - Sensor Hujan (Analog)
 *  - Sensor Cahaya LDR (Analog)
 *  - Motor DC Gearbox + Driver L298N
 *  - Micro Limit Switch x2 (OPEN & CLOSED posisi)
 *  - Relay (opsional, untuk power management)
 *
 *  Library yang dibutuhkan (Install via Arduino IDE Library Manager):
 *  1. Firebase ESP Client  -> by Mobizt (v4.x atau terbaru)
 *  2. DHT sensor library   -> by Adafruit (jika pakai DHT11/22)
 *  3. Adafruit Unified Sensor
 *
 *  Firebase RTDB Path Contract (Sync dengan Web App):
 *  ─── WRITE (ESP32 → Firebase → Web):
 *      /intensitas      : int (0-100)    -> % intensitas hujan
 *      /cahaya          : int (0-1000)   -> nilai lux sensor cahaya
 *      /Suhu            : float          -> suhu udara (°C)
 *      /status          : String         -> "OPEN" / "CLOSED" / "PARTIAL"
 *      /lastConnected   : long           -> timestamp epoch (ms) untuk heartbeat
 *      /Data_Historis   : push()         -> log history setiap ada perubahan
 *
 *  ─── READ (Firebase → ESP32) [Web menulis, ESP32 membaca]:
 *      /mode            : String         -> "AUTO" / "MANUAL"
 *      /threshold       : int (0-100)    -> batas hujan untuk auto-close
 *      /status          : String         -> perintah OPEN/CLOSED dari web (mode MANUAL)
 *      /position        : int (0-100)    -> % posisi motor dari slider web (mode MANUAL)
 * ============================================================
 */

// ============================================================
//  LIBRARY INCLUDES
// ============================================================
#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Tambahkan helper token & RTDB
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// Uncomment jika pakai sensor DHT untuk suhu
// #include <DHT.h>


// ============================================================
//  KONFIGURASI - WAJIB DIISI
// ============================================================

// --- WiFi ---
#define WIFI_SSID       "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD   "PASSWORD_WIFI_KAMU"

// --- Firebase (Ambil dari firebaseConfig.ts) ---
#define API_KEY         "AIzaSyChn7VdSPluklKEiNaHCY4chWSwjm4iNGw"
#define DATABASE_URL    "https://smartcanopy-57d8a-default-rtdb.firebaseio.com"

// Akun Firebase (buat user khusus ESP32 di Firebase Auth Console)
// Disarankan membuat user baru: esp32@smartcanopy.id / password123
#define USER_EMAIL      "rrezmaulana@gmail.com"
#define USER_PASSWORD   "123456"


// ============================================================
//  PIN MAPPING - SESUAIKAN DENGAN RAKITAN HARDWARE
// ============================================================

// --- Sensor ---
#define PIN_SENSOR_HUJAN    34   // Analog Input -> AO dari sensor hujan
#define PIN_SENSOR_CAHAYA   35   // Analog Input -> AO dari sensor LDR
// #define PIN_DHT             32   // Digital -> Data pin DHT11/22 (jika ada)
// #define DHT_TYPE         DHT11   // Tipe sensor DHT

// --- Driver Motor L298N ---
#define PIN_MOTOR_IN1       25   // L298N IN1 -> Arah putaran A
#define PIN_MOTOR_IN2       26   // L298N IN2 -> Arah putaran B
#define PIN_MOTOR_ENA       27   // L298N ENA -> PWM kecepatan (Enable)

// --- Limit Switch ---
// INPUT_PULLUP: Switch NO (Normally Open), connect ke GND saat tertekan
#define PIN_LIMIT_OPEN      18   // Limit switch posisi TERBUKA PENUH
#define PIN_LIMIT_CLOSED    19   // Limit switch posisi TERTUTUP PENUH

// --- Relay (Opsional) ---
// #define PIN_RELAY            23   // Relay untuk cut power motor

// --- PWM Setting ---
#define PWM_CHANNEL         0
#define PWM_FREQ            5000   // Hz
#define PWM_RESOLUTION      8      // 8-bit = nilai 0-255
#define MOTOR_SPEED         200    // Kecepatan motor (0-255). Turunkan jika terlalu kencang.


// ============================================================
//  TIMING INTERVAL
// ============================================================
#define INTERVAL_BACA_SENSOR   3000    // Baca sensor & kirim ke Firebase tiap 3 detik
#define INTERVAL_HEARTBEAT     10000   // Update lastConnected tiap 10 detik
#define INTERVAL_BACA_CMD      1000    // Cek perintah dari Firebase tiap 1 detik
#define INTERVAL_HISTORY       60000   // Simpan history tiap 1 menit (meski tidak ada perubahan)
#define TIMEOUT_MOTOR          8000    // Timeout motor jika limit switch tidak terpicu (ms)


// ============================================================
//  OBJEK FIREBASE
// ============================================================
FirebaseData fbdo_write;  // Stream untuk operasi write
FirebaseData fbdo_read;   // Stream untuk operasi read
FirebaseAuth auth;
FirebaseConfig config;

// Uncomment jika pakai DHT
// DHT dht(PIN_DHT, DHT_TYPE);


// ============================================================
//  VARIABEL GLOBAL
// ============================================================
String  currentMode      = "AUTO";
String  currentStatus    = "OPEN";
int     currentThreshold = 30;
int     currentPosition  = 100;
String  lastSentStatus   = "";

int     sensorHujan    = 0;    // % intensitas hujan (0-100)
int     sensorCahaya   = 0;    // nilai lux (0-1000)
float   sensorSuhu     = 0.0;  // suhu dalam °C

bool    motorBergerak  = false;
bool    isFirebaseReady = false;

unsigned long lastSensorTime  = 0;
unsigned long lastHeartbeat   = 0;
unsigned long lastCmdCheck    = 0;
unsigned long lastHistoryTime = 0;
unsigned long motorStartTime  = 0;


// ============================================================
//  FUNGSI KONTROL MOTOR L298N
// ============================================================

void motorBerhenti() {
  digitalWrite(PIN_MOTOR_IN1, LOW);
  digitalWrite(PIN_MOTOR_IN2, LOW);
  ledcWrite(PWM_CHANNEL, 0);
  motorBergerak = false;
  Serial.println("[MOTOR] Berhenti.");
}

void motorBuka() {
  // Cek limit switch posisi TERBUKA sebelum bergerak
  if (digitalRead(PIN_LIMIT_OPEN) == LOW) {
    Serial.println("[MOTOR] Sudah di posisi TERBUKA PENUH, skip.");
    motorBerhenti();
    return;
  }
  Serial.println("[MOTOR] Bergerak -> BUKA...");
  digitalWrite(PIN_MOTOR_IN1, HIGH);
  digitalWrite(PIN_MOTOR_IN2, LOW);
  ledcWrite(PWM_CHANNEL, MOTOR_SPEED);
  motorBergerak = true;
  motorStartTime = millis();
}

void motorTutup() {
  // Cek limit switch posisi TERTUTUP sebelum bergerak
  if (digitalRead(PIN_LIMIT_CLOSED) == LOW) {
    Serial.println("[MOTOR] Sudah di posisi TERTUTUP PENUH, skip.");
    motorBerhenti();
    return;
  }
  Serial.println("[MOTOR] Bergerak -> TUTUP...");
  digitalWrite(PIN_MOTOR_IN1, LOW);
  digitalWrite(PIN_MOTOR_IN2, HIGH);
  ledcWrite(PWM_CHANNEL, MOTOR_SPEED);
  motorBergerak = true;
  motorStartTime = millis();
}

/**
 * Kontrol motor berdasarkan persentase posisi (0-100%).
 * 0%   = CLOSED (tutup penuh)
 * 100% = OPEN   (buka penuh)
 * Untuk posisi parsial, motor bergerak lalu berhenti setelah durasi proporsional.
 */
void gerakkanMotorKeTarget(int targetPosition) {
  // Tentukan arah berdasarkan posisi saat ini vs target
  if (targetPosition <= 5) {
    // Tutup penuh
    motorTutup();
  } else if (targetPosition >= 95) {
    // Buka penuh
    motorBuka();
  } else {
    // Posisi parsial - gerakkan motor untuk durasi proporsional
    // Sesuaikan FULL_TRAVEL_MS dengan waktu motor dari tutup ke buka penuh
    const int FULL_TRAVEL_MS = 5000;
    int durasiGerak = (abs(targetPosition - currentPosition) * FULL_TRAVEL_MS) / 100;

    if (targetPosition > currentPosition) {
      motorBuka();
    } else {
      motorTutup();
    }
    // Motor akan berhenti otomatis setelah timeout (lihat loop())
    motorStartTime = millis() - (TIMEOUT_MOTOR - durasiGerak);
  }
}


// ============================================================
//  FUNGSI BACA SENSOR
// ============================================================

void bacaSemuaSensor() {
  // -- Baca Sensor Hujan --
  // Sensor hujan: nilai ADC tinggi = KERING, nilai rendah = BASAH
  // ESP32 ADC: 0-4095 (12-bit)
  int rawHujan = analogRead(PIN_SENSOR_HUJAN);
  // Map: ADC tinggi (4095=kering) -> 0%, ADC rendah (0=basah) -> 100%
  sensorHujan = map(rawHujan, 4095, 0, 0, 100);
  sensorHujan = constrain(sensorHujan, 0, 100);

  // -- Baca Sensor Cahaya LDR --
  // LDR: nilai ADC tinggi = GELAP, nilai rendah = TERANG
  int rawCahaya = analogRead(PIN_SENSOR_CAHAYA);
  // Map ke satuan Lux (0-1000). Sesuaikan range sesuai LDR yang dipakai.
  sensorCahaya = map(rawCahaya, 4095, 0, 0, 1000);
  sensorCahaya = constrain(sensorCahaya, 0, 1000);

  // -- Baca Suhu (DHT11/22) --
  // Uncomment jika pakai DHT sensor
  // sensorSuhu = dht.readTemperature();
  // if (isnan(sensorSuhu)) sensorSuhu = 0.0;

  // Simulasi suhu jika tidak ada sensor DHT
  sensorSuhu = 28.5; // Ganti dengan pembacaan DHT

  Serial.printf("[SENSOR] Hujan: %d%% | Cahaya: %d Lux | Suhu: %.1f°C\n",
                sensorHujan, sensorCahaya, sensorSuhu);
}


// ============================================================
//  FUNGSI FIREBASE - KIRIM DATA SENSOR
// ============================================================

void kirimDataSensor() {
  if (!isFirebaseReady || !Firebase.ready()) return;

  // Gunakan multi-path update (updateNode) - 1 HTTP request untuk semua field
  // Lebih efisien daripada setInt/setFloat terpisah
  FirebaseJson json;
  json.set("intensitas", sensorHujan);
  json.set("cahaya",     sensorCahaya);
  json.set("Suhu",       sensorSuhu);
  // lastConnected diupdate terpisah via setTimestamp() agar pakai server time yang akurat
  // Web mengecek: (Date.now() - lastConnected) < 60000 untuk deteksi online/offline

  if (Firebase.RTDB.updateNode(&fbdo_write, "/", &json)) {
    Serial.println("[FIREBASE] Data sensor terkirim.");
  } else {
    Serial.printf("[FIREBASE] GAGAL kirim sensor: %s\n", fbdo_write.errorReason().c_str());
  }
}

void kirimHeartbeat() {
  if (!isFirebaseReady || !Firebase.ready()) return;

  // Kirim timestamp epoch (millis sejak boot, bukan epoch sebenarnya)
  // Web app mengecek: (Date.now() - lastConnected) < 60000
  // Karena itu kita butuh timestamp UNIX sebenarnya.
  // Untuk ini, sinkronkan waktu dengan NTP atau gunakan millis + offset

  // Cara paling simpel: gunakan Firebase Server Timestamp
  if (Firebase.RTDB.setTimestamp(&fbdo_write, "/lastConnected")) {
    Serial.println("[FIREBASE] Heartbeat OK.");
  } else {
    Serial.printf("[FIREBASE] Heartbeat GAGAL: %s\n", fbdo_write.errorReason().c_str());
  }
}

void simpanHistory(String trigger) {
  if (!isFirebaseReady || !Firebase.ready()) return;

  FirebaseJson histJson;
  histJson.set("intensitas",    sensorHujan);
  histJson.set("cahaya",        sensorCahaya);
  histJson.set("status",        currentStatus);
  histJson.set("mode",          currentMode);
  histJson.set("position",      currentPosition);
  histJson.set("threshold",     currentThreshold);
  histJson.set("trigger",       trigger);
  histJson.set("timestamp/.sv", "timestamp"); // Firebase Server Timestamp

  String histPath = "/Data_Historis";
  if (Firebase.RTDB.pushJSON(&fbdo_write, histPath.c_str(), &histJson)) {
    Serial.printf("[FIREBASE] History disimpan: %s\n", trigger.c_str());
  } else {
    Serial.printf("[FIREBASE] GAGAL simpan history: %s\n", fbdo_write.errorReason().c_str());
  }
}


// ============================================================
//  FUNGSI FIREBASE - BACA PERINTAH DARI WEB
// ============================================================

void bacaPerintahDariWeb() {
  if (!isFirebaseReady || !Firebase.ready()) return;

  // Baca Mode (AUTO / MANUAL)
  if (Firebase.RTDB.getString(&fbdo_read, "/mode")) {
    String newMode = fbdo_read.stringData();
    if (newMode != currentMode) {
      currentMode = newMode;
      Serial.printf("[FIREBASE] Mode berubah -> %s\n", currentMode.c_str());
    }
  }

  // Baca Threshold (batas hujan untuk auto-close)
  if (Firebase.RTDB.getInt(&fbdo_read, "/threshold")) {
    currentThreshold = fbdo_read.intData();
  }

  // Jika Mode MANUAL: baca perintah status & position dari Web
  if (currentMode == "MANUAL") {
    // Baca Status Command
    if (Firebase.RTDB.getString(&fbdo_read, "/status")) {
      String cmdStatus = fbdo_read.stringData();

      // Eksekusi perintah hanya jika berubah dan motor tidak sedang bergerak
      if (cmdStatus != currentStatus && !motorBergerak) {
        Serial.printf("[MANUAL CMD] Status command: %s\n", cmdStatus.c_str());

        if (cmdStatus == "CLOSED") {
          motorTutup();
          currentStatus = "CLOSED";
          currentPosition = 0;
          simpanHistory("Manual Command: CLOSED");
        } else if (cmdStatus == "OPEN") {
          motorBuka();
          currentStatus = "OPEN";
          currentPosition = 100;
          simpanHistory("Manual Command: OPEN");
        }
      }
    }

    // Baca Position dari Slider Web
    if (Firebase.RTDB.getInt(&fbdo_read, "/position")) {
      int newPosition = fbdo_read.intData();
      if (abs(newPosition - currentPosition) > 5 && !motorBergerak) {
        Serial.printf("[MANUAL SLIDER] Target posisi: %d%%\n", newPosition);
        gerakkanMotorKeTarget(newPosition);
        currentPosition = newPosition;

        // Update status berdasarkan posisi
        if (newPosition <= 5)       currentStatus = "CLOSED";
        else if (newPosition >= 95) currentStatus = "OPEN";
        else                        currentStatus = "PARTIAL";

        simpanHistory("Manual Slider: " + String(newPosition) + "%");
      }
    }
  }
}


// ============================================================
//  LOGIKA OTOMATIS (MODE AUTO)
// ============================================================

void prosesAutoMode() {
  String statusBaru;

  // Logika: tutup jika hujan melebihi threshold
  if (sensorHujan > currentThreshold) {
    statusBaru = "CLOSED";
  } else {
    statusBaru = "OPEN";
  }

  // Hanya eksekusi jika status berubah
  if (statusBaru != lastSentStatus && !motorBergerak) {
    Serial.printf("[AUTO] Status berubah: %s -> %s (Hujan: %d%%, Threshold: %d%%)\n",
                  lastSentStatus.c_str(), statusBaru.c_str(),
                  sensorHujan, currentThreshold);

    if (statusBaru == "CLOSED") {
      motorTutup();
      currentPosition = 0;
      simpanHistory("Auto: Rain Detected -> CLOSED");
    } else {
      motorBuka();
      currentPosition = 100;
      simpanHistory("Auto: Clear -> OPEN");
    }

    currentStatus = statusBaru;
    lastSentStatus = statusBaru;

    // Update status ke Firebase
    if (Firebase.RTDB.setString(&fbdo_write, "/status", currentStatus)) {
      Serial.printf("[FIREBASE] Status diupdate -> %s\n", currentStatus.c_str());
    }
  }
}


// ============================================================
//  SETUP
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("  SMART CANOPY - ESP32 Booting...");
  Serial.println("========================================");

  // --- Inisialisasi PIN ---
  pinMode(PIN_MOTOR_IN1,    OUTPUT);
  pinMode(PIN_MOTOR_IN2,    OUTPUT);
  pinMode(PIN_LIMIT_OPEN,   INPUT_PULLUP);
  pinMode(PIN_LIMIT_CLOSED, INPUT_PULLUP);
  // pinMode(PIN_RELAY, OUTPUT);

  // Pastikan motor mati saat boot
  digitalWrite(PIN_MOTOR_IN1, LOW);
  digitalWrite(PIN_MOTOR_IN2, LOW);

  // Setup PWM untuk motor
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(PIN_MOTOR_ENA, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0);

  // Inisialisasi DHT jika dipakai
  // dht.begin();

  Serial.println("[INIT] Pin dan motor OK.");

  // --- Koneksi WiFi ---
  Serial.printf("[WIFI] Menghubungkan ke %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiRetry = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetry < 20) {
    delay(500);
    Serial.print(".");
    wifiRetry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Terhubung! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] GAGAL terhubung! Restart...");
    ESP.restart();
  }

  // --- Inisialisasi Firebase ---
  config.api_key      = API_KEY;
  config.database_url = DATABASE_URL;

  auth.user.email    = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  // Callback untuk token
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Tunggu Firebase siap (max 10 detik)
  Serial.print("[FIREBASE] Menunggu autentikasi");
  unsigned long fbTimeout = millis();
  while (!Firebase.ready() && (millis() - fbTimeout) < 10000) {
    delay(300);
    Serial.print(".");
  }

  if (Firebase.ready()) {
    isFirebaseReady = true;
    Serial.println("\n[FIREBASE] Siap!");

    // Kirim heartbeat pertama
    kirimHeartbeat();

    // Baca konfigurasi awal dari Firebase
    if (Firebase.RTDB.getString(&fbdo_read, "/mode")) {
      currentMode = fbdo_read.stringData();
    }
    if (Firebase.RTDB.getInt(&fbdo_read, "/threshold")) {
      currentThreshold = fbdo_read.intData();
    }
    if (Firebase.RTDB.getString(&fbdo_read, "/status")) {
      currentStatus = fbdo_read.stringData();
      lastSentStatus = currentStatus;
    }

    Serial.printf("[INIT] Mode: %s | Threshold: %d%% | Status: %s\n",
                  currentMode.c_str(), currentThreshold, currentStatus.c_str());
  } else {
    Serial.println("\n[FIREBASE] GAGAL! Lanjut tanpa Firebase...");
  }

  Serial.println("[BOOT] Selesai. Memulai loop utama...\n");
}


// ============================================================
//  LOOP UTAMA
// ============================================================

void loop() {
  unsigned long now = millis();

  // ─── 1. CEK LIMIT SWITCH (Prioritas Tertinggi) ───────────
  // Jika motor bergerak dan limit switch terpicu, hentikan motor
  if (motorBergerak) {
    bool limitOpen   = (digitalRead(PIN_LIMIT_OPEN)   == LOW);
    bool limitClosed = (digitalRead(PIN_LIMIT_CLOSED) == LOW);
    bool timeout     = (now - motorStartTime) > TIMEOUT_MOTOR;

    if (limitOpen) {
      motorBerhenti();
      currentStatus   = "OPEN";
      currentPosition = 100;
      Serial.println("[LIMIT] Posisi TERBUKA tercapai.");
      // Update status ke Firebase
      Firebase.RTDB.setString(&fbdo_write, "/status", "OPEN");
      Firebase.RTDB.setInt(&fbdo_write, "/position", 100);
    }
    else if (limitClosed) {
      motorBerhenti();
      currentStatus   = "CLOSED";
      currentPosition = 0;
      Serial.println("[LIMIT] Posisi TERTUTUP tercapai.");
      Firebase.RTDB.setString(&fbdo_write, "/status", "CLOSED");
      Firebase.RTDB.setInt(&fbdo_write, "/position", 0);
    }
    else if (timeout) {
      motorBerhenti();
      Serial.println("[MOTOR] TIMEOUT! Motor dihentikan paksa.");
      // Update status sesuai kondisi terakhir
      Firebase.RTDB.setString(&fbdo_write, "/status", currentStatus);
    }
  }

  // ─── 2. BACA PERINTAH DARI WEB (tiap 1 detik) ──────────
  if (now - lastCmdCheck >= INTERVAL_BACA_CMD) {
    lastCmdCheck = now;
    bacaPerintahDariWeb();
  }

  // ─── 3. BACA SENSOR & KIRIM DATA (tiap 3 detik) ────────
  if (now - lastSensorTime >= INTERVAL_BACA_SENSOR) {
    lastSensorTime = now;

    bacaSemuaSensor();
    kirimDataSensor();

    // Proses logika AUTO jika dalam mode AUTO dan motor tidak bergerak
    if (currentMode == "AUTO" && !motorBergerak) {
      prosesAutoMode();
    }
  }

  // ─── 4. HEARTBEAT (tiap 10 detik) ──────────────────────
  if (now - lastHeartbeat >= INTERVAL_HEARTBEAT) {
    lastHeartbeat = now;
    kirimHeartbeat();
  }

  // ─── 5. HISTORY BERKALA (tiap 1 menit) ─────────────────
  if (now - lastHistoryTime >= INTERVAL_HISTORY) {
    lastHistoryTime = now;
    simpanHistory("Periodic Log");
  }

  // ─── 6. WIFI RECONNECT ──────────────────────────────────
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Koneksi terputus! Menghubungkan ulang...");
    WiFi.reconnect();
    delay(3000);
  }

  delay(50); // Kecil delay untuk stabilitas
}

/**
 * ============================================================
 *  SMART CANOPY - FIRMWARE FINAL (Bug Fixed)
 *  Fix: Firebase auth timing + Non-blocking motor control
 *  Tutup -> Limit Luar (32) | Buka -> Limit Dalam (25)
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ================== KONFIGURASI FIREBASE ==================
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"
#define API_KEY         "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL    "YOUR_FIREBASE_DATABASE_URL"
#define USER_EMAIL      "YOUR_FIREBASE_EMAIL"
#define USER_PASSWORD   "YOUR_FIREBASE_PASSWORD"

// ================== PIN DEFINISI ==================
#define IN1          27
#define IN2          33
#define ENA          14

#define LIMIT_DALAM  25   // Stop saat MEMBUKA (Posisi Terbuka)
#define LIMIT_LUAR   32   // Stop saat MENUTUP (Posisi Tertutup)
#define PIN_RAIN     26
#define LDR_PIN      34

// ================== VARIABEL GLOBAL ==================
int motorSpeed = 180;

unsigned long lastSensorCheck = 0;
unsigned long lastHeartbeat   = 0;
unsigned long motorStartTime  = 0;

FirebaseData fbdo;
FirebaseData streamMode, streamStatus;
FirebaseAuth auth;
FirebaseConfig config;

String currentStatus    = "OPEN";
String currentMode      = "AUTO";
String pendingCommand   = ""; // ✅ Fix: simpan perintah web agar tidak hilang
bool   motorRunning     = false;
bool   isFirebaseReady  = false;

// ─── MOTOR CONTROL (NON-BLOCKING) ────────────────────────────
void motorForward() {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  analogWrite(ENA, motorSpeed);
  motorRunning  = true;
  motorStartTime = millis();
}

void motorBackward() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
  analogWrite(ENA, motorSpeed);
  motorRunning  = true;
  motorStartTime = millis();
}

void motorStop() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
  motorRunning = false;
}

// ─── FUNGSI MULAI GERAK (Non-Blocking, berhenti di loop) ─────
void mulaiTutup() {
  if (digitalRead(LIMIT_LUAR) == LOW) {
    Serial.println("■ Sudah TERTUTUP, skip.");
    return;
  }
  motorForward();
  currentStatus = "CLOSED";
  Serial.println("→ Menutup Canopy...");
}

void mulaiTutupBuka() {
  if (digitalRead(LIMIT_DALAM) == LOW) {
    Serial.println("■ Sudah TERBUKA, skip.");
    return;
  }
  motorBackward();
  currentStatus = "OPEN";
  Serial.println("→ Membuka Canopy...");
}

// ─── LOG RIWAYAT ─────────────────────────────────────────────
void kirimHistory(String trigger) {
  if (!isFirebaseReady) return;
  FirebaseJson json;
  json.set("trigger",       trigger);
  json.set("canopy/status", currentStatus);
  json.set("settings/mode", currentMode);
  json.set("timestamp/.sv", "timestamp");
  Firebase.RTDB.pushJSON(&fbdo, "/Data_Historis", &json);
}

// ================== SETUP ==================
void setup() {
  pinMode(IN1,         OUTPUT);
  pinMode(IN2,         OUTPUT);
  pinMode(ENA,         OUTPUT);
  pinMode(LIMIT_DALAM, INPUT_PULLUP);
  pinMode(LIMIT_LUAR,  INPUT_PULLUP);
  pinMode(PIN_RAIN,    INPUT_PULLUP);
  analogReadResolution(12);
  Serial.begin(115200);
  motorStop();

  // Koneksi WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());

  // Konfigurasi Firebase
  config.api_key              = API_KEY;
  config.database_url         = DATABASE_URL;
  auth.user.email             = USER_EMAIL;
  auth.user.password          = USER_PASSWORD;
  config.token_status_callback = tokenStatusCallback; // ✅ Penting!

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // ✅ FIX: Tunggu sampai Firebase benar-benar siap (max 10 detik)
  Serial.print("Menunggu Firebase");
  unsigned long fbWait = millis();
  while (!Firebase.ready() && millis() - fbWait < 10000) {
    delay(300); Serial.print(".");
  }

  if (Firebase.ready()) {
    isFirebaseReady = true;
    Firebase.RTDB.beginStream(&streamMode,   "/settings/mode");
    Firebase.RTDB.beginStream(&streamStatus, "/canopy/status");
    Serial.println("\nFirebase Siap!");
  } else {
    Serial.println("\nFirebase GAGAL! Cek API key/email/password.");
  }

  Serial.println("=== Smart Canopy System Siap ===");
  Serial.println("Hujan Basah → Tutup | Kering → Buka");
  Serial.println("=====================================");
  delay(500);
}

// ================== LOOP ==================
void loop() {

  // ─── 1. CEK LIMIT SWITCH & STOP MOTOR (Non-Blocking Safety) ─
  if (motorRunning) {
    if (currentStatus == "CLOSED" && digitalRead(LIMIT_LUAR) == LOW) {
      motorStop();
      Serial.println("■ Canopy TERTUTUP (Limit Luar)");
      if (isFirebaseReady) Firebase.RTDB.setString(&fbdo, "/canopy/status", "CLOSED");
      kirimHistory("Limit: Tertutup");
    }
    if (currentStatus == "OPEN" && digitalRead(LIMIT_DALAM) == LOW) {
      motorStop();
      Serial.println("■ Canopy TERBUKA (Limit Dalam)");
      if (isFirebaseReady) Firebase.RTDB.setString(&fbdo, "/canopy/status", "OPEN");
      kirimHistory("Limit: Terbuka");
    }
    // Safety Timeout: Motor berhenti otomatis setelah 10 detik
    if (millis() - motorStartTime > 10000) {
      motorStop();
      Serial.println("■ Motor TIMEOUT - Dihentikan paksa!");
    }
  }

  // ─── 2. CEK SENSOR tiap 800ms ────────────────────────────────
  if (millis() - lastSensorCheck >= 800) {
    lastSensorCheck = millis();

    bool hujan     = digitalRead(PIN_RAIN) == LOW;
    bool lsDalam   = digitalRead(LIMIT_DALAM) == LOW;
    bool lsLuar    = digitalRead(LIMIT_LUAR)  == LOW;
    int  ldrValue  = analogRead(LDR_PIN);
    int  intensitas = map(ldrValue, 0, 4095, 100, 0);

    // ─── Tampilkan Status di Serial Monitor ───────────────────
    Serial.println("────────────────────────────────────");
    Serial.print("Mode      : "); Serial.println(currentMode);
    Serial.print("Hujan     : ");
    Serial.println(hujan ? "BASAH (Tutup Canopy)" : "Kering (Buka Canopy)");
    Serial.print("Cahaya    : ");
    Serial.print(intensitas >= 80 ? "CERAH" : (intensitas >= 40 ? "MENDUNG" : "GELAP"));
    Serial.print(" ("); Serial.print(intensitas); Serial.print("%) | ADC: ");
    Serial.println(ldrValue);
    Serial.print("Limit Dalam(25): "); Serial.print(lsDalam ? "AKTIF" : "OFF");
    Serial.print(" | Limit Luar(32): "); Serial.println(lsLuar ? "AKTIF" : "OFF");

    // ─── Kirim Data Live ke Firebase ─────────────────────────
    if (isFirebaseReady && !motorRunning) {
      Firebase.RTDB.setBool(&fbdo, "/sensors/hujan/isRaining",  hujan);
      Firebase.RTDB.setInt(&fbdo,  "/sensors/hujan/intensitas", hujan ? 100 : 0);
      Firebase.RTDB.setInt(&fbdo,  "/sensors/cahaya/lux",        intensitas);
      Firebase.RTDB.setInt(&fbdo,  "/canopy/position",           lsLuar ? 0 : (lsDalam ? 100 : 50));
      // ✅ Fix: Jangan timpa /canopy/status saat MANUAL (web yang pegang)
      if (currentMode == "AUTO") {
        Firebase.RTDB.setString(&fbdo, "/canopy/status", currentStatus);
      }
    }

    // ─── Logika AUTO ─────────────────────────────────────────
    if (currentMode == "AUTO" && !motorRunning) {
      if (hujan && !lsLuar) {
        Serial.println("→ Hujan terdeteksi! Menutup Canopy...");
        mulaiTutup();
      } else if (!hujan && !lsDalam) {
        Serial.println("→ Cuaca cerah! Membuka Canopy...");
        mulaiTutupBuka();
      } else {
        Serial.println("→ Canopy sudah di posisi yang sesuai");
      }
    } else if (currentMode == "MANUAL") {
      Serial.println("→ Mode MANUAL - Menunggu perintah Web/Serial");
      // ✅ Fix: Eksekusi perintah yang sudah tersimpan
      if (pendingCommand != "" && !motorRunning) {
        if (pendingCommand == "OPEN"   && currentStatus != "OPEN")   { mulaiTutupBuka(); kirimHistory("Web Manual: OPEN"); }
        if (pendingCommand == "CLOSED" && currentStatus != "CLOSED") { mulaiTutup();     kirimHistory("Web Manual: CLOSED"); }
        pendingCommand = ""; // Reset setelah dieksekusi
      }
    }
  }

  // ─── 3. BACA STREAM DARI WEB ─────────────────────────────────
  if (isFirebaseReady) {
    // Cek perubahan Mode
    if (Firebase.RTDB.readStream(&streamMode) && streamMode.streamAvailable()) {
      String newMode = streamMode.stringData();
      if (newMode != currentMode) {
        currentMode = newMode;
        Serial.println("[WEB] Mode → " + currentMode);
        // ✅ Saat pindah ke MANUAL: hentikan motor & batalkan perintah AUTO
        if (currentMode == "MANUAL") {
          motorStop();
          pendingCommand = "";
          Serial.println("[MANUAL] Motor dihentikan. AUTO dinonaktifkan.");
        }
      }
    }
    // ✅ Fix: SELALU baca stream status, simpan ke pendingCommand
    // Tidak lagi di-gate oleh currentMode agar tidak hilang saat race condition
    if (Firebase.RTDB.readStream(&streamStatus) && streamStatus.streamAvailable()) {
      String webCmd = streamStatus.stringData();
      if (webCmd == "OPEN" || webCmd == "CLOSED") {
        pendingCommand = webCmd; // Simpan dulu, eksekusi di sensor loop
        Serial.println("[WEB] Perintah diterima: " + webCmd);
      }
    }
  }

  // ─── 4. HEARTBEAT ────────────────────────────────────────────
  if (isFirebaseReady && millis() - lastHeartbeat >= 10000) {
    lastHeartbeat = millis();
    Firebase.RTDB.setTimestamp(&fbdo, "/system/lastConnected");
  }

  // ─── 5. PERINTAH SERIAL MANUAL ───────────────────────────────
  if (Serial.available()) {
    char cmd = Serial.read();
    if      (cmd == 'M' || cmd == 'm') { mulaiTutupBuka(); kirimHistory("Serial: OPEN"); }
    else if (cmd == 'B' || cmd == 'b') { mulaiTutup();     kirimHistory("Serial: CLOSED"); }
    else if (cmd == 'S' || cmd == 's') { motorStop(); Serial.println("■ Motor STOP"); }
    else if (cmd >= '0' && cmd <= '9') {
      motorSpeed = (cmd - '0') * 25 + 55;
      if (motorSpeed > 255) motorSpeed = 255;
      Serial.print("Kecepatan diubah: "); Serial.println(motorSpeed);
    }
  }
}

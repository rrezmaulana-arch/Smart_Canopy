/**
 * ============================================================
 *  SMART CANOPY - ESP32 FIRMWARE v2.1 (Final Pin Adjustment)
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ================== KONFIGURASI AKUN ==================
#define WIFI_SSID     "Cikoppp"
#define WIFI_PASSWORD "sembarang"
#define API_KEY       "AIzaSyChn7VdSPluklKEiNaHCY4chWSwjm4iNGw"
#define DATABASE_URL  "https://smartcanopy-57d8a-default-rtdb.firebaseio.com"
#define USER_EMAIL    "moetiasafitri@gmail.com"
#define USER_PASSWORD "123456"

// ================== PIN DEFINISI (SESUAI REQUEST) ==================
#define IN1          27
#define IN2          33
#define ENA          14
#define LIMIT_DALAM  25     // Limit Switch TERTUTUP (Closed)
#define LIMIT_LUAR   32     // Limit Switch TERBUKA (Open)
#define PIN_RAIN     26     // Sensor Hujan
#define LDR_PIN      34     // Sensor Cahaya LDR

// ================== VARIABEL GLOBAL ==================
FirebaseData fbdo;
FirebaseData streamMode, streamStatus, streamPosition, streamThreshold;
FirebaseAuth auth;
FirebaseConfig config;

String currentStatus    = "CLOSED";
String currentMode      = "AUTO";
int    currentThreshold = 65;
int    currentPosition  = 0;
int    motorSpeed       = 180;
bool   motorRunning     = false;
bool   isFirebaseReady  = false;

unsigned long lastSensorMillis    = 0;
unsigned long lastHeartbeatMillis = 0;
unsigned long motorStartTime      = 0;
String lastLoggedStatus           = ""; // Untuk mencegah duplikasi log

// ─── FUNGSI HISTORY ────────────────────────────────────────

void kirimHistory(String trigger) {
  if (!isFirebaseReady || !Firebase.ready()) return;

  bool hujan  = (digitalRead(PIN_RAIN) == LOW);
  int  ldrRaw = analogRead(LDR_PIN);
  int  cahaya = map(ldrRaw, 0, 4095, 100, 0);

  FirebaseJson json;
  // Struktur baru (nested) agar sinkron dengan web
  json.set("sensors/hujan/isRaining",  hujan);
  json.set("sensors/hujan/intensitas", hujan ? 100 : 0);
  json.set("sensors/cahaya/lux",       cahaya);
  json.set("canopy/status",            currentStatus);
  json.set("canopy/position",          currentPosition);
  json.set("settings/mode",            currentMode);
  json.set("trigger",                  trigger);
  json.set("timestamp/.sv",            "timestamp"); // Server timestamp

  if (Firebase.RTDB.pushJSON(&fbdo, "/Data_Historis", &json)) {
    Serial.printf("[HISTORY] Tersimpan: %s\n", trigger.c_str());
  } else {
    Serial.printf("[HISTORY] GAGAL: %s\n", fbdo.errorReason().c_str());
  }
}

// ─── FUNGSI MOTOR ──────────────────────────────────────────

void motorStop() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
  motorRunning = false;
  Serial.println("[MOTOR] Stop.");
}

void motorTutup() { // Forward (Tutup)
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  analogWrite(ENA, motorSpeed);
  motorRunning  = true;
  motorStartTime = millis();
  Serial.println("[MOTOR] Menutup...");
}

void motorBuka() { // Backward (Buka)
  digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
  analogWrite(ENA, motorSpeed);
  motorRunning  = true;
  motorStartTime = millis();
  Serial.println("[MOTOR] Membuka...");
}

void tutupCanopy() {
  if (digitalRead(LIMIT_DALAM) == LOW) {
    Serial.println("[KANOPI] Sudah TERTUTUP, skip motor.");
    currentStatus = "CLOSED";
    currentPosition = 0;
    return;
  }
  motorTutup();
  currentStatus   = "CLOSED";
  currentPosition = 0;
  kirimHistory("Canopy Closing");
}

void bukaCanopy() {
  if (digitalRead(LIMIT_LUAR) == LOW) {
    Serial.println("[KANOPI] Sudah TERBUKA, skip motor.");
    currentStatus = "OPEN";
    currentPosition = 100;
    return;
  }
  motorBuka();
  currentStatus   = "OPEN";
  currentPosition = 100;
  kirimHistory("Canopy Opening");
}

// ─── FIREBASE HANDLER ──────────────────────────────────────

void handleFirebaseStreams() {
  if (!isFirebaseReady) return;

  // 1. Baca Mode (AUTO/MANUAL)
  if (Firebase.RTDB.readStream(&streamMode) && streamMode.streamAvailable()) {
    currentMode = streamMode.stringData();
    Serial.printf("[WEB] Mode diubah ke: %s\n", currentMode.c_str());
  }

  // 2. Baca Threshold
  if (Firebase.RTDB.readStream(&streamThreshold) && streamThreshold.streamAvailable()) {
    currentThreshold = streamThreshold.intData();
    Serial.printf("[WEB] Threshold diubah ke: %d\n", currentThreshold);
  }

  // 3. Baca Status (UNTUK TUTUP/BUKA MANUAL DARI WEB)
  if (Firebase.RTDB.readStream(&streamStatus) && streamStatus.streamAvailable()) {
    if (currentMode == "MANUAL") {
      String cmd = streamStatus.stringData();
      Serial.printf("[WEB] Perintah Manual: %s\n", cmd.c_str());
      if (cmd == "OPEN"   && currentStatus != "OPEN")   bukaCanopy();
      if (cmd == "CLOSED" && currentStatus != "CLOSED") tutupCanopy();
    }
  }

  // 4. Baca Position (Slider Web)
  if (Firebase.RTDB.readStream(&streamPosition) && streamPosition.streamAvailable()) {
    if (currentMode == "MANUAL") {
      int pos = streamPosition.intData();
      if (pos >= 80 && currentStatus != "OPEN")   bukaCanopy();
      if (pos <= 20 && currentStatus != "CLOSED") tutupCanopy();
    }
  }
}

void bacaSensorDanKirim() {
  bool hujan   = (digitalRead(PIN_RAIN) == LOW);
  int  ldrRaw  = analogRead(LDR_PIN);
  int  cahaya  = map(ldrRaw, 0, 4095, 100, 0); 

  // Logika AUTO
  if (currentMode == "AUTO" && !motorRunning) {
    if (hujan && currentStatus != "CLOSED") {
      tutupCanopy();
      kirimHistory("Auto: Hujan Terdeteksi");
    } else if (!hujan && currentStatus != "OPEN") {
      bukaCanopy();
      kirimHistory("Auto: Cuaca Cerah");
    }
  }

  // Kirim ke Firebase (Path Baru)
  Firebase.RTDB.setBool(&fbdo,      "/sensors/hujan/isRaining",  hujan);
  Firebase.RTDB.setInt(&fbdo,       "/sensors/hujan/intensitas", hujan ? 100 : 0);
  Firebase.RTDB.setInt(&fbdo,       "/sensors/cahaya/lux",        cahaya);
  Firebase.RTDB.setString(&fbdo,    "/canopy/status",            currentStatus);
  Firebase.RTDB.setInt(&fbdo,       "/canopy/position",           currentPosition);
  Firebase.RTDB.setTimestamp(&fbdo, "/sensors/hujan/lastUpdated");
}

void cekMotorSafety() {
  if (!motorRunning) return;

  // Jika sedang menutup, stop jika LIMIT_DALAM (Tertutup) aktif
  if (digitalRead(LIMIT_DALAM) == LOW) {
    motorStop();
    currentStatus = "CLOSED";
    currentPosition = 0;
    Firebase.RTDB.setString(&fbdo, "/canopy/status", "CLOSED");
    Firebase.RTDB.setInt(&fbdo, "/canopy/position", 0);
    Serial.println("[LIMIT] TERTUTUP PENUH.");
  }

  // Jika sedang membuka, stop jika LIMIT_LUAR (Terbuka) aktif
  if (digitalRead(LIMIT_LUAR) == LOW) {
    motorStop();
    currentStatus = "OPEN";
    currentPosition = 100;
    Firebase.RTDB.setString(&fbdo, "/canopy/status", "OPEN");
    Firebase.RTDB.setInt(&fbdo, "/canopy/position", 100);
    Serial.println("[LIMIT] TERBUKA PENUH.");
  }

  // Safety Timeout
  if (millis() - motorStartTime > 10000) {
    motorStop();
    Serial.println("[MOTOR] Timeout Safety!");
  }
}

// ─── SETUP & LOOP ──────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  pinMode(IN1,         OUTPUT);
  pinMode(IN2,         OUTPUT);
  pinMode(ENA,         OUTPUT);
  pinMode(LIMIT_DALAM, INPUT_PULLUP);
  pinMode(LIMIT_LUAR,  INPUT_PULLUP);
  pinMode(PIN_RAIN,    INPUT_PULLUP);
  analogReadResolution(12);

  motorStop();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected.");

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.ready()) {
    isFirebaseReady = true;
    Firebase.RTDB.beginStream(&streamMode,      "/settings/mode");
    Firebase.RTDB.beginStream(&streamThreshold, "/settings/threshold");
    Firebase.RTDB.beginStream(&streamStatus,    "/canopy/status");
    Firebase.RTDB.beginStream(&streamPosition,  "/canopy/position");
    Serial.println("Firebase Stream Ready.");
  }
}

void loop() {
  if (millis() - lastSensorMillis >= 1500) {
    lastSensorMillis = millis();
    bacaSensorDanKirim();
  }

  if (millis() - lastHeartbeatMillis >= 10000) {
    lastHeartbeatMillis = millis();
    Firebase.RTDB.setTimestamp(&fbdo, "/system/lastConnected");
  }

  handleFirebaseStreams();
  cekMotorSafety();
}

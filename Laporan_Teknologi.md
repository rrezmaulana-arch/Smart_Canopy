# Laporan Arsitektur dan Landasan Teknologi Smart Canopy 

Dokumen ini membedah alasan pemilihan struktur teknologi, bahasa pemrograman, hingga topologi kode yang diterapkan pada platform *Smart Canopy Dashboard* guna menunjang pelaporan teknis atau penelitian Anda.

---

## BAB 1: Landasan Bahasa dan Ekosistem

### 1. Kenapa Menggunakan TypeScript?
Kode program ini menggunakan standar ekstensi web **TypeScript (`.tsx` / `.ts`)** alih-alih JavaScript lawas.
*   **Alasan Utama (Keselamatan Data):** Di aplikasi IoT (Cerdas), aliran data berbentuk angka (Suhu, Kecepatan, Persentase Terbuka) bergerak masif setiap detik. TypeScript memberikan *Strict Type Checking* (Sistem Pertahanan Tipe Kuat). Jika di tengah perjalanan ada kekeliruan dimana data Suhu ingin dijumlahkan dengan kata teks biasa, TypeScript akan **menggagalkan proses "Build"**. Hal ini mustahil di JavaScript biasa, sehingga mencegah website layar putih (*Blank Screen*) ketika dipakai di lapangan oleh *End-User*.

### 2. Kenapa Memilih Framework React JS (dengan Vite)?
Aplikasi ini dikembangkan memakai pustaka **React.js**.
*   **Alasan Cepat & Tanpa Refresh:** Website berbasis PHP murni atau HTML statis akan memaksa pengguna untuk me-Refresh (`F5`) halaman berkali-kali untuk melihat update curah hujan terbaru. React memiliki *Virtual DOM*. Ketika rintik hujan naik dari 10% ke 12%, angka tersebut akan *diganti di udara* (langsung di kanvas UI) dalam ukuran hitungan milidetik tanpa memuat ulang seluruh layar web atau gambar di latar belakang.
*   **Vite sebagai Mesin Server:** Vite menjamin beban memilah kode (`Compile`) super kilat, menjadikan *build pipeline* sekecil mungkin agar ruang penyimpanan website terdistribusi secara efisien.

### 3. Kenapa Tailwind CSS (Antarmuka Modern)?
Untuk tata rias antarmuka (*Styling*), digunakan metode *Tailwind CSS Utility-First*.
*   **Alasan Estetika IoT:** Desain dasbor kontrol industri atau IoT menuntut presisi warna, gradien halus, efek *Glassmorphism* (kaca transparan), dan desain yang bisa menyesuaikan layar (*Responsive Mobile*). Ekosistem Tailwind menggantikan ribuan baris CSS manual yang berisiko kusut (berantakan/tumpang tindih antar halaman) menjadi perakitan komponen taktis, menekan resiko eror grafis saat diluncurkan.

---

## BAB 2: Landasan Database

### Kenapa Memakai Google Firebase Realtime Database?
Anda *tidak menggunakan* database relasional warisan seperti **MySQL/SQL**, namun menggunakan Database bertipe **NoSQL (Firebase)**. Mengapa?
*   **Arsitektur Jantung Sinkronisasi (*Socket Push*):** Database MySQL mengharuskan web secara agresif bertanya ke server setiap 1 detik (*"Apakah ada data hujan baru?"* / Polling). Hal ini sangat membebani server fisik jika ditonton puluhan orang. Firebase menganut paradigma kebalikannya, yaitu koneksi selang air *WebSocket*. Jika tidak ada perubahan, tidak ada kuota/energi komputer yang terbuang. Namun disaat rintik air menimpa sensor alat di garasi, sensor menembakkannya ke Firebase, dan Firebase secara otomatis *"Mendorong"* paksa angka itu masuk ke browser pengguna di layar.
*   **Serverless:** Anda tidak perlu menyewa server fisik VPS dan menulis ribuan kode API PHP (Backend) secara manual. Database beroperasi langsung menyambung dari chip *NodeMCU/ESP* dengan sangat independen.

---

## BAB 3: Dekonstruksi Fungsi Kode Utama

Berikut adalah ringkasan anatomi skrip penting dan fungsi kritikalnya:

### 1. `src/contexts/FirebaseContext.tsx`
Ini adalah **"Jantung Utama"** dari seluruh aplikasi. 
*   **Fungsi:** Menggantikan arsitektur pemanggilan terpecah (dimana setiap halaman memanggil data sendiri-sendiri). Di sini berlaku teori "Sedot Sekali, Bagikan Semua". Komponen ini menyedot data dari Firebase *Realtime*, lalu menciptakan status pemantau memori lokal dan *Hardware Heartbeat* (logika alat mati atau menyala). Halaman Dashboard dan Riwayat cukup tinggal menadah dari saluran ini, menjamin web bebas hambatan (Zero-Lag).

### 2. `src/types/index.ts`
Ini adalah **"Cetak Biru Tata Bahasa"**.
*   **Fungsi:** Menyimpan kontrak bentuk data yang dianut oleh aplikasi. Misalnya disepakati bahwa status pemicu *HistoryLog* hanya memiliki tipe: `'critical' | 'warning' | 'success' | 'info'`. Jika sistem luar memasukannya berbeda, web bisa mempertahankan model logisnya agar grafik tidak patah tiba-tiba.

### 3. `src/pages/DataHistoris.tsx`
Halaman analitik yang menaruh tabel panjang atas sejarah kanopi.
*   **Fungsi Unik:** File ini dilengkapi fitur perlindungan memori browser. Ini tidak mengunduh semua ribuan isi data seumur hidup dari Firebase saat halaman terbuka (yang dapat mematikan komputer spesifikasi rendah/HP). Kode disematkan kueri `limitToLast(100)` dengan penarik manual (`fetch/load more`) lewat perintah rekursif Firebase `endBefore()`. 

### 4. `src/pages/Dashboard.tsx` & `Control.tsx`
Halaman interaksi antara mesin dan manusia (Man-Machine Interface).
*   **Fungsi:** Mencerna nilai kering dari API Firebase (`threshold`, `intensitas`, `mode`) menjadi grafis *Gauge* berputar, atau kartu *Glass* yang berdenyut cantik di malam hari. Di `Control.tsx` juga terdapat perintah *Write Limit*, di mana pengguna yang mengklik tombol atau menggeser (*drag*) posisi Slider Limit perlahan tidak akan membombardir Cloud melainkan dikunci sampai klik geserannya dilepas menggunakan `useRef`.

### 5. `database.rules.json`
*   **Fungsi:** Layaknya gembok di gedung brankas uang. Digunakan sebagai perlindungan hukum bagi mesin IoT agar orang iseng tanpa otorisasi token (`auth != null`) tidak bisa menembakkan kode HTTP liar di Command Prompt dan bermain-main me-reset mesin kanopi secara remote. Aturan ini sangat berstandar kelas produksi.

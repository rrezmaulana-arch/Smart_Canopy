// 📁 src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; // ✨ Tambahkan ini untuk keamanan

const firebaseConfig = {
  apiKey: "AIzaSyChn7VdSPluklKEiNaHCY4chWSwjm4iNGw",
  authDomain: "smartcanopy-57d8a.firebaseapp.com",
  projectId: "smartcanopy-57d8a",
  storageBucket: "smartcanopy-57d8a.firebasestorage.app",
  messagingSenderId: "1004945227100",
  appId: "1:1004945227100:web:7b1ca799e42b023d9dd599",
  measurementId: "G-QMGNTDBYQJ",
  databaseURL: "https://smartcanopy-57d8a-default-rtdb.firebaseio.com" 
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Services
export const database = getDatabase(app);
export const auth = getAuth(app); // ✨ Export auth supaya bisa dipakai buat login/cek status user

export default app;
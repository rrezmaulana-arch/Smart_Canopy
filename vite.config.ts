import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Tambahkan ini untuk mengelola path folder

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Menghubungkan simbol "@" ke folder "src"
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
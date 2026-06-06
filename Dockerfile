# Stage 1: Build the Vite + React application
FROM node:22-alpine AS build

WORKDIR /app

# Salin file dependencies terlebih dahulu untuk caching yang lebih baik
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin seluruh kode aplikasi
COPY . .

# Build aplikasi (menghasilkan folder /dist)
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:alpine

# Salin hasil build dari Stage 1 ke folder default Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Karena kita menggunakan React Router (SPA), kita perlu menambahkan konfigurasi custom Nginx
# agar halaman tidak error 404 ketika di-refresh.
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Ekspos port 80
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]

# Gunakan Node versi yang dibutuhkan
FROM node:18

# Atur direktori kerja
WORKDIR /app

# # Buat direktori untuk credentials
# RUN mkdir -p /app/config

# Salin file yang dibutuhkan
COPY package*.json ./
COPY . .

# Instal dependencies
RUN npm install

# Ekspos port yang akan digunakan
EXPOSE 8080

# Jalankan aplikasi
CMD ["npm", "start"]
# 🚀 MarketAI — Penyaring MarketAI Pasar Real-Time

AI Chatbot untuk analisis MarketAI pasar keuangan Indonesia menggunakan Google Gemini API.

---

## 📁 Struktur Proyek

```
market-MarketAI-chatbot/
├── backend/
│   ├── index.js          # Express server + Gemini API
│   ├── package.json
│   └── .env.example      → salin ke .env dan isi API key
│
└── frontend/
    ├── src/
    │   ├── App.jsx               # Komponen utama
    │   ├── components/
    │   │   ├── MarketTicker.jsx  # Bar harga live (simulasi)
    │   │   ├── Watchlist.jsx     # Sidebar aset pantauan
    │   │   ├── ChatMessage.jsx   # Gelembung chat
    │   │   └── NewsAnalyzer.jsx  # Analisis berita cepat
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🛠️ Setup & Menjalankan

### 1. Siapkan Backend

```bash
cd backend
cp .env.example .env
# Edit .env → isi GEMINI_API_KEY dengan API key kamu
# Dapatkan di: https://aistudio.google.com/app/apikey

npm install
npm run dev
# Server berjalan di http://localhost:3000
```

### 2. Jalankan Frontend (terminal baru)

```bash
cd frontend
npm install
npm run dev
# Buka http://localhost:5173
```

---

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 💬 **Chat AI** | Tanya MarketAI pasar, berita ekonomi, kondisi aset |
| 📊 **Live Ticker** | Bar harga real-time (IHSG, BTC, ETH, Emas, USD/IDR, dll) |
| 📋 **Watchlist** | Tambah aset yang ingin dipantau untuk konteks AI |
| ⚡ **Analisis Berita** | Paste judul berita → analisis MarketAI instan |
| 🎯 **Tanya Cepat** | Shortcut pertanyaan populer di sidebar |

---

## 🔑 API Endpoints (Backend)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/health` | Cek status server |
| GET | `/api/market` | Snapshot data pasar |
| POST | `/api/chat` | Chat dengan AI (kirim `conversation`, `watchlist`) |
| POST | `/api/analyze` | Analisis MarketAI sebuah headline berita |

### Contoh request `/api/chat`:
```json
{
  "conversation": [
    { "role": "user", "text": "Bagaimana MarketAI pasar hari ini?" }
  ],
  "watchlist": ["BBCA", "BTC", "XAU"]
}
```

---

## 🚧 Pengembangan Lanjutan

- [ ] Integrasi NewsAPI untuk berita otomatis
- [ ] Integrasi Alpha Vantage / Yahoo Finance untuk harga real
- [ ] Database (MongoDB/PostgreSQL) untuk simpan riwayat analisis
- [ ] User authentication
- [ ] Push notification untuk alert MarketAI
- [ ] Grafik historis MarketAI per aset

---

## ⚠️ Disclaimer

Analisis dari MarketAI bersifat **edukatif** dan tidak merupakan saran investasi profesional. 
Selalu lakukan riset mandiri sebelum mengambil keputusan investasi.

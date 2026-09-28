# Ludex 🎮

> Aplikasi mobile Vue 3 + Ionic untuk mengelola koleksi game pribadi dengan AI Recommendation

## Tech Stack

| Teknologi | Keterangan |
|-----------|-----------|
| Vue 3 | Composition API + `<script setup>` |
| Ionic Framework | UI Components (mode Material Design) | 
| Vite | Build tool & dev server |
| IndexedDB | Local storage (browser & Capacitor) |
| RAWG API | Public Game Database API |
| Pinia | State management |
| Axios | HTTP client |

## Fitur

- 🏠 **Home** - Trending & rilis terbaru dengan AI banner
- 🔍 **Search** - Pencarian + filter genre chips + infinite scroll
- 📋 **Detail** - Info lengkap, metacritic score, toggle wishlist
- ❤️ **Wishlist** - Grid 2 kolom, stats, sort by date/rating
- ⭐ **Rating** - Beri rating 1-5 bintang + catatan
- 🕐 **History** - Riwayat aktivitas terkelompok by tanggal
- 👤 **Profile** - Edit profil, statistik, genre favorit AI-detected
- 🤖 **AI Recommendation** - Rekomendasi berdasarkan genre/rating lokal

## Struktur Folder

```
src/
├── main.ts              # Entry point
├── App.vue              # Root component
├── router/
│   └── index.ts         # Vue Router
├── views/
│   ├── TabsPage.vue     # Tab bar layout
│   ├── HomePage.vue     # Halaman 1: Beranda
│   ├── SearchPage.vue   # Halaman 2: Pencarian
│   ├── DetailPage.vue   # Halaman 3: Detail Game
│   ├── WishlistPage.vue # Halaman 4: Wishlist
│   ├── RatingPage.vue   # Halaman 5: Rating
│   ├── HistoryPage.vue  # Halaman 6: Riwayat
│   └── ProfilePage.vue  # Halaman 7: Profil
├── stores/
│   ├── wishlistStore.ts
│   ├── ratingsStore.ts
│   └── userStore.ts
├── services/
│   ├── api.service.ts     # RAWG API + Axios
│   ├── database.service.ts # IndexedDB CRUD
│   └── ai.service.ts      # AI Recommendation engine
├── types/
│   └── index.ts          # TypeScript interfaces
└── theme/
    ├── variables.css     # Ionic CSS variables
    └── global.css        # Global styles
```

## Setup & Menjalankan

### 1. Clone & Install

```bash
cd Ludex
npm install
```

### 2. Dapatkan RAWG API Key

- Daftar di [rawg.io/apiv2](https://rawg.io/apiv2)
- Buat file `.env.local`:

```env
VITE_RAWG_API_KEY=your_key_here
```

### 3. Jalankan Development Server

```bash
npm run dev
# Buka http://localhost:8100
```

### 4. Build Production

```bash
npm run build
```

### 5. Deploy ke Android/iOS (Capacitor)

```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
```

## Arsitektur AI Recommendation

```
User Ratings (lokal) → Genre Score Map → Top N Genres → RAWG API → Filtered Games
     ↑                                                                    ↓
  IndexedDB                                              Tampil di HomePage Banner
```

**Algoritma:**
1. Hitung bobot genre dari rating user (rating ≥4 = bobot 2x)
2. Urutkan genre berdasarkan total skor
3. Ambil 2-3 genre teratas
4. Fetch game dari genre tersebut via RAWG API
5. Deduplicate & urutkan by API rating

# 🚀 Migration & Implementation Plan: LISA Chatbot Rewrite (Astro + Tailwind CSS)

Dokumen ini adalah panduan lengkap arsitektur dan langkah-langkah *rewrite* frontend LISA Chatbot dari Vanilla HTML/CSS/JS ke **Astro + Tailwind CSS (TypeScript)** untuk dilanjutkan di Mac/lingkungan lokal baru.

---

## 🎯 Mengapa Astro + Tailwind?

1. **Zero JS by Default & Ultra Fast**: Landing page dirender sebagai HTML statis dengan performa Lighthouse 100/100.
2. **Auto-Hashed Cache-Busting**: Semua asset (CSS, JS, media) otomatis diberi hash unik pada setiap build (contoh: `chat.b8a92f.js`), sehingga masalah browser caching lokal selesai 100% secara permanen.
3. **Islands Architecture**: Halaman chat (`/chat`) dapat menggunakan komponen interaktif terisolasi tanpa membebani halaman landing page.
4. **Clean Component-Driven Structure**: Memisahkan navbar, hero, stats, interactive chatbox, dan feedback modal ke dalam komponen terstruktur.

---

## 🏗️ Struktur Folder Proyek yang Diusulkan

```text
lisa-chatbot-astro/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── images/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   └── ThemeToggle.astro
│   │   ├── landing/
│   │   │   ├── HeroSection.astro
│   │   │   ├── StatsSection.astro
│   │   │   ├── ChatSimulation.astro
│   │   │   ├── CSRSection.astro
│   │   │   ├── FeaturesGrid.astro
│   │   │   └── FAQSection.astro
│   │   ├── chat/
│   │   │   ├── ChatWindow.astro (or .tsx if using React island)
│   │   │   ├── ChatHeader.astro
│   │   │   ├── MessageBubble.astro
│   │   │   ├── QuickChips.astro
│   │   │   ├── QuickReplyButtons.astro
│   │   │   ├── InputArea.astro
│   │   │   └── FeedbackModal.astro
│   │   └── ui/
│   │       ├── Button.astro
│   │       ├── VideoCard.astro
│   │       └── MapsButton.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ChatLayout.astro
│   ├── pages/
│   │   ├── index.astro        # Landing Page
│   │   └── chat/
│   │       └── index.astro    # Dedicated Chat Interface
│   ├── scripts/
│   │   ├── chat-logic.ts      # State management, API calls, event handlers
│   │   ├── parser.ts          # Markdown & button tag parser
│   │   └── theme.ts           # Light/Dark mode handler
│   ├── styles/
│   │   └── global.css         # Design tokens, custom scrollbars, animations
│   └── types/
│       └── chat.ts            # TypeScript interfaces (Message, QuickReply, etc.)
├── .env.example
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

---

## 📦 Variabel Lingkungan (.env.example)

Buat file `.env` di Mac lokal dengan template berikut (tanpa menyimpan kredensial sensitif di repositori publik):

```bash
# Backend Webhook Endpoint
PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance-domain/webhook/your-webhook-id

# Static Media Asset URL
PUBLIC_MEDIA_BASE_URL=https://files.your-domain.com

# Optional Analytics / Monitoring
PUBLIC_APP_VERSION=3.0.0
```

---

## 🛠️ Langkah-Langkah Instalasi & Setup di Mac

### 1. Inisialisasi Proyek Astro Baru
Buka Terminal di Mac, jalankan:

```bash
# Buat proyek Astro baru dengan Tailwind & TypeScript
npm create astro@latest lisa-chatbot-astro -- --template minimal --typescript strict --install --git

cd lisa-chatbot-astro

# Tambahkan integrasi Tailwind CSS
npx astro add tailwind
```

### 2. Konfigurasi `tailwind.config.mjs`
Sesuaikan warna tema dan token desain LISA:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#006c4b',
        'primary-variant': '#005238',
        secondary: '#4d6357',
        surface: 'var(--surface)',
        'surface-container': 'var(--surface-container)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 3. Logika Utama Chat (`src/scripts/chat-logic.ts`)
* **Session Management**: Simpan `sessionId` per perangkat via `localStorage`.
* **State Mutex (`isSending`)**: Mencegah klik tombol berulang kali saat request sedang diproses.
* **Multipart Form Handling**: Dukungan pengiriman teks dan lampiran foto (*vision-ready*).
* **Parser Terstruktur**:
  * Tag `[BUTTONS: label | value]` dirender menjadi komponen tombol interaktif.
  * Numbered list markdown (`1. `, `2. `) dirender murni sebagai elemen `<ol class="chat-ol">`.

---

## 🚀 Panduan Deployment (Docker / VPS Nginx)

Setelah selesai didevelop di Mac, untuk build produksi:

```bash
npm run build
```

Hasil build akan berada di direktori `dist/`. Anda cukup menyalin isi folder `dist/` ke web server Nginx di VPS atau menggunakan Docker image statis `nginx:alpine`.

---

## ✅ Checklist Eksekusi di Mac

- [ ] Clone repositori di Mac: `git clone https://github.com/itsdvvn/lisa-chatbot-web.git`
- [ ] Buat direktori / inisialisasi Astro di folder terpisah atau branch baru (`feature/astro-rewrite`)
- [ ] Pindahkan asset gambar & ikon ke `public/`
- [ ] Pindahkan teks multi-bahasa (`id.json` / `en.json`) ke modul i18n
- [ ] Implementasi halaman utama `index.astro` dan halaman chat `chat/index.astro`
- [ ] Uji responsivitas mobile & visual viewport height (*iOS Safari fix*)
- [ ] Build dan deploy ke staging/production

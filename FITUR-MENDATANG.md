# 🚀 Fitur Mendatang — LISA Chatbot Web

> Daftar fitur dan peningkatan yang direncanakan untuk website **LISA (Lingkungan Sehat dan Asri)**.
> Dibuat menggunakan [Context7](https://context7.com) untuk riset teknologi.

---

## 📋 Legenda Prioritas

| Ikon | Arti |
|------|------|
| 🔴 P1 | High — esensial untuk MVP lanjutan |
| 🟡 P2 | Medium — nilai tambah besar |
| 🟢 P3 | Low — nice to have |

---

## 1. 💬 Peningkatan Chatbot (chat/)

### 1.1 Markdown & Rich Text Rendering — 🟡 P2

**Masalah:** Saat ini bot hanya mengirim teks polos dengan `<br>` untuk newline dan `*bold*` untuk tebal. Tidak bisa menampilkan daftar, tautan yang rapi, atau kode.

**Solusi:** Integrasikan parser Markdown ringan seperti [marked](https://github.com/markedjs/marked) atau [micromark](https://github.com/micromark/micromark) untuk merender:

- Daftar berpoin & bernomor
- Tabel (misal: jadwal bank sampah)
- Blockquote untuk tips lingkungan
- Tautan yang bisa diklik
- Cuplikan kode bila perlu

---

### 1.2 Dukungan Multi-Gambar & Dokumen — 🟡 P2

**Masalah:** Hanya bisa upload 1 gambar, tidak support PDF/doc.

**Solusi:**

- Izinkan upload multiple file (gambar + PDF)
- Pratinjau thumbnail untuk setiap file
- Batasi ukuran total (misal: 10 MB)
- Bot bisa mengirim PDF yang bisa dilihat inline (pakai Google Docs Viewer seperti di halaman utama)

---

### 1.3 Quick Reply / Button Selection — 🟡 P2

**Masalah:** Saran cepat hanya ada di welcome card, tidak muncul lagi setelah chat dimulai.

**Solusi:** Tambahkan sistem *quick reply buttons* — bot bisa mengirim tombol pilihan, misalnya:

```
🏗️ Mau cari tahu apa?
[ Bank Sampah ]  [ 3R ]  [ Jadwal ]
```

Ini bisa dengan mudah diimplementasikan sebagai format pesan khusus, misal bot kirim `[BUTTON:Bank Sampah|3R|Jadwal]` yang di-render jadi tombol oleh frontend.

---

### 1.4 Prewritten Prompt / Suggested Actions — 🟢 P3

Tambahkan menu aksi kontekstual di atas input area yang muncul setelah bot merespon:

- ✅ "Laporkan masalah"
- ✅ "Tanya bank sampah"
- ✅ "Info 3R"
- ✅ "Hubungi admin"

Terinspirasi dari pola yang ditemukan di banyak platform chatbot modern.

---

### 1.5 Voice Input (Speech-to-Text) — 🟢 P3

**Masalah:** Mengetik di mobile kurang nyaman.

**Solusi:** Manfaatkan Web Speech API (`SpeechRecognition`) bawaan browser — tanpa library tambahan.

Cocok untuk siswa yang lebih nyaman bicara daripada mengetik.

> ⚠️ Catatan: Web Speech API didukung di Chrome, Edge, dan Safari (iOS 16.4+), tapi dengan akurasi berbeda-beda.

---

### 1.6 Chat Export — 🟢 P3

Tombol "Download Chat" yang mengekspor riwayat percakapan sebagai file `.txt` atau `.pdf` — berguna jika siswa ingin menyimpan informasi (misal: jadwal bank sampah) yang sudah diberikan LISA.

---

## 2. 🏠 Peningkatan Landing Page (index.html)

### 2.1 PWA (Progressive Web App) — 🔴 P1

**Masalah:** Tidak bisa diakses offline, tidak ada ikon di home screen.

**Solusi:** Jadikan website sebagai PWA:

- Buat `manifest.json` dengan ikon, nama, tema warna
- Service worker untuk cache halaman agar bisa diakses offline
- Tombol "Install App" di hero section atau header

**Mengapa P1:** PWA akan membuat LISA terasa seperti aplikasi native — siswa bisa buka langsung dari home screen tanpa browsing.

---

### 2.2 Dark Mode Toggle — 🟡 P2

**Masalah:** Hanya light mode (Tailwind `darkMode: "class"` sudah dikonfigurasi tapi tidak digunakan).

**Solusi:** Tambahkan toggle dark mode di header dengan:

- State disimpan di `localStorage`
- CSS class `dark` di `<html>`
- Ikon bulan/matahari untuk toggle
- Sesuai preferensi sistem (`prefers-color-scheme`)

---

### 2.3 Dashboard / Statistik Interaktif — 🟡 P2

**Masalah:** Tidak ada visualisasi data.

**Solusi:** Tambahkan dashboard kecil yang menampilkan statistik dampak — bisa menggunakan [Chart.js](https://www.chartjs.org) ringan:

| Metrik | Visualisasi |
|--------|-------------|
| Jumlah siswa teredukasi | 📊 Bar chart |
| Tonase sampah terkelola | 📈 Line chart |
| Jumlah bank sampah aktif | 🗺️ List + badge |
| Rating kepuasan pengguna | ⭐ Star / donut |

Data di-fetch dari backend (n8n) via API endpoint.

---

### 2.4 Animasi Scroll Lanjutan — 🟡 P2

**Masalah:** Animasi reveal entry sudah ada, tapi masih kaku.

**Solusi:** Tingkatkan dengan [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) yang sudah dipakai, ditambah:

- Parallax halus pada hero background
- Stagger animation untuk elemen grid (CSR cards)
- Counter animasi (misal: "0 → 1.234 siswa" ketika discroll ke statistik)

---

### 2.5 Infinite / Load-on-Scroll Media Kit — 🟢 P3

Jika koleksi dokumen publik bertambah banyak, ganti dari list statis menjadi:

- Kategori filter (Company Profile, Press Release, DLL)
- Pencarian dokumen
- Pagination atau infinite scroll

---

### 2.6 Multi-language (i18n) — 🟢 P3

Siapkan struktur untuk terjemahan (Indonesia sebagai default, Inggris sebagai alternatif):

- File JSON per bahasa (`/locales/id.json`, `/locales/en.json`)
- Deteksi bahasa browser
- Toggle bahasa di header
- Terjemahkan konten utama: hero, CSR cards, media kit

---

## 3. ⚙️ Fondasi Teknis

### 3.1 Eksternal CSS & JS Modular — 🟡 P2

**Masalah:** Semua CSS di dalam `<style>` inline dan semua JS dalam satu `<script>` — susah dirawat saat scale.

**Solusi:** Pisahkan ke file eksternal tanpa build tool:

```
lisa-chatbot/
├── index.html          # Landing page
├── css/
│   ├── style.css       # Global styles + Tailwind custom
│   ├── animations.css  # Animasi terpisah
│   └── chat.css        # Khusus halaman chat
├── js/
│   ├── main.js         # Navigation, modal, scroll reveal
│   ├── chat.js         # Logic chat (terpisah dari landing)
│   └── utils.js        # Fungsi bersama (format tanggal, linkify, dsb.)
└── chat/
    └── index.html
```

**Manfaat:**
- Kode lebih terorganisir tanpa framework
- Browser cache per file (update 1 file tidak perlu download semua)
- Transparan — apa yang kamu tulis, itu yang jalan

---

### 3.2 API Proxy via Cloudflare Worker — 🟡 P2

**Masalah:** Webhook n8n terekspos langsung di frontend (`webhookUrl` di JS).

**Solusi:** Buat proxy endpoint sederhana (Cloudflare Workers atau service serupa):

```js
// Cloudflare Worker — vanilla JS, zero framework
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat") {
      return fetch("https://n8n.terato.my.id/webhook/...", {
        method: "POST",
        headers: request.headers,
        body: request.body,
      });
    }
    return new Response("Not found", { status: 404 });
  }
};
```

**Manfaat:**
- Webhook URL tersembunyi dari client
- Bisa tambah rate limiting, CORS, logging
- Zero dependency — vanilla JavaScript

---

### 3.3 Optimasi Tailwind CDN — 🟢 P3

**Masalah:** Tailwind via CDN mendownload semua utility (6 MB+) meski banyak tidak terpakai.

**Solusi Tanpa Build Tool:**

| Opsi | Cara |
|------|------|
| **Batasi plugin** | `cdn.tailwindcss.com?plugins=forms` — sudah dilakukan |
| **Purge dengan service worker** | Service worker bisa intercept dan filter CSS yang tidak dipakai |
| **Prefetch & cache** | Service worker bisa cache Tailwind CDN agar tidak unduh ulang |

> ⚠️ Untuk ukuran proyek saat ini, Tailwind CDN masih sangat layak. Optimasi ini bisa ditunda sampai benar-benar terasa lambat.

---

### 3.4 CI/CD & Automated Testing — 🟢 P3

- GitHub Actions untuk deploy otomatis ke GitHub Pages / hosting static
- Lighthouse CI untuk pantau performa, aksesibilitas, SEO
- [PageSpeed Insights](https://pagespeed.web.dev/) untuk validasi berkala — tanpa setup kompleks

---

## 4. ♿ Aksesibilitas & Inklusivitas

### 4.1 Aksesibilitas (a11y) — 🔴 P1

**Masalah:** Beberapa elemen kurang atribut aksesibilitas.

**Perbaikan:**

| Area | Perbaikan |
|------|-----------|
| Tombol ikon | Tambahkan `aria-label` ke semua icon-only button |
| Live region | `aria-live="polite"` di chatbox agar screen reader baca pesan baru |
| Focus trap | Di modal dan form feedback |
| Skip link | Skip to main content |
| Kontras warna | Pastikan semua teks memenuhi WCAG AA |

---

### 4.2 Mode Kontras Tinggi & Font Scaling — 🟢 P3

- Dukung `prefers-contrast: more`
- Gunakan unit `rem` secara konsisten (sudah dipakai di Tailwind config)
- Tombol "Perbesar teks" di pengaturan

---

## 5. 📈 Performa

### 5.1 Image Optimization — 🟡 P2

**Masalah:** Gambar dari URL eksternal di-load tanpa optimasi.

**Solusi:**

- Lazy load semua gambar (`loading="lazy"`) — sudah diterapkan sebagian
- Gunakan [Cloudflare Images](https://www.cloudflare.com/products/cloudflare-images/) atau [Cloudinary](https://cloudinary.com/) untuk optimasi otomatis (format WebP/AVIF, resize) — tinggal ubah URL src, tanpa perlu build tool
- Atau konversi manual ke WebP pakai tools online / `ffmpeg`
- Berikan ukuran eksplisit (`width`/`height`) di HTML untuk mencegah Cumulative Layout Shift

---

### 5.2 Code Splitting & Bundle Optimization — 🟢 P3

- Pisahkan JS chat dari JS landing page
- Dynamic import untuk komponen jarang dipakai (modal, form)
- Minify HTML/CSS/JS di production

---

## 6. 📱 Fitur Mobile Lebih Baik

### 6.1 Bottom Navigation Bar — 🟡 P2

**Masalah:** Navigasi di mobile hanya mengandalkan scroll dan link.

**Solusi:** Tambahkan bottom nav bar di mobile (lebih ergonomis untuk jempol):

```
[ 🏠 Beranda ] [ 💬 Chat ] [ 📁 Media Kit ] [ 📞 Kontak ]
```

---

### 6.2 Pull-to-Refresh di Chat — 🟢 P3

Implementasi pull-to-refresh di chatbox untuk me-reload chat history atau reconnect ke server.

---

## 📅 Prioritas Berdasarkan Tahap

| Fase | Fokus | Fitur Utama |
|------|-------|-------------|
| **Fase 1** (Sekarang–1 bulan) | Fondasi & PWA | PWA (manifest + service worker), Dark mode, Image lazy load, a11y, Eksternal CSS/JS |
| **Fase 2** (1–3 bulan) | Chat & Interaksi | Markdown rendering, Quick reply, Multi-file upload, Voice input, Statistik dashboard (Chart.js) |
| **Fase 3** (3–6 bulan) | Skalabilitas | API proxy, i18n, Bottom nav mobile, CI/CD + Lighthouse, Fitur aksesibilitas lanjutan |

---

> 📌 Dokumen ini dibuat dengan bantuan **Context7** — riset library dan best practice secara real-time.
> 
> **Tech Stack:** HTML + CSS + JavaScript (vanilla) + Tailwind CDN + Material Symbols.
> 
> Selanjutnya bisa diedit di: [FITUR-MENDATANG.md](./FITUR-MENDATANG.md)

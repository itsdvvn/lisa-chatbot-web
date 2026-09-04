<div align="center">
  <img src="https://files.lingkungansehatasri.my.id/landingPage/5_20251125_183529_0004.png" alt="Logo GBL" width="80" />
  <h1 align="center">🌿 LISA</h1>
  <p align="center"><strong>Lingkungan Sehat dan Asri</strong></p>
  <p align="center">
    Chatbot berbasis AI untuk edukasi lingkungan — <br/>
    bantu masyarakat memahami sampah, 3R, dan bank sampah dalam satu percakapan cerdas.
  </p>
  <p align="center">
    <a href="https://chatbot.lingkungansehatasri.my.id" target="_blank">🌐 Kunjungi LISA (Live App)</a>
    &nbsp;·&nbsp;
    <a href="https://instagram.com/gerakanbicaralingkungan_" target="_blank">📸 Instagram GBL</a>
  </p>
</div>

<br/>

---

## 📖 Tentang LISA

**LISA (Lingkungan Sehat dan Asri)** adalah platform chatbot edukasi lingkungan berbasis AI yang dirancang untuk mempermudah masyarakat — khususnya pelajar dan generasi muda — dalam memahami isu pengelolaan sampah melalui percakapan interaktif yang cepat, akurat, dan ramah pengguna.

Dikembangkan oleh mahasiswa **Public Relations Universitas Bina Sarana Informatika (UBSI)** kampus Ciledug dan Ciputat sebagai proyek inovasi sosial, LISA hadir untuk menjembatani kesenjangan (*communication gap*) antara kesadaran lingkungan generasi muda dengan akses terhadap panduan praktis pengelolaan sampah.

> *"Harapan saya, hadirnya chatbot LISA bisa menutup GAP komunikasi yang terjadi sekarang antara remaja yang peduli lingkungan dan kebutuhan informasi yang akurat."*<br/>
> — **Wahyudi Setiawan**, Ketua Tim Pengembang

---

## 🎯 Latar Belakang & Masalah

Masyarakat di perkotaan seringkali menghadapi kendala dalam:
- Memilah sampah berdasarkan jenis material (organik, anorganik, B3, residu)
- Memahami teknik daur ulang dan komposting rumahan
- Menerapkan prinsip **Reduce, Reuse, Recycle (3R)** secara konsisten
- Menemukan lokasi bank sampah terdekat untuk penyaluran sampah anorganik bernilai ekonomis

LISA menjawab tantangan ini dengan menyajikan informasi yang **akurat, praktis, dan mudah diaplikasikan** secara *real-time*.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 💬 **Percakapan Interaktif AI** | Tanya jawab seputar lingkungan dengan bahasa santai, didukung pemrosesan bahasa alami (NLP). |
| ⚡ **Streaming Respon Cepat** | Menampilkan jawaban secara responsif dan interaktif. |
| 🔊 **Text-to-Speech (Audio)** | Fitur suara untuk mendengarkan pesan balasan secara langsung. |
| 🌐 **Multi-bahasa (i18n)** | Dukungan Bahasa Indonesia dan Bahasa Inggris untuk aksesibilitas yang lebih luas. |
| 🌓 **Tema Gelap & Terang** | Dukungan Dark Mode otomatis & manual untuk kenyamanan membaca. |
| ♻️ **Panduan 3R & Klasifikasi** | Database klasifikasi jenis sampah serta tips pemilahan terstandar. |
| ❓ **FAQ Interaktif** | Panduan pertanyaan umum tentang LISA dan pengelolaan lingkungan. |
| 📱 **Ultra-Responsive & Modern** | Dioptimalkan untuk performa tinggi pada desktop, tablet, maupun smartphone. |

---

## 🛠️ Arsitektur & Teknologi

LISA dibangun menggunakan arsitektur modern berorientasi performa dan skalabilitas:

```
User (Browser) ──► Astro 5 Frontend (Tailwind CSS) ──► n8n Webhook Workflow ──► Google Gemini API
```

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Frontend Framework** | [Astro v5](https://astro.build/) | Static Site Generation (SSG) & Island Architecture berkecepatan tinggi |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utilitas CSS modern dan desain responsif |
| **Icons & Typography** | [Google Inter](https://fonts.google.com/specimen/Inter) & [Material Symbols](https://fonts.google.com/icons) | Desain visual yang bersih dan konsisten |
| **AI Orchestration** | [n8n Automation](https://n8n.io/) | Manajemen flow chat, session, and fallback handling |
| **AI LLM Engine** | [Google Gemini](https://deepmind.google/technologies/gemini/) | Mesin pemrosesan bahasa alami |
| **Deployment** | Docker & Nginx Reverse Proxy | Kontainerisasi aplikasi untuk produksi |

---

## 📁 Struktur Repositori

```text
lisa-chatbot-web/
├── src/                      # 🚀 Kode Sumber Astro
│   ├── components/           # Komponen UI (Navbar, Hero, Chat, FAQ, Footer, dll)
│   │   ├── chat/             # Komponen antarmuka chat
│   │   ├── landing/          # Komponen halaman landing
│   │   └── layout/           # Komponen layout global
│   ├── layouts/              # Template layout Astro (BaseLayout, ChatLayout)
│   ├── pages/                # File routing (index.astro, chat/index.astro)
│   ├── scripts/              # Logic client-side chat, parser, & utilities
│   ├── styles/               # Global CSS & theme tokens
│   └── types/                # Definisi TypeScript
├── public/                   # Asset statis, gambar, manifest, & file bahasa (i18n)
├── database/                 # Skema dan referensi database
├── supabase/                 # Konfigurasi backend pendukung Supabase
├── Dockerfile                # Multi-stage Docker build untuk produksi
├── nginx.conf                # Konfigurasi web server Nginx
├── astro.config.mjs          # Konfigurasi framework Astro
├── tailwind.config.mjs       # Konfigurasi styling Tailwind CSS
├── tsconfig.json             # Konfigurasi TypeScript
├── package.json              # Dependensi & script proyek
└── README.md                 # Dokumentasi proyek
```

---

## 🚀 Panduan Memulai (Local Development)

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18.x atau 20.x+)
- `npm`, `pnpm`, atau `yarn`

### 1. Clone & Masuk ke Repositori
```bash
git clone https://github.com/itsdvvn/lisa-chatbot-web.git
cd lisa-chatbot-web
```

### 2. Setup & Jalankan Development Server
```bash
# Install seluruh dependensi
npm install

# Setup environment variable (opsional)
cp .env.example .env

# Jalankan dev server
npm run dev
```
Buka browser di `http://localhost:4321` untuk melihat aplikasi.

### 3. Build untuk Produksi
```bash
npm run build
npm run preview
```
Output static build yang teroptimasi akan dihasilkan di direktori `dist/`.

---

## 🐳 Deployment via Docker

Aplikasi telah dilengkapi dengan multi-stage `Dockerfile` berbasis Nginx Alpine yang sangat ringan dan efisien:

```bash
# Build Docker Image
docker build -t lisa-chatbot:latest .

# Jalankan Kontainer
docker run -d --name lisa-chatbot -p 3000:80 --restart unless-stopped lisa-chatbot:latest
```


---

## 👥 Tim & Kontributor

| Peran | Nama |
|---|---|
| **Ketua Tim Pengembang** | **Wahyudi Setiawan** |
| Tim Riset & Konten | Mahasiswa Public Relations UBSI Ciledug & Ciputat |

Didukung oleh:
- **Gerakan Bicara Lingkungan (GBL)**
- **Komunitas Guna Ulang Saja (GUA)**

---

## 📄 Media & Kontak

- **Live Chatbot:** [chatbot.lingkungansehatasri.my.id](https://chatbot.lingkungansehatasri.my.id)
- **Instagram:** [@gerakanbicaralingkungan_](https://instagram.com/gerakanbicaralingkungan_)
- **Email PR:** [publicrelation2344@gmail.com](mailto:publicrelation2344@gmail.com)

---

## 📜 Lisensi

Hak Cipta © 2025–2026 LISA — Gerakan Bicara Lingkungan.  
Dibuat dengan ❤️ untuk Bumi.


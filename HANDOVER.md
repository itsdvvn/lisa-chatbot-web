# 🤝 HANDOVER NOTE: Chatbot LISA Web

**Terakhir Diperbarui:** 2026-11-06 18:42 WIB  
**Device Sumber:** Mac (mac-local-workspace)  
**Status Produksi:** Live & Sinkron (Bebas Jargon Teknis)  
**Domain Live:** `https://lisa.itsdvvn.my.id/`  
**VPS:** `ubuntu@43.134.71.78` (`/root/server/lisa-html` & `/root/server/lisa-chatbot-repo`)  

---

## 1. 📌 Ringkasan Pekerjaan Selesai
1. **Pembersihan Seluruh Jargon Teknis (Copywriting Manfaat Nyata Pengunjung):**
   - Merespons koreksi Mas Yudhi mengenai kalimat teknis yang tidak relevan bagi pengunjung umum/pelajar:
     - **Fase 2:** Dari *"Web App PWA & Supabase Vector Engine"* $\rightarrow$ *"Aplikasi Web & Chat Pintar 24 Jam"*; deskripsi dibersihkan dari sebutan *pgvector* & *Astro v5* menjadi *"Akses cepat 24 jam dalam dua bahasa (ID/EN), kemampuan memahami obrolan santai sehari-hari, direktori lokasi bank sampah resmi, dan ringan dibuka di semua perangkat."*
     - **Fase 3:** Sub-tag *"Kalkulator Cuan & Emisi"*, deskripsi difokuskan pada nilai tabungan rupiah sampah terpilah (botol plastik, kardus, minyak jelantah, kaleng) dan pengurangan jejak emisi karbon.
     - **Fase 4:** Dari *"PostGIS Spasial & Lapor Titik Sampah"* $\rightarrow$ *"Panduan Rute Terdekat & Lapor Titik Sampah"*, sub-tag *"Navigasi & Foto Sampah"*; deskripsi diubah menjadi *"Panduan rute menuju bank sampah terdekat dari lokasimu, kenali jenis sampah otomatis lewat foto kamera, serta fitur lapor lokasi tumpukan sampah liar."*
     - **Di Balik Layar:** Tombol tab diganti menjadi `[ ⚙️ Cara Kerja LISA ]`, teks penjelasan dan caption gambar diubah menghilangkan istilah internal *Supabase vector database* dan *automasi n8n*.
     - **Kartu Co-Development:** Point riset diubah menjadi *"Pengembangan deteksi jenis sampah lewat kamera & formula kalkulator tabungan sampah."*
   - Pembaruan diterapkan serentak pada `src/pages/index.astro`, `public/locales/id.json`, `public/locales/en.json`, `src/locales/id.json`, dan `src/locales/en.json`.
2. **Dokumentasi Lesson Otomatis ke Notion Second Brain:**
   - Dicatat langsung ke database **Lesson** (`3fc10415-e0b0-8086-9253-e15d858c48e6`): *"Copywriting Landing Page Publik Bebas Jargon Teknis"*, Domain: `Writing & Copy`.
3. **Build & Deployment Live:**
   - `npm run build` sukses.
   - Diekstrak langsung ke server produksi `/root/server/lisa-html` pada VPS.
   - Terverifikasi HTTP 200 dan teks terbaru live di `https://lisa.itsdvvn.my.id/`.

---

## 2. 🚀 Status Branch & Remote
- `origin/main` & `origin/mac-local-workspace`: Siap sinkron.
- Working tree: Clean.

---

## 3. 🎯 Langkah Selanjutnya (Next Actions)
- Nomor WhatsApp kolaborasi Co-Development telah diperbarui ke kontak aktif Mas Yudhi: `6285701924579`.
- Pengembangan Fase 3 (*Kalkulator Cuan & Jejak Karbon*) sesuai rencana roadmap.

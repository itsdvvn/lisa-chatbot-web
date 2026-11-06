# 🤝 HANDOVER NOTE: Chatbot LISA Web

**Terakhir Diperbarui:** 2026-11-06 18:31 WIB  
**Device Sumber:** Mac (mac-local-workspace)  
**Status Produksi:** Live & Sinkron (Commit `2204164` di `main` & `mac-local-workspace`)  
**Domain Live:** `https://lisa.itsdvvn.my.id/`  
**VPS:** `ubuntu@43.134.71.78` (`/root/server/lisa-html` & `/root/server/lisa-chatbot-repo`)  

---

## 1. 📌 Ringkasan Pekerjaan Selesai
1. **Penyempurnaan Desain & Layout Landing Page:**
   - **Section "Di Balik Chatbot LISA":**
     - Menghapus tumpukan dua card kaku dan menggantinya dengan wadah galeri tunggal bersistem Switcher Tab responsif: `[ 🏆 Tim PR Awards 2025 ]` dan `[ ⚙️ Arsitektur AI ]`.
     - Mengatasi masalah foto terpotong: Foto tim `pr-awards-team.webp` (portrait $700 \times 876$) kini menggunakan `object-contain` dan rasio natural (`max-h-[450px]`), tampil 100% utuh tanpa ada kepala atau spanduk yang terpotong.
   - **Section "Roadmap & Kolaborasi Co-Development" (2-Kolom):**
     - Kolom Kiri: 4 Fase evolusi (Fase 1 Selesai, Fase 2 Aktif, Fase 3 Kalkulator Cuan & Jejak Karbon Mendatang, Fase 4 Spasial PostGIS).
     - Seluruh card stroke diratakan menggunakan border minimalis yang seragam (`border border-outline-variant/30 shadow-xs`), menghapus stroke tebal `border-2`.
     - Kolom Kanan: Card Co-Development hijau tua dengan tombol WhatsApp untuk kolaborasi riset dan pengembangan bot.
   - **Perbaikan Sintaks HTML & i18n:**
     - Menutup tag `<section>` pada Media Kit.
     - Menambahkan 76 string dwi-bahasa (ID/EN) di `public/locales/id.json` dan `public/locales/en.json`.
2. **Keamanan & Backup VPS:**
   - Backup direktori sebelum ekstraksi tersimpan di `/root/server/lisa-html-backup-20261106182917`.
   - Dist build terbaru berhasil di-deploy ke `/root/server/lisa-html` dan repo di `/root/server/lisa-chatbot-repo` sinkron dengan commit `2204164`.

---

## 2. 🚀 Status Branch & Remote
- `origin/main`: Commit `2204164` (Up to date)
- `origin/mac-local-workspace`: Commit `2204164` (Up to date)
- Working tree: Clean.

---

## 3. 🎯 Langkah Selanjutnya (Next Actions)
- Jika Mas Yudhi ingin mengganti nomor WhatsApp default `6281234567890` pada tombol CTA Co-Development dengan nomor kontak aslinya, tinggal perbarui href tautan `wa.me/...` di `src/pages/index.astro` baris terkait.
- Pengembangan Fase 3 (*Kalkulator Cuan & Jejak Karbon*) sesuai roadmap di `LISA_ACTION_DRIVEN_TRANSFORMATION_PLAN.md`.

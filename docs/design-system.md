# Design System — Rental Sewa Barang Tracker

## 1. Prinsip Desain

- **Jelas & dapat dipercaya:** transaksi menyangkut barang fisik & uang antar orang asing — UI harus membuat status (booking, pembayaran, tenggat) selalu terlihat jelas, tanpa ambiguitas.
- **Sedikit langkah, banyak kejelasan:** alur booking (request → approve → aktif → selesai) ditampilkan sebagai progress yang eksplisit, bukan tersembunyi di balik istilah teknis.
- **Mobile-first:** mayoritas Renter kemungkinan mengakses dari HP saat mencari barang mendadak.

## 2. Palet Warna & Tipografi

- **Warna utama:** satu warna brand (misal biru/hijau tergantung identitas final) dipakai untuk aksi utama (tombol "Ajukan Sewa", "Setujui").
- **Warna status** (dipakai konsisten di badge status barang & booking):
  - `TERSEDIA` / `APPROVED` / `COMPLETED` / `LUNAS` → hijau (positif)
  - `PENDING` → kuning/amber (menunggu aksi)
  - `DISEWA` / `ACTIVE` → biru (sedang berjalan)
  - `TELAT_KEMBALI` / `LATE` / `BELUM_LUNAS` → merah (butuh perhatian)
  - `REJECTED` / `NONAKTIF` → abu-abu (netral/nonaktif)
- **Tipografi:** satu font sans-serif untuk UI (mis. Inter/system font stack), skala type terbatas (h1–h4, body, caption) — hindari terlalu banyak ukuran custom per halaman.

## 3. Konvensi Komponen

- Nama komponen React memakai `PascalCase`, satu file satu komponen (`ItemCard.tsx`, `BookingStatusBadge.tsx`).
- Komponen status (badge) menerima enum status sebagai prop tunggal dan memetakan ke warna+label secara internal — supaya mapping warna status konsisten di semua tempat (tidak ada styling status manual berulang per halaman).
- Form mutasi (create item, ajukan booking) memakai pola yang sama: validasi client-side ringan + validasi server-side wajib (Zod), pesan error inline di bawah field.

## 4. Grid & Spacing, Breakpoint Responsif

- Spacing scale kelipatan 4px (4/8/12/16/24/32...).
- Breakpoint: mobile (default, <640px), tablet (`sm`/`md`, 640–1024px), desktop (`lg`+, >1024px) — mengikuti breakpoint bawaan Tailwind CSS kalau dipakai sebagai styling layer.
- Halaman Browse: grid card 1 kolom di mobile, 2–3 kolom di tablet/desktop.

## 5. Panduan Aksesibilitas Dasar

- Kontras warna teks-terhadap-background minimum WCAG AA (4.5:1 untuk teks normal).
- Semua form input punya `label` yang terasosiasi (bukan hanya placeholder).
- Elemen interaktif (tombol approve/reject, filter) bisa diakses via keyboard (`tab`, `enter`), dengan focus state yang terlihat jelas.
- Badge status tidak hanya mengandalkan warna — sertakan teks label (misal "Telat Kembali", bukan cuma warna merah) untuk aksesibilitas warna-buta.

## 6. Konvensi UI Library

- Rekomendasi: **Tailwind CSS** untuk utility styling + komponen headless (mis. shadcn/ui / Radix primitives) untuk elemen kompleks (dialog konfirmasi approve/reject, dropdown filter) — memberi kontrol penuh atas styling sambil tetap aksesibel secara default.
- Ikon: satu set ikon konsisten (mis. Lucide) untuk seluruh aplikasi — hindari mencampur beberapa icon set.

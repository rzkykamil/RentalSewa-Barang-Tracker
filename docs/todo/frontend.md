# Todo — Frontend

Living document. Centang item selesai, tambahkan item baru saat muncul. Urutan mengikuti jadwal fokus di `docs/development-workflow.md`.

## Modul Auth
- [ ] Halaman registrasi dengan pilihan role (Owner/Renter)
- [ ] Halaman login
- [ ] Layout dashboard terpisah per role (Owner/Renter/Admin) sesuai `docs/prd.md` permission matrix
- [ ] Halaman edit profil (nama, phone, avatar)
- [ ] State loading/error untuk form auth

## Modul Barang (Item)
- [ ] Form tambah barang (nama, deskripsi, kategori, kondisi, harga/hari, upload multi-foto) — mock data dulu
- [ ] Form edit barang + tombol nonaktifkan
- [ ] Halaman daftar barang milik Owner (dengan badge status)
- [ ] Halaman Browse & Discovery (grid card, filter kategori & rentang harga, sort harga)
- [ ] Halaman detail barang (galeri foto, kondisi, harga, rating rata-rata, tombol ajukan sewa)

## Modul Booking
- [ ] Form ajukan request sewa (pilih rentang tanggal, preview total harga)
- [ ] Dashboard Owner: daftar request masuk dengan aksi approve/reject
- [ ] Halaman "booking saya" (Renter): daftar booking + status timeline visual (PENDING → APPROVED → ACTIVE → COMPLETED)
- [ ] Komponen `BookingStatusBadge` (mapping warna status sesuai `docs/design-system.md`)
- [ ] Tombol Owner: tandai aktif / tandai selesai

## Modul Payment Tracking
- [ ] UI Owner: tandai status pembayaran (LUNAS/BELUM_LUNAS) + catatan metode
- [ ] Tampilkan status pembayaran di detail booking (Owner & Renter)

## Modul History
- [ ] Halaman riwayat transaksi per user (filter status, urut tanggal)
- [ ] Halaman riwayat transaksi per barang (dilihat dari detail barang, khusus Owner)

## Modul Reminder
- [ ] Komponen notifikasi in-app (badge/counter) untuk reminder H-1 & overdue
- [ ] Halaman/list notifikasi in-app

## Modul Rating/Review
- [ ] Form beri rating (1-5) + komentar, muncul hanya untuk booking COMPLETED
- [ ] Tampilkan daftar review & rata-rata rating di halaman detail barang

## Modul Admin
- [ ] Halaman daftar seluruh user + aksi nonaktifkan
- [ ] Halaman daftar seluruh barang + aksi nonaktifkan paksa
- [ ] Halaman daftar seluruh booking (read-only monitoring)

## Cross-cutting
- [ ] Setup design tokens (warna, spacing, tipografi) sesuai `docs/design-system.md`
- [ ] Komponen shared: `ItemCard`, `BookingStatusBadge`, `RatingStars`, `EmptyState`, `ConfirmDialog`
- [ ] Responsive check (mobile/tablet/desktop) untuk seluruh halaman utama

## Backlog / Temuan
_(catat di sini kebutuhan/bug di luar fokus periode yang sedang berjalan — jangan langsung dikerjakan)_

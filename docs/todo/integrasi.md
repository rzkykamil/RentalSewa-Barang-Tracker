# Todo — Integrasi

Living document. Centang item selesai, tambahkan item baru saat muncul. Urutan mengikuti jadwal fokus di `docs/development-workflow.md`.

Fase integrasi = ganti mock data di frontend dengan panggilan API asli, tangani state loading/error nyata, sesuaikan kontrak kalau ada mismatch antara frontend & backend. Acuan: `docs/api-spec.md`, `docs/flows/*`.

## Modul Auth
- [ ] Sambungkan form registrasi & login ke NextAuth (credentials provider) asli
- [ ] Sambungkan role guard middleware ke layout dashboard per role
- [ ] Sambungkan halaman edit profil ke endpoint update user asli
- [ ] Ganti state loading/error mock di form auth dengan state dari API asli

## Modul Barang (Item)
- [ ] Sambungkan form tambah/edit barang (termasuk upload multi-foto) ke endpoint CRUD asli
- [ ] Sambungkan tombol nonaktifkan barang ke endpoint asli
- [ ] Sambungkan halaman daftar barang milik Owner ke data asli (badge status dari DB)
- [ ] Sambungkan halaman Browse & Discovery ke endpoint filter/sort asli
- [ ] Sambungkan halaman detail barang (galeri foto, rating rata-rata) ke data asli

## Modul Booking
- [ ] Sambungkan form ajukan request sewa ke endpoint booking asli (termasuk BR1 lock ketersediaan)
- [ ] Sambungkan dashboard Owner (approve/reject) ke endpoint status machine asli
- [ ] Sambungkan halaman "booking saya" (Renter) ke data status timeline asli
- [ ] Sambungkan tombol Owner "tandai aktif / tandai selesai" ke endpoint asli

## Modul Payment Tracking
- [ ] Sambungkan UI tandai status pembayaran (LUNAS/BELUM_LUNAS) ke endpoint asli
- [ ] Sambungkan tampilan status pembayaran di detail booking ke data asli

## Modul History
- [ ] Sambungkan halaman riwayat transaksi per user ke query history asli
- [ ] Sambungkan halaman riwayat transaksi per barang ke query history asli

## Modul Reminder
- [ ] Sambungkan komponen notifikasi in-app (badge/counter) ke data reminder job worker asli
- [ ] Sambungkan halaman/list notifikasi in-app ke endpoint asli

## Modul Rating/Review
- [ ] Sambungkan form beri rating & komentar ke endpoint review asli
- [ ] Sambungkan tampilan daftar review & rata-rata rating ke data asli

## Modul Admin
- [ ] Sambungkan halaman daftar user + aksi nonaktifkan ke endpoint asli
- [ ] Sambungkan halaman daftar barang + aksi nonaktifkan paksa ke endpoint asli
- [ ] Sambungkan halaman daftar booking (read-only monitoring) ke data asli

## Cross-cutting
- [ ] Audit semua pemanggilan mock data yang tersisa (pastikan tidak ada yang lolos ke production)
- [ ] Selaraskan mismatch kontrak API (kalau ada) antara `docs/api-spec.md` dan implementasi aktual
- [ ] Cek ulang state loading/error/empty di seluruh halaman utama memakai data asli

## Backlog / Temuan
_(catat di sini kebutuhan/bug di luar fokus periode yang sedang berjalan — jangan langsung dikerjakan)_

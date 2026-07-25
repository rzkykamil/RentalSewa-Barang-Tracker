# Todo — Integrasi

Living document. Centang item selesai, tambahkan item baru saat muncul. Urutan mengikuti jadwal fokus di `docs/development-workflow.md`.

Fase integrasi = ganti mock data di frontend dengan panggilan API asli, tangani state loading/error nyata, sesuaikan kontrak kalau ada mismatch antara frontend & backend. Acuan: `docs/api-spec.md`, `docs/flows/*`.

## Modul Auth
- [x] Sambungkan form registrasi & login ke NextAuth (credentials provider) asli
- [x] Sambungkan role guard middleware ke layout dashboard per role
- [x] Sambungkan halaman edit profil ke endpoint update user asli
- [x] Ganti state loading/error mock di form auth dengan state dari API asli

## Modul Barang (Item)
- [x] Sambungkan form tambah/edit barang (termasuk upload multi-foto) ke endpoint CRUD asli
- [x] Sambungkan tombol nonaktifkan barang ke endpoint asli
- [x] Sambungkan halaman daftar barang milik Owner ke data asli (badge status dari DB)
- [x] Sambungkan halaman Browse & Discovery ke endpoint filter/sort asli
- [x] Sambungkan halaman detail barang (galeri foto, rating rata-rata) ke data asli

## Modul Booking
- [x] Sambungkan form ajukan request sewa ke endpoint booking asli (termasuk BR1 lock ketersediaan)
- [x] Sambungkan dashboard Owner (approve/reject) ke endpoint status machine asli
- [x] Sambungkan halaman "booking saya" (Renter) ke data status timeline asli
- [x] Sambungkan tombol Owner "tandai aktif / tandai selesai" ke endpoint asli

## Modul Payment Tracking
- [x] Sambungkan UI tandai status pembayaran (LUNAS/BELUM_LUNAS) ke endpoint asli
- [x] Sambungkan tampilan status pembayaran di detail booking ke data asli

## Modul History
- [x] Sambungkan halaman riwayat transaksi per user ke query history asli
- [x] Sambungkan halaman riwayat transaksi per barang ke query history asli

## Modul Reminder
- [x] Sambungkan komponen notifikasi in-app (badge/counter) ke data reminder job worker asli
- [x] Sambungkan halaman/list notifikasi in-app ke endpoint asli

## Modul Rating/Review
- [x] Sambungkan form beri rating & komentar ke endpoint review asli
- [x] Sambungkan tampilan daftar review & rata-rata rating ke data asli

## Modul Admin
- [x] Sambungkan halaman daftar user + aksi nonaktifkan ke endpoint asli
- [x] Sambungkan halaman daftar barang + aksi nonaktifkan paksa ke endpoint asli
- [x] Sambungkan halaman daftar booking (read-only monitoring) ke data asli

## Cross-cutting
- [x] Audit semua pemanggilan mock data yang tersisa (pastikan tidak ada yang lolos ke production)
- [x] Selaraskan mismatch kontrak API (kalau ada) antara `docs/api-spec.md` dan implementasi aktual
- [x] Cek ulang state loading/error/empty di seluruh halaman utama memakai data asli

## Backlog / Temuan
_(catat di sini kebutuhan/bug di luar fokus periode yang sedang berjalan — jangan langsung dikerjakan)_

- **`docs/api-spec.md` §Admin tidak mendefinisikan endpoint reaktivasi user** (hanya `PATCH /admin/users/:id/deactivate`), padahal UI mock sebelumnya (`docs/todo/frontend.md` Modul Admin) punya tombol "Aktifkan" untuk user nonaktif. Ditemukan saat mengerjakan integrasi Modul Admin — `AdminUsersTable` diubah supaya baris user nonaktif hanya menampilkan label statis ("User ini sudah nonaktif"), tanpa aksi. Perlu didiskusikan dengan user: apakah reaktivasi memang out-of-scope (moderasi satu arah), atau perlu endpoint `PATCH /admin/users/:id/activate` baru.
- **Tidak ada `loading.tsx`/`error.tsx` di route group manapun** (`(owner)`, `(renter)`, `(admin)`, `(public)`) — ditemukan saat audit cross-cutting state loading/error/empty. Setiap halaman Server Component tampil blank selagi fetch, dan kalau `getCurrentUser()`/fetch lain di luar try/catch listing melempar error, user melihat error page default Next.js, bukan gaya app. Scope-nya lintas seluruh route group jadi tidak dikerjakan di audit ini — perlu didiskusikan urutan/prioritas pengerjaannya.

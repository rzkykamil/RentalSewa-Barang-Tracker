# Todo — QA

Living document. Centang item selesai, tambahkan item baru saat muncul. Urutan mengikuti jadwal fokus di `docs/development-workflow.md`.

Fase QA = jalankan test otomatis (unit/integration/E2E sesuai `.claude/rules/testing.md`) + test manual mengikuti journey di `docs/flows/user-flow.md`. **Test case baru dibuat di fase ini**, bukan di fase frontend/backend/integrasi. Acuan: `.claude/rules/testing.md`, `docs/flows/user-flow.md`.

## Modul Auth
- [x] Test case: registrasi (role Owner/Renter, validasi input)
- [x] Test case: login (kredensial valid/invalid)
- [x] Test case: role guard (akses dashboard sesuai role, ditolak kalau salah role)
- [x] Test case: edit profil
- [x] Test manual: journey auth end-to-end sesuai `docs/flows/user-flow.md`

## Modul Barang (Item)
- [x] Test case: CRUD barang (tambah, edit, nonaktifkan) termasuk upload foto
- [x] Test case: Browse & Discovery (filter kategori, rentang harga, sort)
- [x] Test case: detail barang (rating rata-rata, tombol ajukan sewa)
- [ ] Test manual: journey Barang end-to-end

## Modul Booking
- [x] Test case: request sewa (BR1 lock ketersediaan, validasi rentang tanggal)
- [x] Test case: status machine (PENDING → APPROVED → ACTIVE → COMPLETED, approve/reject)
- [x] Test case: `BookingStatusBadge` mapping warna sesuai `docs/design-system.md`
- [ ] Test manual: journey Booking end-to-end

## Modul Payment Tracking
- [x] Test case: update status pembayaran (LUNAS/BELUM_LUNAS) + catatan metode
- [x] Test case: konsistensi status pembayaran antara tampilan Owner & Renter
- [ ] Test manual: journey Payment Tracking end-to-end

## Modul History
- [ ] Test case: riwayat transaksi per user (filter status, urut tanggal)
- [ ] Test case: riwayat transaksi per barang (khusus Owner)
- [ ] Test manual: journey History end-to-end

## Modul Reminder
- [ ] Test case: reminder H-1 & overdue (job worker mengirim notifikasi tepat waktu)
- [ ] Test case: notifikasi in-app (badge/counter, list, mark as read)
- [ ] Test case: no duplicate reminder email (lihat `docs/decision-log.md` kalau ada ADR terkait)
- [ ] Test manual: journey Reminder end-to-end

## Modul Rating/Review
- [ ] Test case: form rating & komentar hanya muncul untuk booking COMPLETED
- [ ] Test case: kalkulasi rata-rata rating di halaman detail barang
- [ ] Test manual: journey Rating/Review end-to-end

## Modul Admin
- [ ] Test case: nonaktifkan user
- [ ] Test case: nonaktifkan barang paksa
- [ ] Test case: monitoring booking (read-only, tidak bisa diubah admin)
- [ ] Test manual: journey Admin end-to-end

## QA Menyeluruh (Periode 17)
- [ ] Regression test seluruh modul (unit + integration + E2E)
- [ ] Security hardening checklist sesuai `docs/technical-spec.md`
- [ ] Test manual seluruh journey utama di `docs/flows/user-flow.md`
- [ ] Responsive check (mobile/tablet/desktop) di seluruh halaman utama

## Backlog / Temuan
_(catat di sini kebutuhan/bug di luar fokus periode yang sedang berjalan — jangan langsung dikerjakan)_

- **E2E lintas modul: rate limit registrasi (5/menit/IP, `src/lib/rate-limit.ts`) memicu kegagalan spurious saat seluruh suite `e2e/**` dijalankan bersamaan (bukan per file).** Setiap file `e2e/*-flow.spec.ts` melakukan beberapa kali `POST /api/v1/auth/register` dari IP dev-server yang sama; kalau total registrasi lintas file dalam window 60 detik yang sama melebihi 5, test berikutnya gagal di step "Daftar" (tetap di `/register`, bukan redirect ke `/login`) meski tidak ada bug produk. Dikonfirmasi selama QA Modul Booking: `e2e/booking-flow.spec.ts` lolos konsisten saat dijalankan sendiri, tapi gagal (bersama file lain) saat seluruh suite dijalankan berturut-turut dalam satu menit yang sama. Tidak diperbaiki di sini (di luar fokus QA Booking) — perlu didiskusikan: naikkan limit khusus test env, atau jalankan `test:e2e` per file/dengan jeda di CI.

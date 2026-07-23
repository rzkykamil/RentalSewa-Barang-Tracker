# Todo — QA

Living document. Centang item selesai, tambahkan item baru saat muncul. Urutan mengikuti jadwal fokus di `docs/development-workflow.md`.

Fase QA = jalankan test otomatis (unit/integration/E2E sesuai `.claude/rules/testing.md`) + test manual mengikuti journey di `docs/flows/user-flow.md`. **Test case baru dibuat di fase ini**, bukan di fase frontend/backend/integrasi. Acuan: `.claude/rules/testing.md`, `docs/flows/user-flow.md`.

## Modul Auth
- [ ] Test case: registrasi (role Owner/Renter, validasi input)
- [ ] Test case: login (kredensial valid/invalid)
- [ ] Test case: role guard (akses dashboard sesuai role, ditolak kalau salah role)
- [ ] Test case: edit profil
- [ ] Test manual: journey auth end-to-end sesuai `docs/flows/user-flow.md`

## Modul Barang (Item)
- [ ] Test case: CRUD barang (tambah, edit, nonaktifkan) termasuk upload foto
- [ ] Test case: Browse & Discovery (filter kategori, rentang harga, sort)
- [ ] Test case: detail barang (rating rata-rata, tombol ajukan sewa)
- [ ] Test manual: journey Barang end-to-end

## Modul Booking
- [ ] Test case: request sewa (BR1 lock ketersediaan, validasi rentang tanggal)
- [ ] Test case: status machine (PENDING → APPROVED → ACTIVE → COMPLETED, approve/reject)
- [ ] Test case: `BookingStatusBadge` mapping warna sesuai `docs/design-system.md`
- [ ] Test manual: journey Booking end-to-end

## Modul Payment Tracking
- [ ] Test case: update status pembayaran (LUNAS/BELUM_LUNAS) + catatan metode
- [ ] Test case: konsistensi status pembayaran antara tampilan Owner & Renter
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

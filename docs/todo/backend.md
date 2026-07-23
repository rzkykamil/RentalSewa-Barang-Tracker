# Todo — Backend

Living document. Centang item selesai, tambahkan item baru saat muncul. Urutan mengikuti jadwal fokus di `docs/development-workflow.md`.

## Foundation
- [x] Setup Prisma schema awal (`User` enum role) sesuai `docs/database-design.md`
- [x] Setup NextAuth credentials provider + JWT session strategy
- [x] Middleware role guard (`middleware.ts`) sesuai `docs/flows/auth-permission-flow.md`
- [x] Seed data awal (admin, owner, renter contoh) — perlu dijalankan manual (`npm run db:seed`) oleh user, belum dieksekusi otomatis

## Modul Auth
- [x] Endpoint `POST /api/v1/auth/register` (hash password, validasi role)
- [x] Endpoint `GET/PATCH /api/v1/auth/me`
- [x] Rate limiting endpoint login/register

## Modul Barang (Item)
- [x] Prisma schema `Item` + `ItemPhoto` + migration
- [x] Endpoint `POST/PATCH/DELETE /api/v1/items` (validasi ownership)
- [x] Endpoint `GET /api/v1/items` (filter kategori/harga/status, pagination)
- [x] Endpoint `GET /api/v1/items/:id` (include foto + rating rata-rata)
- [x] Handler upload foto ke filesystem lokal (validasi tipe & ukuran file)

## Modul Booking
- [x] Prisma schema `Booking` + migration + index komposit `(item_id, status)`
- [x] Endpoint `POST /api/v1/bookings` (validasi tanggal, hitung total_price sesuai BR2)
- [x] Endpoint `PATCH /api/v1/bookings/:id/approve` (implementasi BR1: lock item + auto-reject request lain, dalam transaction Prisma)
- [x] Endpoint `PATCH /api/v1/bookings/:id/reject`
- [x] Endpoint `PATCH /api/v1/bookings/:id/activate`
- [x] Endpoint `PATCH /api/v1/bookings/:id/complete` (kembalikan item ke TERSEDIA)
- [ ] Unit test business rules BR1–BR2 di service layer

## Modul Payment Tracking
- [ ] Prisma schema `Payment` + migration
- [ ] Endpoint `GET/PATCH /api/v1/bookings/:id/payment`

## Modul History
- [ ] Endpoint `GET /api/v1/history/me` (gabungan booking sbg Owner & Renter, terurut tanggal)
- [ ] Endpoint `GET /api/v1/items/:id/bookings`

## Modul Reminder
- [ ] Prisma schema `ReminderLog` + unique constraint `(booking_id, type)`
- [ ] `worker/reminder-job.ts`: query booking ACTIVE mendekati/lewat `end_date`
- [ ] Integrasi email client (SMTP/Resend) untuk kirim reminder
- [ ] Job overdue: ubah status booking → LATE, item → TELAT_KEMBALI
- [ ] Setup scheduler (cron container) menjalankan job tiap 15 menit
- [ ] Unit test BR5 (idempoten, tidak kirim reminder duplikat)

## Modul Rating/Review
- [ ] Prisma schema `Review` + migration (unique per booking)
- [ ] Endpoint `POST /api/v1/bookings/:id/review` (validasi BR4: hanya booking COMPLETED)
- [ ] Endpoint `GET /api/v1/items/:id/reviews`

## Modul Admin
- [ ] Endpoint `GET /api/v1/admin/users`, `PATCH .../deactivate`
- [ ] Endpoint `GET /api/v1/admin/items`, `PATCH .../deactivate`
- [ ] Endpoint `GET /api/v1/admin/bookings`

## Infrastruktur & Hardening
- [ ] Docker Compose: service `app`, `worker`, `db`, `reverse-proxy` sesuai `docs/flows/system-architecture.md`
- [ ] CI pipeline: lint → test → build (lihat `docs/technical-spec.md`)
- [ ] Security checklist: validasi input Zod di semua route, dependency scanning
- [ ] Structured logging (JSON) untuk API & worker

## Backlog / Temuan
_(catat di sini kebutuhan/bug di luar fokus periode yang sedang berjalan — jangan langsung dikerjakan)_

- **Belum ada endpoint frontend-facing untuk notifikasi in-app:** `docs/api-spec.md` §Reminder hanya mendefinisikan `POST /internal/reminders/run` (server-only, dipicu scheduled job) — tidak ada endpoint `GET` yang bisa dipanggil dashboard Owner/Renter untuk mengambil daftar reminder in-app (badge/counter & halaman Notifikasi). Ditemukan saat mengerjakan frontend Modul Reminder (`src/lib/mock/reminders.ts` menurunkan reminder H-1/overdue langsung dari `MOCK_BOOKINGS` di client, bukan dari `ReminderLog`). Perlu ditambahkan mis. `GET /api/v1/reminders/me` (scoped ke user login, gabungan sebagai Owner & Renter) saat migrasi Modul Reminder backend dikerjakan — sekalian dipertimbangkan apakah butuh state "sudah dibaca" (`reminder_logs` saat ini tidak punya kolom tsb).

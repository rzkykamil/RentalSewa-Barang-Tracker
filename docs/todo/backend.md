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
- [x] Prisma schema `Payment` + migration
- [x] Endpoint `GET/PATCH /api/v1/bookings/:id/payment`

## Modul History
- [x] Endpoint `GET /api/v1/history/me` (gabungan booking sbg Owner & Renter, terurut tanggal)
- [x] Endpoint `GET /api/v1/items/:id/bookings`

## Modul Reminder
- [x] Prisma schema `ReminderLog` + unique constraint `(booking_id, type)`
- [x] `worker/reminder-job.ts`: query booking ACTIVE mendekati/lewat `end_date`
- [x] Integrasi email client (SMTP/Resend) untuk kirim reminder
- [x] Job overdue: ubah status booking → LATE, item → TELAT_KEMBALI
- [x] Endpoint `POST /api/v1/internal/reminders/run` (secret header, panggil service layer)
- [x] Setup scheduler (cron container) menjalankan job tiap 15 menit — lihat service `worker` di `docker-compose.yml`/`Dockerfile` (loop + `sleep 900`, bukan cron daemon terpisah, lihat `docs/decision-log.md`)
- [ ] Unit test BR5 (idempoten, tidak kirim reminder duplikat)

## Modul Rating/Review
- [x] Prisma schema `Review` + migration (unique per booking)
- [x] Endpoint `POST /api/v1/bookings/:id/review` (validasi BR4: hanya booking COMPLETED)
- [x] Endpoint `GET /api/v1/items/:id/reviews`

## Modul Admin
- [x] Endpoint `GET /api/v1/admin/users`, `PATCH .../deactivate`
- [x] Endpoint `GET /api/v1/admin/items`, `PATCH .../deactivate`
- [x] Endpoint `GET /api/v1/admin/bookings`

## Infrastruktur & Hardening
- [x] Docker Compose: service `app`, `worker`, `db`, `reverse-proxy` sesuai `docs/flows/system-architecture.md` (`docker-compose.yml`, `Dockerfile`, `Caddyfile`)
- [x] CI pipeline: lint → test → build (`.github/workflows/ci.yml`)
- [x] Security checklist: validasi input Zod di semua route (sudah terpenuhi sejak modul-modul sebelumnya, diverifikasi ulang di sesi ini — endpoint tanpa body/query, mis. `.../approve`, tidak butuh Zod karena hanya baca `id` dari path), dependency scanning (`.github/dependabot.yml` + `npm audit` di CI, non-blocking untuk saat ini — lihat Backlog & `docs/decision-log.md`)
- [x] Structured logging (JSON) untuk API & worker (`src/lib/logger.ts`, dipakai di seluruh `src/app/api/v1/**`, `worker/reminder-job.ts`, dan aksi bisnis penting di `src/modules/bookings/`, `src/modules/reminders/`)

## Backlog / Temuan
_(catat di sini kebutuhan/bug di luar fokus periode yang sedang berjalan — jangan langsung dikerjakan)_

- **Belum ada endpoint frontend-facing untuk notifikasi in-app:** `docs/api-spec.md` §Reminder hanya mendefinisikan `POST /internal/reminders/run` (server-only, dipicu scheduled job) — tidak ada endpoint `GET` yang bisa dipanggil dashboard Owner/Renter untuk mengambil daftar reminder in-app (badge/counter & halaman Notifikasi). Ditemukan saat mengerjakan frontend Modul Reminder (`src/lib/mock/reminders.ts` menurunkan reminder H-1/overdue langsung dari `MOCK_BOOKINGS` di client, bukan dari `ReminderLog`). Perlu ditambahkan mis. `GET /api/v1/reminders/me` (scoped ke user login, gabungan sebagai Owner & Renter) saat migrasi Modul Reminder backend dikerjakan — sekalian dipertimbangkan apakah butuh state "sudah dibaca" (`reminder_logs` saat ini tidak punya kolom tsb).
- **`npm audit` di CI menemukan 19 advisory (1 critical, 13 high, 5 moderate)** pada transitive dependency (`sharp`, `postcss` lewat rantai `next`; `uuid`, `valibot`). Fix otomatis (`npm audit fix --force`) akan bump `next` ke versi di luar range yang dinyatakan project — bukan keputusan yang aman diambil sepihak tanpa user, jadi step `dependency-audit` di `.github/workflows/ci.yml` sengaja `continue-on-error` dulu (lihat `docs/decision-log.md` entry Infrastruktur & Hardening). Perlu ditriase manual (upgrade terkontrol atau terima risiko) sebelum audit ini bisa jadi gate CI yang sesungguhnya.

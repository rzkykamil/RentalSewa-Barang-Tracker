# Todo — Backend

Living document. Centang item selesai, tambahkan item baru saat muncul. Urutan mengikuti jadwal fokus di `docs/development-workflow.md`.

## Foundation
- [ ] Setup Prisma schema awal (`User` enum role) sesuai `docs/database-design.md`
- [ ] Setup NextAuth credentials provider + JWT session strategy
- [ ] Middleware role guard (`middleware.ts`) sesuai `docs/flows/auth-permission-flow.md`
- [ ] Seed data awal (admin, owner, renter contoh)

## Modul Auth
- [ ] Endpoint `POST /api/v1/auth/register` (hash password, validasi role)
- [ ] Endpoint `GET/PATCH /api/v1/auth/me`
- [ ] Rate limiting endpoint login/register

## Modul Barang (Item)
- [ ] Prisma schema `Item` + `ItemPhoto` + migration
- [ ] Endpoint `POST/PATCH/DELETE /api/v1/items` (validasi ownership)
- [ ] Endpoint `GET /api/v1/items` (filter kategori/harga/status, pagination)
- [ ] Endpoint `GET /api/v1/items/:id` (include foto + rating rata-rata)
- [ ] Handler upload foto ke filesystem lokal (validasi tipe & ukuran file)

## Modul Booking
- [ ] Prisma schema `Booking` + migration + index komposit `(item_id, status)`
- [ ] Endpoint `POST /api/v1/bookings` (validasi tanggal, hitung total_price sesuai BR2)
- [ ] Endpoint `PATCH /api/v1/bookings/:id/approve` (implementasi BR1: lock item + auto-reject request lain, dalam transaction Prisma)
- [ ] Endpoint `PATCH /api/v1/bookings/:id/reject`
- [ ] Endpoint `PATCH /api/v1/bookings/:id/activate`
- [ ] Endpoint `PATCH /api/v1/bookings/:id/complete` (kembalikan item ke TERSEDIA)
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

- **`bookings.activated_at` kolom belum ada di `docs/database-design.md`:** endpoint `PATCH /api/v1/bookings/:id/activate` sudah direncanakan di atas, tapi tabel `bookings` di `docs/database-design.md` §2 hanya punya `approved_at / rejected_at / completed_at` — tidak ada timestamp khusus transisi APPROVED → ACTIVE. Ditemukan saat mengerjakan frontend Modul Booking (mock data `src/lib/mock/bookings.ts` menambahkan field `activatedAt` supaya timeline UI PENDING → APPROVED → ACTIVE → COMPLETED punya sumber data konsisten). Perlu ditambahkan ke skema saat migrasi Modul Booking dikerjakan.

# Rental Sewa Barang Tracker

Platform web untuk sewa-menyewa barang antar individu: pemilik barang (Owner) mengelola listing, penyewa (Renter) mengajukan booking, dengan pelacakan status barang, pembayaran manual, reminder tenggat otomatis, riwayat transaksi, dan rating/review.

Dokumentasi perencanaan lengkap ada di `docs/` (lihat `docs/prd.md` untuk requirements & scope). Panduan kerja untuk Claude Code ada di `CLAUDE.md` dan `.claude/`.

## Prasyarat

- Node.js 20+
- PostgreSQL 15+ (lokal atau via Docker)
- npm

## Setup & Menjalankan Lokal

1. Clone repo, install dependency:
   ```
   npm install
   ```
2. Salin `.env.example` ke `.env.local`, isi semua environment variable (lihat komentar di file tsb untuk penjelasan tiap variable).
3. Jalankan PostgreSQL lokal (mis. via `docker compose up db`), lalu jalankan migration:
   ```
   npx prisma migrate dev
   ```
4. (Opsional) isi data contoh:
   ```
   npx prisma db seed
   ```
5. Jalankan aplikasi:
   ```
   npm run dev
   ```
6. Buka `http://localhost:3000`.

## Menjalankan Reminder Job Worker (lokal)

```
npm run worker
```

Worker ini mengecek booking yang mendekati/lewat tenggat dan mengirim email reminder — di production dijalankan sebagai container terjadwal (cron), lihat `docs/flows/system-architecture.md`.

## Test

```
npm run test        # unit + integration
npm run test:e2e     # end-to-end (Playwright)
```

## Struktur Dokumentasi

- `docs/prd.md` — requirements produk lengkap.
- `docs/database-design.md` — skema database & ERD.
- `docs/api-spec.md` — kontrak API.
- `docs/technical-spec.md` — arsitektur & keputusan teknis.
- `docs/design-system.md` — panduan UI.
- `docs/decision-log.md` — jejak keputusan arsitektur.
- `docs/development-workflow.md` & `docs/todo/` — alur kerja development & checklist tugas.

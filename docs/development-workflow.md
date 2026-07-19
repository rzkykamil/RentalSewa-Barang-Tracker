# Development Workflow — Rental Sewa Barang Tracker

Development berjalan **bertahap per fokus** — satu periode satu fokus, bukan paralel. Siklus per modul/fitur:

```
frontend (UI + mock data) → backend (API + DB) → integrasi: perbarui frontend
pakai API asli → fixing bugs → QA (test manual + otomatis) → update docs & todo
```

## 1. Penjelasan Tiap Fase

### Fase Frontend (UI + mock data)
- **Apa yang dikerjakan:** komponen UI, halaman, form, state management client, memakai data mock/statis (belum menyentuh API asli).
- **Definition of done:** semua state UI (loading, empty, error, sukses) untuk modul tsb sudah ada secara visual; sesuai `docs/design-system.md`.
- **Dokumen acuan:** `docs/design-system.md`, `docs/flows/user-flow.md`, `docs/prd.md` (user stories modul terkait).

### Fase Backend (API + DB)
- **Apa yang dikerjakan:** schema Prisma/migration, service layer, route handler sesuai `docs/api-spec.md`, business rules (BR di `docs/prd.md`).
- **Definition of done:** endpoint modul tsb lengkap, tervalidasi (unit + integration test service layer), sesuai kontrak di `docs/api-spec.md`.
- **Dokumen acuan:** `docs/database-design.md`, `docs/api-spec.md`, `docs/technical-spec.md`.

### Fase Integrasi
- **Apa yang dikerjakan:** ganti mock data di frontend dengan panggilan API asli, tangani state loading/error nyata, sesuaikan kontrak kalau ada mismatch.
- **Definition of done:** halaman modul tsb berfungsi end-to-end melawan API & DB asli (bukan mock).
- **Dokumen acuan:** `docs/api-spec.md` (kontrak), `docs/flows/*`.

### Fase Fixing Bugs
- **Apa yang dikerjakan:** perbaiki bug yang muncul selama integrasi, **hanya untuk modul yang sedang fokus** — temuan di modul lain dicatat ke `docs/todo/`, tidak langsung dikerjakan.
- **Definition of done:** tidak ada bug blocking yang diketahui untuk modul tsb.

### Fase QA
- **Apa yang dikerjakan:** jalankan test otomatis (unit/integration/E2E sesuai `.claude/rules/testing.md`) + test manual mengikuti journey di `docs/flows/user-flow.md`.
- **Definition of done:** semua test lolos, journey utama modul tsb sudah dicoba manual minimal sekali.
- **Dokumen acuan:** `.claude/rules/testing.md`, `docs/flows/user-flow.md`.

### Fase Update Docs & Todo
- **Apa yang dikerjakan:** perbarui `docs/` yang relevan kalau ada keputusan/skema berubah selama modul dikerjakan, centang item selesai di `docs/todo/`, tambah entry baru di `docs/decision-log.md` kalau ada keputusan penting.
- **Definition of done:** tidak ada dokumen yang basi terhadap kode yang baru selesai.

## 2. Jadwal Fokus per Periode (berdasarkan Milestone di `docs/prd.md`)

| Periode | Fokus | Modul |
|---|---|---|
| 1 | Frontend | Auth (login/register UI), shell dashboard per role |
| 2 | Backend | Auth (NextAuth, schema User), role guard middleware |
| 3 | Integrasi + Bugfix + QA | Auth end-to-end |
| 4 | Frontend | Barang (form CRUD, browse & discovery UI) |
| 5 | Backend | Barang (schema Item/ItemPhoto, endpoint CRUD + filter) |
| 6 | Integrasi + Bugfix + QA | Barang end-to-end |
| 7 | Frontend | Booking (form request, dashboard approve/reject, status timeline) |
| 8 | Backend | Booking (schema Booking, status machine, BR1 lock ketersediaan) |
| 9 | Integrasi + Bugfix + QA | Booking end-to-end |
| 10 | Frontend | Payment tracking UI + halaman History |
| 11 | Backend | Payment schema/endpoint + query history |
| 12 | Integrasi + Bugfix + QA | Payment & History end-to-end |
| 13 | Frontend | Reminder (notifikasi in-app) + Review UI |
| 14 | Backend | Reminder job worker + Review schema/endpoint |
| 15 | Integrasi + Bugfix + QA | Reminder & Review end-to-end |
| 16 | Frontend + Backend | Panel Admin (gabung karena scope kecil) |
| 17 | QA menyeluruh + Security hardening | Seluruh aplikasi, sesuai security checklist di `docs/technical-spec.md` |

Urutan ini bisa disesuaikan (misal digabung/dipecah) sesuai kecepatan aktual, tapi **disiplin satu fokus per periode tetap dipertahankan**.

## 3. Aturan Disiplin Fokus

- Saat fase **frontend**, jangan mencicil kerja **backend** (dan sebaliknya) — kalau menemukan kebutuhan di luar fokus (misal saat frontend nemu kebutuhan endpoint baru), catat di `docs/todo/backend.md` bagian "Backlog / Temuan", jangan langsung diimplementasikan.
- Kalau nemu bug di modul yang sudah "selesai" sebelumnya saat sedang fokus modul lain, catat ke `docs/todo/` sesuai sisi (frontend/backend), tangani di periode fixing-bugs modul itu sendiri atau jadikan hotfix terpisah kalau blocking parah (didiskusikan dulu, bukan otomatis).

## 4. Checklist Penutup Tiap Siklus

- [ ] Semua bug blocking modul ini sudah beres.
- [ ] Test (unit/integration/E2E) untuk modul ini lolos.
- [ ] `docs/` yang relevan (PRD scope, database-design, api-spec, technical-spec) sudah diperbarui kalau ada perubahan.
- [ ] `docs/decision-log.md` terisi entry baru kalau ada keputusan arsitektur baru selama siklus ini.
- [ ] `docs/todo/frontend.md` dan/atau `docs/todo/backend.md` sudah dicentang untuk item selesai, dan temuan baru sudah dicatat di bagian Backlog.

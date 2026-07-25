# API Specification — Rental Sewa Barang Tracker

## 1. Konvensi Umum

- **Base URL:** `/api/v1` (route handler Next.js App Router, `app/api/v1/**/route.ts`).
- **Versioning:** prefix `v1` di path; breaking change berikutnya jadi `/api/v2`, versi lama dipertahankan selama masa transisi yang diumumkan di `decision-log.md`.
- **Format response sukses:**
  ```
  { "data": <payload>, "meta"?: { pagination info } }
  ```
- **Format response error:**
  ```
  { "error": { "code": "STRING_CODE", "message": "human readable", "details"?: [...] } }
  ```
- **Pagination:** query param `page` (default 1) & `limit` (default 20, max 100), response `meta.pagination = { page, limit, total, totalPages }`.
- **Filtering/sorting:** query param eksplisit per endpoint (misal `?category=&status=&sort=price_asc`), didokumentasikan per endpoint.
- **Auth:** session cookie dari NextAuth (credentials provider); endpoint yang butuh login mengembalikan `401 UNAUTHENTICATED` kalau tidak ada sesi valid, `403 FORBIDDEN` kalau sesi valid tapi role tidak sesuai.

## 2. Konvensi Status & Error Code

| HTTP Status | Kapan Dipakai |
|---|---|
| 200 | Sukses (GET, PATCH, POST aksi non-create) |
| 201 | Resource baru berhasil dibuat |
| 400 | `VALIDATION_ERROR` — input tidak valid |
| 401 | `UNAUTHENTICATED` — belum login |
| 403 | `FORBIDDEN` — login tapi tidak punya izin (role/ownership salah) |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` — misal barang sudah tidak `TERSEDIA` saat request diajukan (BR1) |
| 422 | `BUSINESS_RULE_VIOLATION` — melanggar business rule (misal review untuk booking belum `COMPLETED`) |
| 429 | `RATE_LIMITED` — terlalu banyak percobaan dalam jangka waktu tertentu (mis. login/register, lihat `docs/technical-spec.md` §6) |
| 500 | `INTERNAL_ERROR` |

## 3. Endpoint per Modul

### Auth (`/api/v1/auth`)
| Method | Path | Deskripsi | Role |
|---|---|---|---|
| POST | `/auth/register` | Registrasi user baru (pilih role Owner/Renter) | Public |
| GET | `/auth/me` | Ambil data profil user yang sedang login | Semua role login |
| PATCH | `/auth/me` | Update profil (nama, phone, avatar) | Semua role login |

Login & logout **tidak** punya route handler sendiri di `/api/v1/auth/**` — keduanya ditangani oleh NextAuth's built-in catch-all route `/api/auth/[...nextauth]` (credentials `signIn`/`signOut`), bukan endpoint versioned kustom. Implementasi: `src/app/api/auth/[...nextauth]/route.ts`.

### Items (`/api/v1/items`)
| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/items` | List barang, filter `category`, `status=TERSEDIA` default, `minPrice`/`maxPrice`, sort harga | Public |
| GET | `/items/:id` | Detail barang + foto + rating rata-rata | Public |
| POST | `/items` | Buat barang baru (multipart form utk foto) | Owner |
| PATCH | `/items/:id` | Update barang milik sendiri | Owner (pemilik item) |
| DELETE | `/items/:id` | Nonaktifkan barang (`status=NONAKTIF`, bukan hard delete) | Owner (pemilik item) |
| GET | `/items/:id/bookings` | Riwayat booking untuk barang tsb | Owner (pemilik item), Admin |

### Bookings (`/api/v1/bookings`)
| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/bookings` | List booking milik sendiri (Renter: sbg penyewa; Owner: utk barang miliknya) | Renter, Owner |
| POST | `/bookings` | Ajukan request sewa (`itemId`, `startDate`, `endDate`) | Renter |
| GET | `/bookings/:id` | Detail booking | Renter/Owner terkait, Admin |
| PATCH | `/bookings/:id/approve` | Owner menyetujui request → status `APPROVED`, item → `DISEWA`, request lain auto-`REJECTED` (BR1) | Owner (pemilik item) |
| PATCH | `/bookings/:id/reject` | Owner menolak request → status `REJECTED` | Owner (pemilik item) |
| PATCH | `/bookings/:id/activate` | Tandai booking mulai aktif (barang diserahterimakan) | Owner (pemilik item) |
| PATCH | `/bookings/:id/complete` | Tandai selesai (barang dikembalikan) → item → `TERSEDIA` | Owner (pemilik item) |

### Payments (`/api/v1/bookings/:id/payment`)
| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/bookings/:id/payment` | Lihat status pembayaran booking | Renter/Owner terkait |
| PATCH | `/bookings/:id/payment` | Tandai status pembayaran (`LUNAS`/`BELUM_LUNAS`) + catatan metode | Owner (pemilik item) |

`PATCH` mengembalikan `422 BUSINESS_RULE_VIOLATION` kalau booking belum pernah `APPROVED` — belum ada row `Payment` untuk ditandai (row dibuat saat approve, lihat `approveBooking`).

### Reviews (`/api/v1/bookings/:id/review`)
| Method | Path | Deskripsi | Role |
|---|---|---|---|
| POST | `/bookings/:id/review` | Beri rating (1-5) + komentar — hanya jika booking `COMPLETED` (BR4) | Renter (penyewa booking tsb) |
| GET | `/items/:id/reviews` | List review untuk suatu barang | Public |

### History (`/api/v1/history`)
| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/history/me` | Riwayat transaksi lengkap milik user (semua booking, status apapun) | Renter, Owner |

### Admin (`/api/v1/admin`)
| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/admin/users` | List seluruh user | Admin |
| PATCH | `/admin/users/:id/deactivate` | Nonaktifkan akun user | Admin |
| GET | `/admin/items` | List seluruh barang (termasuk nonaktif) | Admin |
| PATCH | `/admin/items/:id/deactivate` | Paksa nonaktifkan barang | Admin |
| GET | `/admin/bookings` | List seluruh booking untuk monitoring | Admin |

`PATCH /admin/users/:id/deactivate` menolak self-deactivation (`422 BUSINESS_RULE_VIOLATION`) — Admin tidak bisa menonaktifkan akunnya sendiri, supaya tidak terkunci keluar sendiri.

Belum ada endpoint reaktivasi user (`PATCH /admin/users/:id/activate`) — lihat `docs/todo/integrasi.md` Backlog/Temuan untuk diskusi apakah moderasi memang satu arah.

### Reminder (internal, dipicu scheduled job — bukan dipanggil langsung dari frontend)
| Method | Path | Deskripsi | Role |
|---|---|---|---|
| POST | `/internal/reminders/run` | Trigger job pengecekan H-1 & overdue, kirim email, tulis `ReminderLog` | Server-only (secret header/token, bukan role user) |

Detail arsitektur job ini ada di `docs/technical-spec.md` (strategi background job).

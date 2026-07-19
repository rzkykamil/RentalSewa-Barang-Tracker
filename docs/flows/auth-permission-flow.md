# Auth & Permission Flow — Rental Sewa Barang Tracker

## 1. Flow Autentikasi

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant N as Next.js App (NextAuth)
    participant DB as PostgreSQL

    U->>N: POST /api/v1/auth/register (name, email, password, role)
    N->>N: Validasi input + hash password (bcrypt)
    N->>DB: INSERT user (role=OWNER|RENTER)
    DB-->>N: user created
    N-->>U: 201 Created

    U->>N: Login (email, password) via NextAuth credentials provider
    N->>DB: SELECT user WHERE email=?
    DB-->>N: user row (password_hash)
    N->>N: Bandingkan password dgn hash
    alt Valid
        N->>N: Buat session (JWT strategy, disimpan di cookie httpOnly)
        N-->>U: Set-Cookie session, redirect ke dashboard sesuai role
    else Invalid
        N-->>U: 401 UNAUTHENTICATED
    end

    U->>N: Request halaman terproteksi (cookie disertakan)
    N->>N: Middleware verifikasi session token
    N-->>U: Render halaman / 401 kalau sesi invalid/expired
```

- **Strategi sesi:** JWT strategy NextAuth (session token di cookie httpOnly, tidak butuh lookup DB tiap request) dengan `role` disertakan di JWT payload agar middleware bisa memeriksa tanpa query tambahan.
- **Refresh:** NextAuth JWT diperpanjang otomatis selama masih dalam rolling session window (default 30 hari, dikonfigurasi di `technical-spec.md`); tidak ada refresh token terpisah karena memakai session strategy, bukan pure API token.

## 2. Flow Otorisasi (Role Guard)

```mermaid
flowchart TD
    A[Request masuk ke route] --> B{Ada session valid?}
    B -- Tidak --> C[401 UNAUTHENTICATED]
    B -- Ya --> D{Route butuh role tertentu?}
    D -- Tidak, publik utk user login --> H[Lanjutkan ke handler]
    D -- Ya --> E{role user cocok?}
    E -- Tidak --> F[403 FORBIDDEN]
    E -- Ya --> G{Route butuh cek kepemilikan resource? e.g item milik Owner ini}
    G -- Ya, tapi bukan pemilik --> F
    G -- Ya dan pemilik / tidak perlu cek --> H
```

- **Middleware layer (`middleware.ts`):** mengecek keberadaan & validitas session sebelum request mencapai route group `(dashboard)` — menolak dengan redirect ke `/login` untuk halaman, atau `401` untuk API.
- **Role guard per route group:** route dikelompokkan per role di App Router (`app/(owner)/**`, `app/(renter)/**`, `app/(admin)/**`), masing-masing punya layout yang memeriksa `session.user.role` sesuai permission matrix di `docs/prd.md`.
- **Ownership check:** untuk aksi seperti update barang atau approve booking, handler API tetap wajib memverifikasi `resource.owner_id === session.user.id` di level service/query — role guard saja tidak cukup karena satu role (Owner) bisa punya banyak user berbeda.
- Detail konvensi implementasi (nama helper, lokasi kode) ada di `docs/technical-spec.md` dan `.claude/rules/api-design.md`.

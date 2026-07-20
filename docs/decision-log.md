# Decision Log — Rental Sewa Barang Tracker

Log keputusan arsitektur penting (format ADR ringan). Setiap entry baru ditambahkan di commit yang sama dengan perubahan terkait — lihat `.claude/rules/decision-logging.md`.

## [2026-07-20] Role tunggal per user (Owner / Renter / Admin), bukan dual-role bebas

- **Konteks:** brief awal menyebut "auth multi-role (pemilik barang & penyewa)" — perlu diputuskan apakah satu akun bisa jadi Owner sekaligus Renter secara bersamaan (model marketplace bebas ala Airbnb) atau role tetap per akun.
- **Keputusan:** setiap user punya satu `role` eksplisit (`OWNER`, `RENTER`, atau `ADMIN`) yang dipilih saat registrasi.
- **Alasan:** brief eksplisit memisahkan tanggung jawab "Pemilik: CRUD barang" vs "Penyewa: browse & request" sebagai dua peran berbeda. Role tunggal membuat RBAC (permission matrix, route group per role) jauh lebih sederhana untuk fase awal. Opsi dual-role (satu akun bisa keduanya) ditolak untuk Phase 1 karena menambah kompleksitas UI (switch role) dan permission checking tanpa manfaat yang terbukti dibutuhkan di awal.
- **Dampak:** kalau nanti ada kebutuhan satu orang jadi Owner sekaligus Renter, perlu migrasi skema (`role` jadi relasi many-to-many atau array) — dicatat sebagai Phase 2 di `docs/prd.md`.

## [2026-07-20] Lock ketersediaan barang berbasis status tunggal, bukan kalender rentang tanggal

- **Konteks:** perlu mekanisme mencegah barang fisik yang sama disewa dua penyewa dalam rentang tanggal yang tumpang tindih.
- **Keputusan:** barang hanya menerima request baru saat `status = TERSEDIA`. Begitu satu request di-approve, `status` berubah `DISEWA` dan seluruh request `PENDING` lain utk barang yang sama otomatis `REJECTED` (BR1 di `docs/prd.md`).
- **Alasan:** jauh lebih sederhana diimplementasikan & dipahami user dibanding kalender ketersediaan berbasis rentang tanggal (yang butuh UI kalender, validasi overlap kompleks). Cukup untuk skala Phase 1 di mana satu barang biasanya hanya disewa oleh satu orang dalam satu waktu.
- **Alternatif ditolak:** kalender ketersediaan penuh (mendukung booking di masa depan yang tidak overlap dengan booking aktif saat ini) — ditunda ke Phase 2 karena menambah kompleksitas signifikan tanpa terbukti dibutuhkan di awal.
- **Dampak:** Owner tidak bisa menerima request untuk tanggal jauh di masa depan selagi barang masih `DISEWA` untuk booking saat ini, meski secara tanggal sebenarnya tidak overlap — trade-off yang disadari.

## [2026-07-20] Storage foto barang di filesystem lokal, bukan cloud storage

- **Konteks:** butuh tempat menyimpan foto barang yang diunggah Owner. Cloud storage (Vercel Blob/Cloudinary/Supabase Storage) lebih scalable, tapi butuh setup akun & biaya pihak ketiga tambahan.
- **Keputusan:** foto disimpan di filesystem lokal server (volume Docker persisten), bukan cloud storage.
- **Alasan:** menyederhanakan setup awal tanpa dependency pihak ketiga tambahan, sesuai preferensi eksplisit saat brief. Trade-off yang disadari dan diterima.
- **Dampak — PENTING:** karena filesystem lokal dipakai, **deployment production wajib ke VPS + Docker dengan volume persisten**, bukan platform serverless (Vercel/Netlify) yang filesystem-nya ephemeral. Ini membatasi opsi deployment sejak awal (lihat `docs/technical-spec.md` & `docs/flows/system-architecture.md`). Migrasi ke cloud storage dicatat sebagai kandidat Phase 3 di `docs/prd.md` kalau kebutuhan skalabilitas/serverless muncul.

## [2026-07-20] Payment tracking manual, tanpa payment gateway di Phase 1

- **Konteks:** brief menyebut "payment tracking (manual: lunas/belum dulu)" — payment gateway otomatis bukan kebutuhan awal.
- **Keputusan:** Owner menandai status pembayaran (`BELUM_LUNAS`/`LUNAS`) secara manual per booking, tanpa integrasi payment gateway.
- **Alasan:** mengurangi kompleksitas & biaya integrasi (biaya transaksi gateway, kepatuhan PCI, dsb) di fase awal saat volume transaksi masih kecil.
- **Dampak:** tidak ada jaminan otomatis bahwa pembayaran benar-benar terjadi (rawan human error/kecurangan pencatatan) — mitigasi lewat riwayat transaksi yang transparan & rating/review. Integrasi Midtrans/Xendit dicatat sebagai Phase 2 di `docs/prd.md`.

## [2026-07-20] Reminder via email + in-app, tanpa WhatsApp/SMS di Phase 1

- **Konteks:** brief menyebut "reminder otomatis mendekati/lewat tenggat" tanpa menspesifikasikan channel.
- **Keputusan:** reminder dikirim via email (SMTP/Resend) dan notifikasi in-app, dijalankan oleh scheduled job worker terpisah dari siklus request utama.
- **Alasan:** email tidak butuh biaya per-pesan dan setup pihak ketiga tambahan dibanding WhatsApp/SMS (Fonnte/Twilio), cukup untuk memenuhi kebutuhan reminder di fase awal.
- **Dampak:** efektivitas reminder bergantung pada seberapa sering user mengecek email — kandidat penambahan channel WhatsApp/SMS dicatat sebagai Phase 2 di `docs/prd.md` kalau data menunjukkan open-rate email rendah.

## [2026-07-20] Modular monolith, bukan microservices

- **Konteks:** perlu menentukan gaya arsitektur backend untuk skala target awal (50 barang, 20 transaksi/3 bulan).
- **Keputusan:** satu aplikasi Next.js (App Router) menangani frontend & backend, kode dipisah per domain modul dengan boundary jelas.
- **Alasan:** microservices penuh menambah beban operasional (deployment terpisah, network overhead) yang tidak sepadan dengan skala & ukuran tim saat ini.
- **Dampak:** kalau salah satu modul (misal reminder job) perlu di-scale independen di masa depan, migrasi ke service terpisah tetap dimungkinkan berkat pemisahan modul yang sudah rapi — dicatat di `docs/technical-spec.md`.

## [2026-07-20] Design tokens dasar ditambahkan lebih awal di `globals.css` (bukan menunggu item cross-cutting terpisah)

- **Konteks:** komponen `src/components/ui/*` (shadcn) sudah digenerate dan wajib dipakai (`bg-primary`, `bg-destructive`, `bg-card`, `ring-ring`, dsb.), tapi `src/app/globals.css` belum mendefinisikan CSS variable-nya (`docs/todo/frontend.md` "Setup design tokens" masih belum dicentang). Tanpa token, semua komponen UI (Button, Input, Card, Select, dsb.) render tanpa warna sama sekali.
- **Keputusan:** menambahkan `@theme` token minimal (background/foreground/primary/secondary/muted/accent/destructive/border/input/ring + light & dark) langsung saat mengerjakan modul Auth (Periode 1), sekaligus menambahkan token warna status (`--color-status-positive/pending/active/late/inactive`) sesuai palet di `docs/design-system.md` §2 supaya siap dipakai `BookingStatusBadge` nanti.
- **Alasan:** ini prasyarat teknis, bukan pekerjaan modul lain — tanpa token, komponen yang diwajibkan dipakai di modul Auth tidak bisa direview secara visual sama sekali. Warna brand primer dipilih biru (`oklch(0.5 0.19 255)`) sesuai opsi di design-system.md.
- **Dampak:** item cross-cutting "Setup design tokens" di `docs/todo/frontend.md` sudah sebagian terpenuhi oleh perubahan ini — perlu dicek ulang & disesuaikan (bukan dibuat dari nol) saat modul Barang/Booking mengerjakan komponen status & card lain yang mungkin butuh token tambahan.

## [2026-07-20] Prisma Client generator baru (`prisma-client`) dengan driver adapter `@prisma/adapter-pg`

- **Konteks:** setup awal project memakai Prisma versi terbaru (7.8.0). Generator client default di versi ini (`prisma-client`, output ke `src/generated/prisma`) tidak lagi menyertakan query engine binary bawaan — client mengharuskan driver adapter eksplisit untuk terhubung ke database, dan koneksi DB tidak lagi dibaca otomatis dari `datasource.url` di `schema.prisma` (dipindah ke `prisma.config.ts` untuk kebutuhan CLI).
- **Keputusan:** pakai `@prisma/adapter-pg` (driver adapter resmi untuk `pg`) di `src/lib/prisma.ts`, diinisialisasi dengan `connectionString: process.env.DATABASE_URL`. `prisma.config.ts` dibuat memuat env dari `.env.local` (bukan `.env`) supaya konsisten dengan konvensi project.
- **Alasan:** ini adalah perilaku default versi terbaru Prisma yang diminta (bukan pilihan opsional) — driver adapter adalah jalur resmi Prisma untuk Postgres di generator baru, dan `pg` adalah driver Node.js Postgres paling umum dipakai.
- **Dampak:** `pg` & `@prisma/adapter-pg` jadi dependency wajib (bukan hanya `@prisma/client`). Kalau nanti pindah ke provider serverless Postgres (mis. Neon/Supabase), adapter perlu diganti ke driver yang sesuai (`@prisma/adapter-neon`, dsb) — perubahan terisolasi di `src/lib/prisma.ts`.

## [2026-07-20] Mock booking data menambahkan timestamp `activatedAt` di luar skema `bookings` yang tercatat di `docs/database-design.md`

- **Konteks:** Modul Booking frontend butuh menampilkan timeline visual eksplisit PENDING → APPROVED → ACTIVE → COMPLETED (`docs/design-system.md` §1) berikut aksi Owner "tandai aktif" / "tandai selesai". Skema `bookings` di `docs/database-design.md` §2 hanya mendefinisikan `requested_at`, `approved_at`, `rejected_at`, `completed_at` — tidak ada kolom timestamp khusus untuk transisi APPROVED → ACTIVE, padahal endpoint `PATCH /api/v1/bookings/:id/activate` sudah direncanakan di `docs/todo/backend.md`.
- **Keputusan:** `src/lib/mock/bookings.ts` menambahkan field `activatedAt` (nullable) ke tipe `MockBooking`, di luar kolom yang tercatat saat ini di `docs/database-design.md`.
- **Alasan:** timeline UI perlu sumber data yang konsisten untuk menandai step "Berjalan" sebagai tercapai, dan business rule PRD (poin 6: "sistem harus mencatat setiap perubahan status booking dengan timestamp") mengisyaratkan transisi ke `ACTIVE` juga perlu dicatat waktunya, bukan hanya disimpulkan dari `status` saat ini.
- **Dampak:** ini murni keputusan data mock untuk fase frontend, belum mengubah `docs/database-design.md`. Ditandai di `docs/todo/backend.md` bagian Backlog/Temuan supaya kolom `activated_at` ditambahkan ke skema `bookings` saat migrasi Modul Booking backend dikerjakan.

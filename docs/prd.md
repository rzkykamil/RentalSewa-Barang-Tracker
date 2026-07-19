# Product Requirements Document — Rental Sewa Barang Tracker

## 1. Executive Summary

Rental Sewa Barang Tracker adalah platform web yang mempertemukan **pemilik barang** yang ingin menyewakan barangnya dengan **penyewa** yang membutuhkan barang tersebut untuk jangka waktu tertentu. Platform mengelola seluruh siklus penyewaan: listing barang, permintaan sewa, persetujuan, pelacakan status barang, pencatatan pembayaran manual, pengingat tenggat, hingga riwayat transaksi dan rating.

Ini adalah produk production-grade yang ditujukan untuk dipakai publik, bukan sekadar MVP — dikembangkan bertahap per modul (lihat `development-workflow.md`).

## 2. Problem Statement & Background

Transaksi sewa-menyewa barang antar individu/komunitas selama ini banyak dilakukan secara informal (chat pribadi, grup medsos), sehingga:
- Tidak ada pencatatan status barang yang jelas (sedang disewa siapa, kapan harus kembali).
- Tidak ada riwayat transaksi yang bisa dirujuk saat ada perselisihan.
- Tidak ada pengingat otomatis, sehingga keterlambatan pengembalian sering terjadi tanpa peringatan.
- Tidak ada mekanisme reputasi (rating) untuk menilai kredibilitas penyewa/pemilik.

## 3. Goals & Success Metrics

- **G1 — Transaksi terlacak penuh:** 100% booking memiliki status yang selalu konsisten dengan status barang (tidak ada barang berstatus "tersedia" padahal sedang ada booking aktif).
- **G2 — Kurangi keterlambatan pengembalian:** reminder terkirim H-1 dan tepat saat lewat tenggat untuk setiap booking aktif, target keterlambatan (`TELAT_KEMBALI`) tanpa notifikasi = 0%.
- **G3 — Kepercayaan antar pengguna:** minimal 60% booking `COMPLETED` mendapat review dalam 30 hari pertama setelah peluncuran modul review.
- **G4 — Adopsi awal:** target minimal 50 barang aktif dan 20 transaksi selesai dalam 3 bulan pertama pasca-launch (metrik bisnis, disesuaikan saat go-live).

## 4. Target Users & Persona

1. **Pemilik Barang ("Owner") — Dimas, 29 tahun.** Punya beberapa alat kamera & perkakas yang jarang dipakai, ingin menyewakan untuk penghasilan tambahan. Butuh kontrol penuh atas siapa yang boleh menyewa dan kapan barang harus kembali.
2. **Penyewa ("Renter") — Sari, 24 tahun.** Butuh barang tertentu (misal tenda camping) hanya untuk beberapa hari, tidak mau beli. Butuh proses booking yang jelas dan bisa melihat riwayat serta rating barang/pemilik sebelum menyewa.
3. **Admin — pengelola platform.** Mengawasi transaksi bermasalah, bisa menonaktifkan user/barang yang melanggar aturan.

## 5. Scope

### Phase 1 (fokus development saat ini)
- **Modul Auth & User Management:** registrasi/login multi-role (Owner, Renter, Admin), profil dasar.
- **Modul Barang (Item):** CRUD barang oleh Owner (nama, deskripsi, kategori, foto multi-gambar, kondisi, harga/hari), status barang (`TERSEDIA`/`DISEWA`/`TELAT_KEMBALI`/`NONAKTIF`).
- **Modul Browse & Discovery:** Renter mencari & filter barang tersedia (kategori, rentang harga, lokasi jika ada).
- **Modul Booking:** request sewa oleh Renter → approve/reject oleh Owner → aktif → selesai, termasuk validasi tanggal & pencegahan double-booking.
- **Modul Payment Tracking (manual):** Owner menandai status pembayaran per booking (`BELUM_LUNAS`/`LUNAS`), tanpa gateway pembayaran otomatis.
- **Modul Reminder:** notifikasi email + in-app otomatis mendekati (H-1) dan saat lewat tenggat pengembalian.
- **Modul History:** riwayat transaksi per barang dan per user (Owner maupun Renter).
- **Modul Rating/Review:** review sederhana oleh Renter terhadap barang/transaksi setelah booking `COMPLETED`.
- **Modul Admin dasar:** lihat semua user/barang/booking, nonaktifkan user atau barang bermasalah.

### Phase 2 (roadmap, di luar fokus implementasi sekarang)
- Integrasi payment gateway otomatis (Midtrans/Xendit) menggantikan pencatatan manual.
- Kalender ketersediaan barang berbasis rentang tanggal (bukan sekadar status tunggal).
- Notifikasi WhatsApp/SMS selain email.
- Dual-role akun (satu akun bisa jadi Owner sekaligus Renter tanpa pilih role tetap).
- Review dua arah (Owner menilai Renter, bukan hanya sebaliknya).
- Multi-item dalam satu booking (keranjang sewa).

### Phase 3 (visi jangka panjang)
- Migrasi storage foto ke cloud storage untuk mendukung deployment serverless.
- Sistem deposit/jaminan barang.
- Chat real-time antara Owner & Renter dalam platform.

## 6. Out of Scope

- Marketplace multi-tenant (banyak "toko" dalam satu instalasi) — di luar scope Phase 1–3.
- Aplikasi mobile native (fokus web responsif dulu).
- Integrasi asuransi barang.
- Verifikasi identitas (KTP/e-KYC) — dicatat sebagai risiko di bagian Assumptions.

## 7. User Roles & Permission Matrix

| Modul / Aksi | Owner | Renter | Admin |
|---|---|---|---|
| Registrasi & login | ✅ | ✅ | ✅ (dibuat manual) |
| CRUD barang milik sendiri | ✅ | ❌ | ✅ (semua barang) |
| Browse & cari barang tersedia | ✅ | ✅ | ✅ |
| Ajukan request sewa | ❌ | ✅ | ❌ |
| Approve/reject request | ✅ (barang miliknya) | ❌ | ✅ (override) |
| Tandai booking aktif → selesai | ✅ | ❌ (hanya konfirmasi terima) | ✅ |
| Tandai status pembayaran | ✅ | ❌ | ✅ |
| Lihat history transaksi | ✅ (miliknya) | ✅ (miliknya) | ✅ (semua) |
| Beri rating/review | ❌ | ✅ (booking miliknya) | ❌ |
| Nonaktifkan user/barang | ❌ | ❌ | ✅ |

## 8. User Stories per Modul

**Auth & User Management**
- Sebagai calon pengguna, saya ingin mendaftar dengan memilih role (Owner/Renter), supaya sistem tahu antarmuka & permission apa yang saya dapat.
- Sebagai pengguna terdaftar, saya ingin login dan mengelola profil saya, supaya data kontak saya akurat untuk transaksi.

**Barang (Item)**
- Sebagai Owner, saya ingin menambah barang dengan nama, deskripsi, foto, kondisi, dan harga/hari, supaya barang saya bisa ditemukan penyewa.
- Sebagai Owner, saya ingin mengubah atau menonaktifkan listing barang saya, supaya barang yang rusak/tidak tersedia tidak muncul di pencarian.

**Browse & Discovery**
- Sebagai Renter, saya ingin mencari dan memfilter barang berdasarkan kategori & harga, supaya saya cepat menemukan barang yang saya butuhkan.

**Booking**
- Sebagai Renter, saya ingin mengajukan request sewa dengan rentang tanggal, supaya Owner bisa menyetujui atau menolaknya.
- Sebagai Owner, saya ingin menyetujui atau menolak request sewa, supaya saya mengontrol siapa yang menyewa barang saya.
- Sebagai Owner, saya ingin menandai booking sebagai selesai setelah barang dikembalikan, supaya status barang kembali `TERSEDIA`.

**Payment Tracking**
- Sebagai Owner, saya ingin menandai status pembayaran booking sebagai lunas/belum, supaya saya punya catatan pembayaran yang jelas.

**Reminder**
- Sebagai Renter, saya ingin menerima email pengingat H-1 sebelum tenggat pengembalian, supaya saya tidak telat mengembalikan barang.
- Sebagai Owner, saya ingin menerima notifikasi ketika penyewa melewati tenggat, supaya saya bisa menindaklanjuti.

**History**
- Sebagai Owner/Renter, saya ingin melihat riwayat transaksi per barang dan per akun saya, supaya saya punya jejak lengkap semua sewa-menyewa.

**Rating/Review**
- Sebagai Renter, saya ingin memberi rating & ulasan singkat setelah booking selesai, supaya calon penyewa lain punya referensi.

## 9. Business Rules & Logic Khusus

- **BR1 — Lock ketersediaan:** barang hanya bisa menerima request baru saat status `TERSEDIA`. Begitu salah satu request di-`APPROVE`, status barang berubah `DISEWA` dan seluruh request `PENDING` lain untuk barang yang sama otomatis di-`REJECTED` (lihat ADR di `decision-log.md`).
- **BR2 — Perhitungan total harga:** `total_price = harga_per_hari × jumlah_hari` (inklusif tanggal mulai, eksklusif atau inklusif tanggal selesai — ditetapkan konsisten sebagai *inklusif keduanya* dan didokumentasikan di `technical-spec.md`).
- **BR3 — Transisi ke `TELAT_KEMBALI`:** dipicu job terjadwal (bukan realtime) yang mengecek booking `ACTIVE` dengan `end_date` terlewati tanpa konfirmasi pengembalian.
- **BR4 — Review hanya untuk booking `COMPLETED`:** mencegah review untuk transaksi yang belum benar-benar terjadi.
- **BR5 — Reminder idempoten:** satu jenis reminder (H-1, overdue) hanya dikirim sekali per booking, dicatat di tabel `ReminderLog` agar job terjadwal tidak mengirim duplikat.

## 10. Functional Requirements

1. Sistem harus memungkinkan registrasi dengan email, password, nama, dan role (Owner/Renter).
2. Sistem harus mem-validasi bahwa hanya Owner yang bisa membuat/mengubah/menghapus barang miliknya sendiri.
3. Sistem harus menampilkan hanya barang berstatus `TERSEDIA` di halaman browse untuk Renter.
4. Sistem harus mencegah Renter mengajukan request untuk rentang tanggal yang tidak valid (tanggal mulai > tanggal selesai, atau di masa lalu).
5. Sistem harus mengubah status barang menjadi `DISEWA` secara atomik saat request di-approve, dan menolak request lain yang tumpang tindih (BR1).
6. Sistem harus mencatat setiap perubahan status booking dengan timestamp (`requested_at`, `approved_at`, `completed_at`, dst).
7. Sistem harus mengizinkan Owner menandai status pembayaran per booking secara manual.
8. Sistem harus mengirim email reminder H-1 dan saat lewat tenggat, masing-masing maksimal satu kali per booking.
9. Sistem harus menampilkan riwayat transaksi terurut berdasarkan tanggal, difilter per barang atau per user.
10. Sistem harus hanya mengizinkan review dari Renter yang booking-nya berstatus `COMPLETED`, satu review per booking.
11. Sistem harus menyediakan panel Admin untuk melihat seluruh data dan menonaktifkan user/barang.

## 11. Non-Functional Requirements

- **Performa:** response time API endpoint utama (browse, detail barang, submit booking) < 300ms pada beban normal.
- **Keamanan:** password di-hash (bcrypt/argon2), validasi input di setiap endpoint, proteksi CSRF pada form mutasi, rate limiting pada endpoint auth.
- **Skalabilitas:** arsitektur modular monolith yang siap dipecah per modul jika beban bertambah (lihat `technical-spec.md`).
- **Availability:** target uptime 99% untuk fase awal produksi (single instance + monitoring, bukan multi-region).
- **Accessibility:** kontras warna WCAG AA minimum, navigasi keyboard untuk form utama (lihat `design-system.md`).
- **i18n:** UI berbahasa Indonesia (single language) untuk Phase 1; struktur copy tetap dipisah dari komponen supaya multi-language bisa ditambah di Phase 2+ tanpa refactor besar.

## 12. Assumptions, Dependencies, Risks

- **Asumsi:** pengguna bertransaksi dalam satu wilayah/kota yang sama (tidak ada logistik pengiriman built-in di Phase 1).
- **Dependency:** layanan pengiriman email (SMTP/Resend) harus dikonfigurasi sebelum modul reminder bisa diuji end-to-end.
- **Risiko R1:** tanpa verifikasi identitas, ada risiko penyalahgunaan (barang tidak dikembalikan) — dimitigasi lewat rating/review dan dicatat sebagai kandidat fitur e-KYC di Phase 3.
- **Risiko R2:** storage foto lokal (lihat ADR di `decision-log.md`) membatasi pilihan deployment ke VPS, bukan platform serverless — trade-off yang disadari sejak awal.
- **Risiko R3:** job pengingat & pengecekan telat kembali bergantung pada scheduler eksternal (cron) yang harus dipastikan berjalan; kegagalan job = reminder tidak terkirim tanpa error yang terlihat user.

## 13. Release Plan / Milestones

- **Milestone 1 — Foundation:** Auth & role management, skema database inti, struktur project.
- **Milestone 2 — Core Listing:** modul Barang (CRUD) + Browse & Discovery.
- **Milestone 3 — Booking Flow:** request → approve/reject → aktif → selesai, termasuk BR1 (lock ketersediaan).
- **Milestone 4 — Payment & History:** payment tracking manual + halaman riwayat transaksi.
- **Milestone 5 — Reminder & Review:** job reminder email + modul rating/review.
- **Milestone 6 — Admin & Hardening:** panel admin, security checklist, QA menyeluruh sebelum go-live publik.

Urutan detail per-modul & pembagian fase frontend/backend ada di `docs/development-workflow.md` dan `docs/todo/`.

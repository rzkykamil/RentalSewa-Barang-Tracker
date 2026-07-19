# User Flow — Rental Sewa Barang Tracker

## 1. Journey Owner: dari registrasi sampai barang disewa

```mermaid
flowchart TD
    A[Kunjungi landing page] --> B[Registrasi, pilih role Owner]
    B --> C[Login]
    C --> D[Lengkapi profil]
    D --> E[Tambah barang: nama, foto, kondisi, harga/hari]
    E --> F[Barang berstatus TERSEDIA di listing publik]
    F --> G{Ada request masuk?}
    G -- Tidak --> F
    G -- Ya --> H[Review detail request: tanggal, penyewa]
    H --> I{Approve?}
    I -- Reject --> J[Booking REJECTED, barang tetap TERSEDIA]
    I -- Approve --> K[Booking APPROVED, barang jadi DISEWA]
    K --> L[Serahkan barang, tandai booking ACTIVE]
    L --> M{Kembali tepat waktu?}
    M -- Ya --> N[Tandai COMPLETED, barang kembali TERSEDIA]
    M -- Tidak --> O[Sistem tandai LATE otomatis, Owner dapat notifikasi]
    O --> N
    N --> P[Tandai status pembayaran LUNAS]
    P --> Q[Transaksi tercatat di history]
```

## 2. Journey Renter: dari cari barang sampai review

```mermaid
flowchart TD
    A[Kunjungi landing page] --> B[Registrasi, pilih role Renter]
    B --> C[Login]
    C --> D[Browse & filter barang TERSEDIA]
    D --> E[Lihat detail barang: foto, harga, rating]
    E --> F[Ajukan request sewa: pilih tanggal mulai & selesai]
    F --> G{Owner approve?}
    G -- Reject --> H[Notifikasi ditolak, cari barang lain]
    H --> D
    G -- Approve --> I[Terima barang dari Owner]
    I --> J[Booking ACTIVE, dapat reminder H-1 mendekati tenggat]
    J --> K[Kembalikan barang tepat waktu]
    K --> L[Owner tandai COMPLETED]
    L --> M[Beri rating & review]
    M --> N[Transaksi tercatat di history pribadi]
```

## 3. Ringkasan Titik Keputusan Penting

- **Approval barang (Owner):** satu-satunya titik yang mengunci ketersediaan barang (BR1 di `prd.md`) — request lain otomatis ditolak begitu satu disetujui.
- **Reminder H-1 & overdue:** dikirim otomatis oleh job terjadwal, tidak butuh aksi user, tapi memengaruhi urutan aksi Renter (dorongan untuk mengembalikan tepat waktu).
- **Review:** hanya muncul sebagai opsi setelah booking berstatus `COMPLETED`, mencegah review prematur.

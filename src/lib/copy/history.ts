/**
 * UI copy for transaction history pages (Periode 10 — see
 * docs/development-workflow.md, Modul History), kept separate from
 * components so strings stay easy to extract into a proper i18n layer
 * later (see docs/prd.md NFR i18n).
 */

export const ownerHistoryPageCopy = {
  title: "Riwayat Transaksi",
  subtitle: "Lihat seluruh riwayat transaksi sewa untuk barang-barang Anda.",
} as const;

export const renterHistoryPageCopy = {
  title: "Riwayat Transaksi",
  subtitle: "Lihat riwayat transaksi sewa yang pernah Anda ajukan.",
} as const;

export const transactionHistoryCopy = {
  filters: {
    statusLabel: "Filter Status",
    statusAllOption: "Semua Status",
    sortLabel: "Urutkan Tanggal",
    sortNewest: "Terbaru lebih dulu",
    sortOldest: "Terlama lebih dulu",
  },
  table: {
    item: "Barang",
    ownerColumn: "Pemilik",
    renterColumn: "Penyewa",
    period: "Periode Sewa",
    total: "Total Biaya",
    bookingStatus: "Status Booking",
    paymentStatus: "Status Pembayaran",
    paymentNotApplicable: "-",
  },
  empty: {
    noHistory: {
      title: "Belum ada riwayat transaksi",
      description: "Transaksi sewa yang pernah terjadi akan muncul di sini.",
    },
    noResults: {
      title: "Tidak ada hasil untuk filter ini",
      description: "Coba ubah filter status atau urutan tanggal.",
    },
  },
  itemHistorySection: {
    title: "Riwayat Transaksi Barang Ini",
    empty: "Barang ini belum pernah disewa.",
  },
} as const;

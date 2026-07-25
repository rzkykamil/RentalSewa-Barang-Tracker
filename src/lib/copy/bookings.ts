/**
 * UI copy for booking related pages/forms, kept separate from components
 * so strings stay easy to extract into a proper i18n layer later (see
 * docs/prd.md NFR i18n).
 */

/**
 * Superset of the mock-only `MockBookingStatus` (src/lib/mock/bookings.ts)
 * that also covers the real `BookingStatus` enum's `LATE` value (see
 * `src/generated/prisma/enums.ts` and BR3 in docs/prd.md) so booking status
 * UI components can be shared between mock-data pages (Admin/History,
 * still on Periode 4 mock data) and the now-integrated Owner/Renter booking
 * pages without duplicating the status → label/color mapping.
 */
export type BookingStatusValue = "PENDING" | "APPROVED" | "ACTIVE" | "COMPLETED" | "REJECTED" | "LATE";

export const bookingStatusLabel: Record<BookingStatusValue, string> = {
  PENDING: "Menunggu Persetujuan",
  APPROVED: "Disetujui",
  ACTIVE: "Sedang Berjalan",
  COMPLETED: "Selesai",
  REJECTED: "Ditolak",
  LATE: "Terlambat Dikembalikan",
};

/** Ordered timeline steps for the normal booking path (REJECTED is a separate terminal state). */
export const bookingTimelineSteps = [
  { status: "PENDING", label: "Diajukan" },
  { status: "APPROVED", label: "Disetujui" },
  { status: "ACTIVE", label: "Berjalan" },
  { status: "COMPLETED", label: "Selesai" },
] as const;

export const bookingRequestFormCopy = {
  title: "Ajukan Sewa",
  subtitle: (itemName: string) => `Pilih tanggal sewa untuk ${itemName}.`,
  fields: {
    startDate: { label: "Tanggal Mulai" },
    endDate: { label: "Tanggal Selesai" },
    notes: {
      label: "Catatan untuk Pemilik (opsional)",
      placeholder: "Contoh: akan diambil sore hari.",
    },
  },
  priceSummary: {
    title: "Ringkasan Biaya",
    pricePerDay: "Harga per hari",
    duration: (days: number) => `${days} hari`,
    total: "Total Biaya",
    placeholder: "Pilih tanggal mulai dan selesai untuk melihat estimasi total biaya.",
  },
  submit: "Ajukan Sewa",
  submitLoading: "Mengirim permintaan...",
  success: "Permintaan sewa berhasil diajukan. Menunggu persetujuan pemilik.",
  errors: {
    startDateRequired: "Tanggal mulai wajib diisi.",
    startDatePast: "Tanggal mulai tidak boleh di masa lalu.",
    endDateRequired: "Tanggal selesai wajib diisi.",
    endDateBeforeStart: "Tanggal selesai harus setelah tanggal mulai.",
  },
  backToItem: "Kembali ke Detail Barang",
} as const;

export const ownerBookingsCopy = {
  title: "Request Masuk",
  subtitle: "Kelola permintaan sewa yang masuk untuk barang Anda.",
  empty: {
    title: "Belum ada request masuk",
    description: "Request sewa dari penyewa akan muncul di sini.",
  },
  card: {
    renterLabel: "Penyewa",
    periodLabel: "Periode Sewa",
    totalLabel: "Total Biaya",
    notesLabel: "Catatan",
  },
  actions: {
    approve: "Setujui",
    reject: "Tolak",
    markActive: "Tandai Aktif",
    markCompleted: "Tandai Selesai",
  },
  dialogs: {
    approve: {
      title: "Setujui request ini?",
      description:
        "Barang akan ditandai sedang disewa dan request lain yang masih menunggu untuk barang ini otomatis ditolak.",
      confirm: "Ya, Setujui",
    },
    reject: {
      title: "Tolak request ini?",
      description: "Penyewa akan diberi tahu bahwa permintaan sewanya ditolak.",
      confirm: "Ya, Tolak",
    },
    markActive: {
      title: "Tandai booking ini aktif?",
      description: "Gunakan aksi ini setelah barang diserahkan ke penyewa.",
      confirm: "Ya, Tandai Aktif",
    },
    markCompleted: {
      title: "Tandai booking ini selesai?",
      description: "Gunakan aksi ini setelah barang dikembalikan dalam kondisi baik.",
      confirm: "Ya, Tandai Selesai",
    },
  },
  success: {
    approve: "Request berhasil disetujui.",
    reject: "Request berhasil ditolak.",
    markActive: "Booking ditandai aktif.",
    markCompleted: "Booking ditandai selesai.",
  },
} as const;

export const renterBookingsCopy = {
  title: "Booking Saya",
  subtitle: "Pantau status pengajuan sewa Anda.",
  empty: {
    title: "Belum ada booking",
    description: "Booking yang Anda ajukan akan muncul di sini.",
  },
  card: {
    ownerLabel: "Pemilik",
    periodLabel: "Periode Sewa",
    totalLabel: "Total Biaya",
  },
  rejectedNote: "Permintaan sewa ini ditolak oleh pemilik barang.",
} as const;

/**
 * UI copy for the in-app reminder/notification badge and list (Periode 13 —
 * see docs/development-workflow.md, Modul Reminder), kept separate from
 * components so strings stay easy to extract into a proper i18n layer
 * later (see docs/prd.md NFR i18n).
 */

export const reminderTypeLabel = {
  H1_REMINDER: "H-1 Tenggat",
  OVERDUE_ALERT: "Telat Kembali",
} as const;

export const reminderBellCopy = {
  triggerLabel: "Notifikasi",
  emptyLabel: "Tidak ada notifikasi baru",
  viewAllLabel: "Lihat semua notifikasi",
  moreLabel: (count: number) => `+${count} notifikasi lainnya`,
} as const;

export const ownerNotificationsPageCopy = {
  title: "Notifikasi",
  subtitle: "Pengingat H-1 tenggat pengembalian dan barang yang telat dikembalikan penyewa.",
} as const;

export const renterNotificationsPageCopy = {
  title: "Notifikasi",
  subtitle: "Pengingat H-1 tenggat pengembalian dan status keterlambatan booking Anda.",
} as const;

export const reminderListCopy = {
  ownerCounterpartLabel: "Penyewa",
  renterCounterpartLabel: "Pemilik",
  dueDateLabel: "Tenggat pengembalian",
  viewBookingsLabel: "Lihat Booking",
  messages: {
    H1_REMINDER: (itemName: string) => `Booking "${itemName}" jatuh tempo besok — siapkan pengembalian.`,
    OVERDUE_ALERT: (itemName: string) => `Booking "${itemName}" sudah lewat tenggat pengembalian.`,
  },
  empty: {
    title: "Belum ada notifikasi",
    description: "Pengingat H-1 tenggat dan telat kembali akan muncul di sini.",
  },
} as const;

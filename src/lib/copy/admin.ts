/**
 * UI copy for admin panel pages, kept separate from components so strings
 * stay easy to extract into a proper i18n layer later (see docs/prd.md NFR
 * i18n).
 */

export const userStatusLabel = {
  active: "Aktif",
  inactive: "Nonaktif",
} as const;

export const adminUsersCopy = {
  title: "Kelola User",
  subtitle: "Daftar seluruh user terdaftar di platform.",
  table: {
    name: "Nama",
    email: "Email",
    role: "Role",
    status: "Status",
    actions: "Aksi",
  },
  actions: {
    deactivate: "Nonaktifkan",
    activate: "Aktifkan",
  },
  dialogs: {
    deactivate: {
      title: "Nonaktifkan user ini?",
      description:
        "User yang dinonaktifkan tidak dapat login ke platform. Anda bisa mengaktifkannya kembali kapan saja.",
      confirm: "Ya, Nonaktifkan",
    },
    activate: {
      title: "Aktifkan kembali user ini?",
      description: "User akan bisa login ke platform kembali.",
      confirm: "Ya, Aktifkan",
    },
  },
  success: {
    deactivate: "User berhasil dinonaktifkan (mock — belum tersimpan permanen).",
    activate: "User berhasil diaktifkan kembali (mock — belum tersimpan permanen).",
  },
  empty: {
    title: "Belum ada user",
    description: "Belum ada user yang terdaftar di platform.",
  },
} as const;

export const adminItemsCopy = {
  title: "Kelola Barang",
  subtitle: "Daftar seluruh barang yang terdaftar di platform.",
  table: {
    name: "Nama Barang",
    owner: "Pemilik",
    category: "Kategori",
    price: "Harga/Hari",
    status: "Status",
    actions: "Aksi",
  },
  actions: {
    forceDeactivate: "Nonaktifkan Paksa",
  },
  dialog: {
    title: "Nonaktifkan paksa barang ini?",
    description:
      "Barang akan langsung ditandai nonaktif dan tidak muncul lagi di halaman Jelajah Barang, terlepas dari status sebelumnya.",
    confirm: "Ya, Nonaktifkan Paksa",
  },
  success: "Barang berhasil dinonaktifkan paksa (mock — belum tersimpan permanen).",
  alreadyInactive: "Barang ini sudah nonaktif.",
  empty: {
    title: "Belum ada barang",
    description: "Belum ada barang yang terdaftar di platform.",
  },
} as const;

export const adminBookingsCopy = {
  title: "Kelola Booking",
  subtitle: "Pantau seluruh booking di platform (read-only).",
  table: {
    item: "Barang",
    owner: "Pemilik",
    renter: "Penyewa",
    period: "Periode Sewa",
    status: "Status",
    total: "Total Biaya",
  },
  empty: {
    title: "Belum ada booking",
    description: "Belum ada booking yang tercatat di platform.",
  },
} as const;

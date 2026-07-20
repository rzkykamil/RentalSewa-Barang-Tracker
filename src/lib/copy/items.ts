/**
 * UI copy for item (barang) related pages/forms, kept separate from
 * components so strings stay easy to extract into a proper i18n layer
 * later (see docs/prd.md NFR i18n).
 */

export const itemStatusLabel = {
  TERSEDIA: "Tersedia",
  DISEWA: "Disewa",
  TELAT_KEMBALI: "Telat Kembali",
  NONAKTIF: "Nonaktif",
} as const;

export const itemConditionLabel = {
  BAIK: "Baik",
  CUKUP: "Cukup",
  RUSAK_RINGAN: "Rusak Ringan",
} as const;

export const itemConditionOptions = [
  { value: "BAIK", label: "Baik" },
  { value: "CUKUP", label: "Cukup" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
] as const;

export const itemFormCopy = {
  createTitle: "Tambah Barang",
  createSubtitle: "Lengkapi detail barang yang ingin Anda sewakan.",
  editTitle: "Edit Barang",
  editSubtitle: "Perbarui detail barang Anda.",
  fields: {
    name: { label: "Nama Barang", placeholder: "Contoh: Kamera Mirrorless Sony A7 III" },
    description: {
      label: "Deskripsi",
      placeholder: "Jelaskan kondisi, kelengkapan, dan hal penting lain tentang barang ini.",
    },
    category: { label: "Kategori", placeholder: "Contoh: Elektronik" },
    condition: { label: "Kondisi Barang", placeholder: "Pilih kondisi" },
    pricePerDay: { label: "Harga Sewa per Hari (Rp)", placeholder: "0" },
    photos: {
      label: "Foto Barang",
      hint: "Unggah minimal 1 foto. Pratinjau lokal saja — unggah sungguhan belum aktif.",
    },
  },
  submitCreate: "Simpan Barang",
  submitCreateLoading: "Menyimpan barang...",
  submitEdit: "Simpan Perubahan",
  submitEditLoading: "Menyimpan perubahan...",
  successCreate: "Barang berhasil ditambahkan (mock — belum tersimpan permanen).",
  successEdit: "Perubahan berhasil disimpan (mock — belum tersimpan permanen).",
  errors: {
    nameRequired: "Nama barang wajib diisi.",
    descriptionRequired: "Deskripsi wajib diisi.",
    categoryRequired: "Kategori wajib diisi.",
    conditionRequired: "Pilih kondisi barang.",
    priceRequired: "Harga sewa wajib diisi.",
    priceInvalid: "Harga sewa harus berupa angka lebih dari 0.",
    photosRequired: "Unggah minimal 1 foto barang.",
  },
  deactivate: {
    trigger: "Nonaktifkan Barang",
    dialogTitle: "Nonaktifkan barang ini?",
    dialogDescription:
      "Barang yang nonaktif tidak akan muncul di halaman Jelajah Barang bagi penyewa. Anda bisa mengaktifkannya kembali nanti.",
    confirm: "Ya, Nonaktifkan",
    cancel: "Batal",
    success: "Barang berhasil dinonaktifkan (mock — belum tersimpan permanen).",
  },
} as const;

export const itemListCopy = {
  title: "Barang Saya",
  subtitle: "Kelola daftar barang yang Anda sewakan.",
  addNew: "+ Tambah Barang",
  table: {
    name: "Nama Barang",
    category: "Kategori",
    price: "Harga/Hari",
    status: "Status",
    actions: "Aksi",
  },
  edit: "Edit",
  empty: {
    title: "Belum ada barang",
    description: "Anda belum menambahkan barang apa pun. Mulai dengan menambah barang pertama Anda.",
  },
} as const;

export const browseCopy = {
  title: "Jelajah Barang",
  subtitle: "Temukan barang yang ingin Anda sewa.",
  filters: {
    category: { label: "Kategori", allOption: "Semua Kategori" },
    minPrice: { label: "Harga Minimum", placeholder: "0" },
    maxPrice: { label: "Harga Maksimum", placeholder: "Tanpa batas" },
    sort: {
      label: "Urutkan",
      options: [
        { value: "price-asc", label: "Harga Terendah" },
        { value: "price-desc", label: "Harga Tertinggi" },
      ],
    },
  },
  empty: {
    title: "Tidak ada barang ditemukan",
    description: "Coba ubah filter kategori atau rentang harga Anda.",
  },
  perDay: "/hari",
} as const;

export const itemDetailCopy = {
  perDay: "/hari",
  conditionLabel: "Kondisi",
  ownerLabel: "Pemilik",
  ratingNoReviews: "Belum ada ulasan",
  ratingCount: (count: number) => `(${count} ulasan)`,
  descriptionTitle: "Deskripsi",
  reviewsTitle: "Ulasan Penyewa",
  requestButton: "Ajukan Sewa",
  requestButtonDisabledHint: "Barang ini sedang tidak tersedia untuk disewa.",
  notFoundTitle: "Barang tidak ditemukan",
  notFoundDescription: "Barang yang Anda cari mungkin sudah dihapus atau tidak tersedia.",
  backToBrowse: "Kembali ke Jelajah Barang",
} as const;

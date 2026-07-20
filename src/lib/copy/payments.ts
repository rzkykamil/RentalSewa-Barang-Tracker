/**
 * UI copy for payment tracking related components, kept separate from
 * components so strings stay easy to extract into a proper i18n layer
 * later (see docs/prd.md NFR i18n).
 */

export const paymentStatusLabel = {
  BELUM_LUNAS: "Belum Lunas",
  LUNAS: "Lunas",
} as const;

export const ownerPaymentCopy = {
  title: "Status Pembayaran",
  statusLabel: "Status Pembayaran",
  statusOptions: {
    BELUM_LUNAS: "Belum Lunas",
    LUNAS: "Lunas",
  },
  methodNoteLabel: "Catatan Metode Pembayaran (opsional)",
  methodNotePlaceholder: "Contoh: Transfer BCA, tunai, atau e-wallet (OVO/GoPay/Dana)",
  submit: "Simpan Status Pembayaran",
  submitLoading: "Menyimpan...",
  success: "Status pembayaran berhasil diperbarui (mock — belum tersimpan permanen).",
} as const;

export const renterPaymentCopy = {
  title: "Status Pembayaran",
  methodNoteLabel: "Catatan metode",
  noteEmpty: "Pemilik belum menambahkan catatan metode pembayaran.",
} as const;

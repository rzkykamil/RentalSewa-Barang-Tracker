/**
 * UI copy for the rating/review form, kept separate from components so
 * strings stay easy to extract into a proper i18n layer later (see
 * docs/prd.md NFR i18n).
 */

export const reviewFormCopy = {
  trigger: "Beri Rating",
  alreadyReviewed: "Sudah Diberi Rating",
  dialogTitle: "Beri Rating & Ulasan",
  dialogDescription: (itemName: string) => `Bagaimana pengalaman Anda menyewa ${itemName}?`,
  fields: {
    rating: { label: "Rating" },
    comment: {
      label: "Komentar",
      placeholder: "Ceritakan pengalaman Anda menyewa barang ini.",
    },
  },
  submit: "Kirim Ulasan",
  submitLoading: "Mengirim ulasan...",
  success: "Ulasan berhasil dikirim (mock — belum tersimpan permanen).",
  errors: {
    ratingRequired: "Pilih rating 1-5 bintang.",
    commentRequired: "Komentar wajib diisi.",
  },
  starLabel: (star: number) => `Beri rating ${star} dari 5 bintang`,
} as const;

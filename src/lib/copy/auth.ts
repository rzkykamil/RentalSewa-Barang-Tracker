/**
 * UI copy for auth-related pages/forms, kept separate from components so
 * strings stay easy to extract into a proper i18n layer later
 * (see docs/prd.md NFR i18n).
 */

export const registerCopy = {
  title: "Daftar Akun",
  subtitle: "Buat akun untuk mulai menyewakan atau menyewa barang.",
  fields: {
    name: { label: "Nama Lengkap", placeholder: "Masukkan nama lengkap" },
    email: { label: "Email", placeholder: "nama@email.com" },
    password: { label: "Kata Sandi", placeholder: "Minimal 8 karakter" },
    phone: {
      label: "Nomor Telepon (opsional)",
      placeholder: "08xxxxxxxxxx",
    },
    role: { label: "Daftar sebagai", placeholder: "Pilih peran" },
  },
  roleOptions: [
    { value: "OWNER", label: "Pemilik Barang (Owner)" },
    { value: "RENTER", label: "Penyewa (Renter)" },
  ],
  submit: "Daftar",
  submitLoading: "Memproses pendaftaran...",
  success: "Pendaftaran berhasil! Mengalihkan ke halaman login...",
  footerText: "Sudah punya akun?",
  footerLinkText: "Masuk di sini",
  errors: {
    nameRequired: "Nama lengkap wajib diisi.",
    emailRequired: "Email wajib diisi.",
    emailInvalid: "Format email tidak valid.",
    passwordRequired: "Kata sandi wajib diisi.",
    passwordTooShort: "Kata sandi minimal 8 karakter.",
    roleRequired: "Pilih peran (Owner/Renter).",
    // Simulated server-side error to demonstrate the error state (mock only).
    emailTaken: "Email ini sudah terdaftar. Gunakan email lain atau masuk.",
  },
} as const;

export const loginCopy = {
  title: "Masuk",
  subtitle: "Masuk ke akun Anda untuk melanjutkan.",
  fields: {
    email: { label: "Email", placeholder: "nama@email.com" },
    password: { label: "Kata Sandi", placeholder: "Masukkan kata sandi" },
  },
  submit: "Masuk",
  submitLoading: "Memeriksa akun...",
  footerText: "Belum punya akun?",
  footerLinkText: "Daftar di sini",
  errors: {
    emailRequired: "Email wajib diisi.",
    emailInvalid: "Format email tidak valid.",
    passwordRequired: "Kata sandi wajib diisi.",
    // Simulated server-side error to demonstrate the error state (mock only).
    invalidCredentials: "Email atau kata sandi salah.",
  },
} as const;

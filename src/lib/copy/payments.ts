/**
 * UI copy + client-safe types for payment tracking related components, kept
 * separate from components so strings stay easy to extract into a proper
 * i18n layer later (see docs/prd.md NFR i18n).
 */

import type { BookingStatusValue } from "@/lib/copy/bookings";

/** Mirrors `PaymentStatus` in `@/generated/prisma/enums` (used server-side by `PaymentDto`). */
export type PaymentStatus = "BELUM_LUNAS" | "LUNAS";

export const DEFAULT_PAYMENT_STATUS: PaymentStatus = "BELUM_LUNAS";

/**
 * Client-side shape of `PaymentDto` (`src/modules/payments/payments.service.ts`)
 * after crossing the server/client boundary — `markedPaidAt` becomes an ISO
 * string (or `null`) instead of a `Date`, same convention as `BookingDto`'s
 * `startDate`/`endDate` in the bookings pages.
 */
export interface PaymentDto {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  methodNote: string | null;
  markedPaidAt: string | null;
  markedByUserId: string;
}

/**
 * Per docs/database-design.md ("Booking 1—1 Payment: setiap booking yang
 * disetujui punya tepat satu record payment"), a payment only exists once a
 * booking has been approved. PENDING/REJECTED bookings have no payment to
 * track yet.
 */
export function bookingHasPayment(status: BookingStatusValue): boolean {
  return status === "APPROVED" || status === "ACTIVE" || status === "COMPLETED" || status === "LATE";
}

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
  success: "Status pembayaran berhasil diperbarui.",
  error: "Gagal menyimpan status pembayaran. Coba lagi.",
} as const;

export const renterPaymentCopy = {
  title: "Status Pembayaran",
  methodNoteLabel: "Catatan metode",
  noteEmpty: "Pemilik belum menambahkan catatan metode pembayaran.",
} as const;

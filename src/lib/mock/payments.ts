/**
 * Mock payment data for the frontend-only phase (Periode 10 — see
 * docs/development-workflow.md). There is no real `payments` table yet
 * (prisma/schema.prisma has zero models) — pages read this hardcoded array
 * instead of calling `/bookings/:id/payment` (docs/api-spec.md). Shape
 * mirrors the `payments` table planned in docs/database-design.md
 * (`method_note`, `marked_paid_at`).
 *
 * Once the payment backend module lands, this file should be replaced by
 * real API calls and can be deleted.
 */

import type { MockBookingStatus } from "@/lib/mock/bookings";

/** Mirrors the `status` enum planned in docs/database-design.md `payments` table. */
export type PaymentStatus = "BELUM_LUNAS" | "LUNAS";

export interface MockPayment {
  bookingId: string;
  status: PaymentStatus;
  methodNote: string | null;
  markedPaidAt: string | null;
}

export const DEFAULT_PAYMENT_STATUS: PaymentStatus = "BELUM_LUNAS";

/**
 * Per docs/database-design.md ("Booking 1—1 Payment: setiap booking yang
 * disetujui punya tepat satu record payment"), a payment only exists once a
 * booking has been approved. PENDING/REJECTED bookings have no payment to
 * track yet.
 */
export function bookingHasPayment(status: MockBookingStatus): boolean {
  return status === "APPROVED" || status === "ACTIVE" || status === "COMPLETED";
}

export const MOCK_PAYMENTS: MockPayment[] = [
  { bookingId: "booking-3", status: "BELUM_LUNAS", methodNote: null, markedPaidAt: null },
  {
    bookingId: "booking-4",
    status: "LUNAS",
    methodNote: "Transfer BCA",
    markedPaidAt: "2026-06-01T10:00:00.000Z",
  },
  { bookingId: "booking-6", status: "BELUM_LUNAS", methodNote: null, markedPaidAt: null },
  {
    bookingId: "booking-8",
    status: "LUNAS",
    methodNote: "GoPay",
    markedPaidAt: "2026-07-18T09:00:00.000Z",
  },
  {
    bookingId: "booking-9",
    status: "LUNAS",
    methodNote: "Tunai saat serah terima barang",
    markedPaidAt: "2026-06-10T08:30:00.000Z",
  },
];

/**
 * Returns the payment for a booking, or `null` if no record exists yet
 * (e.g. a just-approved booking) — callers should treat `null` as the
 * default `BELUM_LUNAS` state with no method note, per BR/UI requirement
 * in docs/todo/frontend.md.
 */
export function getPaymentByBookingId(bookingId: string): MockPayment | null {
  return MOCK_PAYMENTS.find((payment) => payment.bookingId === bookingId) ?? null;
}

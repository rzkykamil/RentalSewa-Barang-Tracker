"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { OwnerBookingCard, type OwnerBooking } from "@/components/bookings/OwnerBookingCard";
import { ownerBookingsCopy } from "@/lib/copy/bookings";
import { MOCK_PAYMENTS, type MockPayment, type PaymentStatus } from "@/lib/mock/payments";

interface OwnerBookingsListProps {
  initialBookings: OwnerBooking[];
}

interface BookingApiErrorResponse {
  error: { code: string; message: string; details?: unknown };
}

type BookingAction = "approve" | "reject" | "activate" | "complete";

const ACTION_SUCCESS_COPY: Record<BookingAction, string> = {
  approve: ownerBookingsCopy.success.approve,
  reject: ownerBookingsCopy.success.reject,
  activate: ownerBookingsCopy.success.markActive,
  complete: ownerBookingsCopy.success.markCompleted,
};

const ACTION_FALLBACK_ERROR: Record<BookingAction, string> = {
  approve: "Gagal menyetujui request. Coba lagi.",
  reject: "Gagal menolak request. Coba lagi.",
  activate: "Gagal menandai booking aktif. Coba lagi.",
  complete: "Gagal menandai booking selesai. Coba lagi.",
};

/**
 * Client-side owner "Request Masuk" list. Approve/reject/mark-active/
 * mark-completed call the real status-machine endpoints in
 * `src/app/api/v1/bookings/[id]/**` and re-fetch the list via
 * `router.refresh()` afterwards — no local booking-state mutation. Payment
 * status updates remain mock-only (Modul Payment Tracking, out of scope
 * for this integration pass — see docs/todo/integrasi.md).
 */
export function OwnerBookingsList({ initialBookings }: OwnerBookingsListProps) {
  const router = useRouter();
  const [payments, setPayments] = React.useState(MOCK_PAYMENTS);
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = React.useState<string | null>(null);

  function getPayment(bookingId: string): MockPayment | null {
    return payments.find((payment) => payment.bookingId === bookingId) ?? null;
  }

  function handleUpdatePayment(bookingId: string, status: PaymentStatus, methodNote: string | null) {
    setPayments((prev) => {
      const exists = prev.some((payment) => payment.bookingId === bookingId);
      const markedPaidAt = status === "LUNAS" ? new Date().toISOString() : null;

      if (!exists) {
        return [...prev, { bookingId, status, methodNote, markedPaidAt }];
      }

      return prev.map((payment) =>
        payment.bookingId === bookingId ? { ...payment, status, methodNote, markedPaidAt } : payment
      );
    });
  }

  async function runAction(bookingId: string, action: BookingAction) {
    setMessage(null);
    setErrorMessage(null);
    setPendingBookingId(bookingId);

    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}/${action}`, { method: "PATCH" });

      if (!response.ok) {
        const body = (await response.json()) as BookingApiErrorResponse;
        setErrorMessage(body.error.message || ACTION_FALLBACK_ERROR[action]);
        return;
      }

      setMessage(ACTION_SUCCESS_COPY[action]);
      router.refresh();
    } catch {
      setErrorMessage(ACTION_FALLBACK_ERROR[action]);
    } finally {
      setPendingBookingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p role="status" className="text-sm font-medium text-status-positive">
          {message}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}
      {initialBookings.map((booking) => (
        <OwnerBookingCard
          key={booking.id}
          booking={booking}
          payment={getPayment(booking.id)}
          onApprove={() => runAction(booking.id, "approve")}
          onReject={() => runAction(booking.id, "reject")}
          onMarkActive={() => runAction(booking.id, "activate")}
          onMarkCompleted={() => runAction(booking.id, "complete")}
          onUpdatePayment={(status, methodNote) => handleUpdatePayment(booking.id, status, methodNote)}
        />
      ))}
      {pendingBookingId && (
        <p role="status" className="sr-only">
          Memproses perubahan status booking...
        </p>
      )}
    </div>
  );
}

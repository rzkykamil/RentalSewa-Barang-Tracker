"use client";

import * as React from "react";

import { OwnerBookingCard } from "@/components/bookings/OwnerBookingCard";
import { ownerBookingsCopy } from "@/lib/copy/bookings";
import type { MockBooking } from "@/lib/mock/bookings";
import { MOCK_PAYMENTS, type MockPayment, type PaymentStatus } from "@/lib/mock/payments";

interface OwnerBookingsListProps {
  initialBookings: MockBooking[];
}

/**
 * Client-side owner "Request Masuk" list. Periode 4/10 (frontend + mock
 * data only): approve/reject/mark-active/mark-completed and payment
 * status updates only mutate local React state — no real persistence yet,
 * see docs/todo/frontend.md.
 */
export function OwnerBookingsList({ initialBookings }: OwnerBookingsListProps) {
  const [bookings, setBookings] = React.useState(initialBookings);
  const [payments, setPayments] = React.useState(MOCK_PAYMENTS);
  const [message, setMessage] = React.useState<string | null>(null);

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

  function updateBooking(id: string, changes: Partial<MockBooking>, successMessage: string) {
    setBookings((prev) =>
      prev.map((booking) => (booking.id === id ? { ...booking, ...changes } : booking))
    );
    setMessage(successMessage);
  }

  function handleApprove(booking: MockBooking) {
    const now = new Date().toISOString();
    updateBooking(
      booking.id,
      { status: "APPROVED", approvedAt: now },
      ownerBookingsCopy.success.approve
    );
  }

  function handleReject(booking: MockBooking) {
    const now = new Date().toISOString();
    updateBooking(
      booking.id,
      { status: "REJECTED", rejectedAt: now },
      ownerBookingsCopy.success.reject
    );
  }

  function handleMarkActive(booking: MockBooking) {
    const now = new Date().toISOString();
    updateBooking(
      booking.id,
      { status: "ACTIVE", activatedAt: now },
      ownerBookingsCopy.success.markActive
    );
  }

  function handleMarkCompleted(booking: MockBooking) {
    const now = new Date().toISOString();
    updateBooking(
      booking.id,
      { status: "COMPLETED", completedAt: now },
      ownerBookingsCopy.success.markCompleted
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p role="status" className="text-sm font-medium text-status-positive">
          {message}
        </p>
      )}
      {bookings.map((booking) => (
        <OwnerBookingCard
          key={booking.id}
          booking={booking}
          payment={getPayment(booking.id)}
          onApprove={() => handleApprove(booking)}
          onReject={() => handleReject(booking)}
          onMarkActive={() => handleMarkActive(booking)}
          onMarkCompleted={() => handleMarkCompleted(booking)}
          onUpdatePayment={(status, methodNote) => handleUpdatePayment(booking.id, status, methodNote)}
        />
      ))}
    </div>
  );
}

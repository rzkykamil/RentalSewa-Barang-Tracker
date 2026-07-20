"use client";

import * as React from "react";

import { OwnerBookingCard } from "@/components/bookings/OwnerBookingCard";
import { ownerBookingsCopy } from "@/lib/copy/bookings";
import type { MockBooking } from "@/lib/mock/bookings";

interface OwnerBookingsListProps {
  initialBookings: MockBooking[];
}

/**
 * Client-side owner "Request Masuk" list. Periode 4 (frontend + mock data
 * only): approve/reject/mark-active/mark-completed only mutate local React
 * state — no real persistence yet, see docs/todo/frontend.md.
 */
export function OwnerBookingsList({ initialBookings }: OwnerBookingsListProps) {
  const [bookings, setBookings] = React.useState(initialBookings);
  const [message, setMessage] = React.useState<string | null>(null);

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
          onApprove={() => handleApprove(booking)}
          onReject={() => handleReject(booking)}
          onMarkActive={() => handleMarkActive(booking)}
          onMarkCompleted={() => handleMarkCompleted(booking)}
        />
      ))}
    </div>
  );
}

import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState";
import { OwnerBookingsList } from "@/components/bookings/OwnerBookingsList";
import { ownerBookingsCopy } from "@/lib/copy/bookings";
import { getBookingsByOwner } from "@/lib/mock/bookings";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Request Masuk — Rental Sewa Barang Tracker",
};

export default function OwnerBookingsPage() {
  const bookings = getBookingsByOwner(MOCK_USERS.OWNER.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{ownerBookingsCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{ownerBookingsCopy.subtitle}</p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title={ownerBookingsCopy.empty.title}
          description={ownerBookingsCopy.empty.description}
        />
      ) : (
        <OwnerBookingsList initialBookings={bookings} />
      )}
    </div>
  );
}

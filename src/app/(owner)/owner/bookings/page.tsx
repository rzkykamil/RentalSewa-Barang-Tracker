import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
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
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-foreground">{ownerBookingsCopy.empty.title}</p>
            <p className="text-sm text-muted-foreground">{ownerBookingsCopy.empty.description}</p>
          </CardContent>
        </Card>
      ) : (
        <OwnerBookingsList initialBookings={bookings} />
      )}
    </div>
  );
}

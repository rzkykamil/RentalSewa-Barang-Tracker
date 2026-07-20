import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { RenterBookingCard } from "@/components/bookings/RenterBookingCard";
import { renterBookingsCopy } from "@/lib/copy/bookings";
import { getBookingsByRenter } from "@/lib/mock/bookings";
import { getPaymentByBookingId } from "@/lib/mock/payments";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Booking Saya — Rental Sewa Barang Tracker",
};

export default function RenterBookingsPage() {
  const bookings = getBookingsByRenter(MOCK_USERS.RENTER.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{renterBookingsCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{renterBookingsCopy.subtitle}</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-foreground">{renterBookingsCopy.empty.title}</p>
            <p className="text-sm text-muted-foreground">{renterBookingsCopy.empty.description}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <RenterBookingCard
              key={booking.id}
              booking={booking}
              payment={getPaymentByBookingId(booking.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

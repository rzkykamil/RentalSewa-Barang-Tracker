import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { adminBookingsCopy } from "@/lib/copy/admin";
import { MOCK_BOOKINGS } from "@/lib/mock/bookings";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kelola Booking — Rental Sewa Barang Tracker",
};

function formatDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(new Date(startDate))} — ${formatter.format(new Date(endDate))}`;
}

/**
 * Admin "Kelola Booking" list — read-only monitoring, no actions
 * (docs/todo/frontend.md Modul Admin), so this stays a server component
 * unlike the users/items admin tables which need local mutation state.
 */
export default function AdminBookingsPage() {
  const bookings = [...MOCK_BOOKINGS].sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{adminBookingsCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{adminBookingsCopy.subtitle}</p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title={adminBookingsCopy.empty.title}
          description={adminBookingsCopy.empty.description}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{adminBookingsCopy.table.item}</TableHead>
                  <TableHead className="hidden sm:table-cell">{adminBookingsCopy.table.owner}</TableHead>
                  <TableHead className="hidden sm:table-cell">{adminBookingsCopy.table.renter}</TableHead>
                  <TableHead className="hidden md:table-cell">{adminBookingsCopy.table.period}</TableHead>
                  <TableHead>{adminBookingsCopy.table.status}</TableHead>
                  <TableHead className="text-right">{adminBookingsCopy.table.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="max-w-48 truncate font-medium text-foreground">
                      {booking.itemName}
                      <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                        {booking.ownerName} &rarr; {booking.renterName}
                      </span>
                      <span className="block text-xs font-normal text-muted-foreground md:hidden">
                        {formatDateRange(booking.startDate, booking.endDate)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {booking.ownerName}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {booking.renterName}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDateRange(booking.startDate, booking.endDate)}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-right">{formatRupiah(booking.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

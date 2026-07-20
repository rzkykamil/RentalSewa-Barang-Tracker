"use client";

import * as React from "react";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bookingStatusLabel } from "@/lib/copy/bookings";
import { transactionHistoryCopy } from "@/lib/copy/history";
import type { MockBooking, MockBookingStatus } from "@/lib/mock/bookings";
import { bookingHasPayment, DEFAULT_PAYMENT_STATUS, getPaymentByBookingId } from "@/lib/mock/payments";
import { formatRupiah } from "@/lib/utils";

const ALL_BOOKING_STATUSES: MockBookingStatus[] = [
  "PENDING",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "REJECTED",
];

type StatusFilter = "ALL" | MockBookingStatus;
type SortOrder = "desc" | "asc";

interface TransactionHistoryListProps {
  bookings: MockBooking[];
  /** Determines the "counterpart" column: Renter sees the owner, Owner sees the renter. */
  role: "OWNER" | "RENTER";
  /** Set to false for compact contexts (e.g. item detail page) where filter/sort controls are not needed. */
  showFilters?: boolean;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

/**
 * Reusable transaction history table for both Owner and Renter, per
 * docs/todo/frontend.md Modul History. Owner and Renter pages pass their
 * own already-scoped booking list (via getBookingsByOwner/getBookingsByRenter);
 * this component only handles status filtering, date sorting, and rendering.
 */
export function TransactionHistoryList({
  bookings,
  role,
  showFilters = true,
}: TransactionHistoryListProps) {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");

  const counterpartLabel =
    role === "OWNER" ? transactionHistoryCopy.table.renterColumn : transactionHistoryCopy.table.ownerColumn;

  const filteredBookings = React.useMemo(() => {
    const filtered =
      statusFilter === "ALL" ? bookings : bookings.filter((booking) => booking.status === statusFilter);

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [bookings, statusFilter, sortOrder]);

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="font-medium text-foreground">{transactionHistoryCopy.empty.noHistory.title}</p>
          <p className="text-sm text-muted-foreground">
            {transactionHistoryCopy.empty.noHistory.description}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="history-status-filter" className="text-xs font-medium text-muted-foreground">
              {transactionHistoryCopy.filters.statusLabel}
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger id="history-status-filter" className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{transactionHistoryCopy.filters.statusAllOption}</SelectItem>
                {ALL_BOOKING_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {bookingStatusLabel[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {transactionHistoryCopy.filters.sortLabel}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            >
              {sortOrder === "desc"
                ? transactionHistoryCopy.filters.sortNewest
                : transactionHistoryCopy.filters.sortOldest}
            </Button>
          </div>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-foreground">{transactionHistoryCopy.empty.noResults.title}</p>
            <p className="text-sm text-muted-foreground">
              {transactionHistoryCopy.empty.noResults.description}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{transactionHistoryCopy.table.item}</TableHead>
                  <TableHead className="hidden sm:table-cell">{counterpartLabel}</TableHead>
                  <TableHead>{transactionHistoryCopy.table.period}</TableHead>
                  <TableHead>{transactionHistoryCopy.table.total}</TableHead>
                  <TableHead>{transactionHistoryCopy.table.bookingStatus}</TableHead>
                  <TableHead>{transactionHistoryCopy.table.paymentStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const payment = getPaymentByBookingId(booking.id);
                  const counterpartName = role === "OWNER" ? booking.renterName : booking.ownerName;

                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="max-w-48 truncate font-medium text-foreground">
                        {booking.itemName}
                        <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                          {counterpartLabel}: {counterpartName}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {counterpartName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
                      </TableCell>
                      <TableCell>{formatRupiah(booking.totalPrice)}</TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell>
                        {bookingHasPayment(booking.status) ? (
                          <PaymentStatusBadge status={payment?.status ?? DEFAULT_PAYMENT_STATUS} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {transactionHistoryCopy.table.paymentNotApplicable}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

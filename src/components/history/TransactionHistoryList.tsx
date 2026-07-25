"use client";

import * as React from "react";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
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
import { bookingStatusLabel, type BookingStatusValue } from "@/lib/copy/bookings";
import { transactionHistoryCopy } from "@/lib/copy/history";
import { bookingHasPayment, DEFAULT_PAYMENT_STATUS, type PaymentDto } from "@/lib/copy/payments";
import { formatRupiah } from "@/lib/utils";

const ALL_BOOKING_STATUSES: BookingStatusValue[] = [
  "PENDING",
  "APPROVED",
  "ACTIVE",
  "LATE",
  "COMPLETED",
  "REJECTED",
];

/** One row of a user's (or an item's) transaction history — already scoped/enriched by the calling page. */
export interface HistoryTransaction {
  id: string;
  itemName: string;
  /** Renter name when `role="OWNER"`, owner name when `role="RENTER"`. */
  counterpartName: string;
  startDate: string;
  endDate: string;
  requestedAt: string;
  totalPrice: number;
  status: BookingStatusValue;
  payment: PaymentDto | null;
}

type StatusFilter = "ALL" | BookingStatusValue;
type SortOrder = "desc" | "asc";

interface TransactionHistoryListProps {
  transactions: HistoryTransaction[];
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
 * own already-scoped, already-enriched transaction list; this component
 * only handles status filtering, date sorting, and rendering.
 */
export function TransactionHistoryList({
  transactions,
  role,
  showFilters = true,
}: TransactionHistoryListProps) {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");

  const counterpartLabel =
    role === "OWNER" ? transactionHistoryCopy.table.renterColumn : transactionHistoryCopy.table.ownerColumn;

  const filteredTransactions = React.useMemo(() => {
    const filtered =
      statusFilter === "ALL" ? transactions : transactions.filter((tx) => tx.status === statusFilter);

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [transactions, statusFilter, sortOrder]);

  if (transactions.length === 0) {
    return (
      <EmptyState
        title={transactionHistoryCopy.empty.noHistory.title}
        description={transactionHistoryCopy.empty.noHistory.description}
      />
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

      {filteredTransactions.length === 0 ? (
        <EmptyState
          title={transactionHistoryCopy.empty.noResults.title}
          description={transactionHistoryCopy.empty.noResults.description}
        />
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
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="max-w-48 truncate font-medium text-foreground">
                      {tx.itemName}
                      <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                        {counterpartLabel}: {tx.counterpartName}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {tx.counterpartName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tx.startDate)} — {formatDate(tx.endDate)}
                    </TableCell>
                    <TableCell>{formatRupiah(tx.totalPrice)}</TableCell>
                    <TableCell>
                      <BookingStatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell>
                      {bookingHasPayment(tx.status) ? (
                        <PaymentStatusBadge status={tx.payment?.status ?? DEFAULT_PAYMENT_STATUS} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {transactionHistoryCopy.table.paymentNotApplicable}
                        </span>
                      )}
                    </TableCell>
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

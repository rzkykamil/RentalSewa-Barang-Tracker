import type { Metadata } from "next";

import { TransactionHistoryList } from "@/components/history/TransactionHistoryList";
import { renterHistoryPageCopy } from "@/lib/copy/history";
import { getBookingsByRenter } from "@/lib/mock/bookings";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Riwayat Transaksi — Rental Sewa Barang Tracker",
};

export default function RenterHistoryPage() {
  const bookings = getBookingsByRenter(MOCK_USERS.RENTER.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{renterHistoryPageCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{renterHistoryPageCopy.subtitle}</p>
      </div>

      <TransactionHistoryList bookings={bookings} role="RENTER" />
    </div>
  );
}

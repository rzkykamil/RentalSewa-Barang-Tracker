import type { Metadata } from "next";

import { TransactionHistoryList } from "@/components/history/TransactionHistoryList";
import { ownerHistoryPageCopy } from "@/lib/copy/history";
import { getBookingsByOwner } from "@/lib/mock/bookings";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Riwayat Transaksi — Rental Sewa Barang Tracker",
};

export default function OwnerHistoryPage() {
  const bookings = getBookingsByOwner(MOCK_USERS.OWNER.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{ownerHistoryPageCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{ownerHistoryPageCopy.subtitle}</p>
      </div>

      <TransactionHistoryList bookings={bookings} role="OWNER" />
    </div>
  );
}

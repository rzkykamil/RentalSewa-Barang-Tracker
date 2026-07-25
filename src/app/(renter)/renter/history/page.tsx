import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState";
import { TransactionHistoryList, type HistoryTransaction } from "@/components/history/TransactionHistoryList";
import { renterHistoryPageCopy } from "@/lib/copy/history";
import { bookingHasPayment } from "@/lib/copy/payments";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserProfile } from "@/modules/auth/auth.service";
import { listHistoryForUser, type HistoryBookingDto } from "@/modules/bookings/bookings.service";
import { getPaymentForBooking } from "@/modules/payments/payments.service";

export const metadata: Metadata = {
  title: "Riwayat Transaksi — Rental Sewa Barang Tracker",
};

/**
 * Enriches raw history bookings with the owner's name (`HistoryBookingDto`
 * only carries `item.ownerId`) and the payment record, same pattern as
 * `enrichBookingsForRenter`/`enrichPaymentsForRenter` in
 * `src/app/(renter)/renter/bookings/page.tsx`.
 */
async function enrichHistoryForRenter(
  bookings: HistoryBookingDto[],
  renterId: string
): Promise<HistoryTransaction[]> {
  const uniqueOwnerIds = Array.from(new Set(bookings.map((booking) => booking.item.ownerId)));
  const owners = await Promise.all(uniqueOwnerIds.map((ownerId) => getUserProfile(ownerId)));
  const ownerById = new Map(owners.filter((owner) => owner !== null).map((owner) => [owner.id, owner]));

  const relevantBookings = bookings.filter((booking) => bookingHasPayment(booking.status));
  const paymentEntries = await Promise.all(
    relevantBookings.map(async (booking) => {
      try {
        const payment = await getPaymentForBooking(booking.id, renterId, "RENTER");
        return [
          booking.id,
          payment ? { ...payment, markedPaidAt: payment.markedPaidAt?.toISOString() ?? null } : null,
        ] as const;
      } catch {
        return [booking.id, null] as const;
      }
    })
  );
  const paymentById = Object.fromEntries(paymentEntries);

  return bookings.map((booking) => ({
    id: booking.id,
    itemName: booking.item.name,
    counterpartName: ownerById.get(booking.item.ownerId)?.name ?? "Pemilik tidak ditemukan",
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    requestedAt: booking.requestedAt.toISOString(),
    totalPrice: booking.totalPrice,
    status: booking.status,
    payment: paymentById[booking.id] ?? null,
  }));
}

export default async function RenterHistoryPage() {
  const user = await getCurrentUser();

  let transactions: HistoryTransaction[] = [];
  let loadError = false;
  try {
    const result = await listHistoryForUser(user.id, { page: 1, limit: 100 });
    transactions = await enrichHistoryForRenter(result.bookings, user.id);
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{renterHistoryPageCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{renterHistoryPageCopy.subtitle}</p>
      </div>

      {loadError ? (
        <EmptyState
          title="Gagal memuat riwayat transaksi"
          description="Terjadi kesalahan saat mengambil riwayat transaksi Anda. Coba muat ulang halaman."
        />
      ) : (
        <TransactionHistoryList transactions={transactions} role="RENTER" />
      )}
    </div>
  );
}

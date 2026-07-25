import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState";
import { TransactionHistoryList, type HistoryTransaction } from "@/components/history/TransactionHistoryList";
import { ownerHistoryPageCopy } from "@/lib/copy/history";
import { bookingHasPayment } from "@/lib/copy/payments";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserProfile } from "@/modules/auth/auth.service";
import { listHistoryForUser, type HistoryBookingDto } from "@/modules/bookings/bookings.service";
import { getPaymentForBooking } from "@/modules/payments/payments.service";

export const metadata: Metadata = {
  title: "Riwayat Transaksi — Rental Sewa Barang Tracker",
};

/**
 * Enriches raw history bookings with the renter's name (`HistoryBookingDto`
 * only carries `renterId`) and the payment record, same pattern as
 * `enrichBookingsForOwner`/`enrichPaymentsForOwner` in
 * `src/app/(owner)/owner/bookings/page.tsx`.
 */
async function enrichHistoryForOwner(
  bookings: HistoryBookingDto[],
  ownerId: string
): Promise<HistoryTransaction[]> {
  const uniqueRenterIds = Array.from(new Set(bookings.map((booking) => booking.renterId)));
  const renters = await Promise.all(uniqueRenterIds.map((renterId) => getUserProfile(renterId)));
  const renterById = new Map(renters.filter((renter) => renter !== null).map((renter) => [renter.id, renter]));

  const relevantBookings = bookings.filter((booking) => bookingHasPayment(booking.status));
  const paymentEntries = await Promise.all(
    relevantBookings.map(async (booking) => {
      try {
        const payment = await getPaymentForBooking(booking.id, ownerId, "OWNER");
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
    counterpartName: renterById.get(booking.renterId)?.name ?? "Penyewa tidak ditemukan",
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    requestedAt: booking.requestedAt.toISOString(),
    totalPrice: booking.totalPrice,
    status: booking.status,
    payment: paymentById[booking.id] ?? null,
  }));
}

export default async function OwnerHistoryPage() {
  const user = await getCurrentUser();

  let transactions: HistoryTransaction[] = [];
  let loadError = false;
  try {
    const result = await listHistoryForUser(user.id, { page: 1, limit: 100 });
    transactions = await enrichHistoryForOwner(result.bookings, user.id);
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{ownerHistoryPageCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{ownerHistoryPageCopy.subtitle}</p>
      </div>

      {loadError ? (
        <EmptyState
          title="Gagal memuat riwayat transaksi"
          description="Terjadi kesalahan saat mengambil riwayat transaksi Anda. Coba muat ulang halaman."
        />
      ) : (
        <TransactionHistoryList transactions={transactions} role="OWNER" />
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TransactionHistoryList, type HistoryTransaction } from "@/components/history/TransactionHistoryList";
import { ItemPhotoGallery } from "@/components/items/ItemPhotoGallery";
import { ItemStatusBadge } from "@/components/items/ItemStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { itemConditionLabel, ownerItemDetailCopy } from "@/lib/copy/items";
import { transactionHistoryCopy } from "@/lib/copy/history";
import { bookingHasPayment } from "@/lib/copy/payments";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getItemById } from "@/modules/items/items.service";
import { listBookingsForItem, type ItemBookingDto } from "@/modules/bookings/bookings.service";
import { getPaymentForBooking } from "@/modules/payments/payments.service";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detail Barang — Rental Sewa Barang Tracker",
};

interface OwnerItemDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Enriches an item's bookings with the payment record for the compact,
 * filter-less `TransactionHistoryList` shown on this page — same pattern as
 * `enrichHistoryForOwner` in `src/app/(owner)/owner/history/page.tsx`, but
 * `ItemBookingDto` already carries the renter name so no extra user lookup
 * is needed, and `itemName` is the already-loaded `item.name`.
 */
async function enrichItemHistory(
  bookings: ItemBookingDto[],
  itemName: string,
  ownerId: string
): Promise<HistoryTransaction[]> {
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
    itemName,
    counterpartName: booking.renter.name,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    requestedAt: booking.requestedAt.toISOString(),
    totalPrice: booking.totalPrice,
    status: booking.status,
    payment: paymentById[booking.id] ?? null,
  }));
}

export default async function OwnerItemDetailPage({ params }: OwnerItemDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const item = await getItemById(id);

  // Only the owning Owner may view this page — matches the permission
  // matrix in docs/prd.md §7 (Owner can only manage their own listings).
  if (!item || item.ownerId !== user.id) {
    notFound();
  }

  let itemHistory: HistoryTransaction[] = [];
  let loadError = false;
  try {
    const result = await listBookingsForItem(item.id, user.id, "OWNER", { page: 1, limit: 100 });
    itemHistory = await enrichItemHistory(result.bookings, item.name, user.id);
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ItemPhotoGallery photos={item.photos} itemName={item.name} />

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-semibold text-foreground">{item.name}</h1>
            <ItemStatusBadge status={item.status} className="shrink-0" />
          </div>

          <p className="text-sm text-muted-foreground">{item.category}</p>

          <p className="text-2xl font-semibold text-foreground">
            {formatRupiah(item.pricePerDay)}
            <span className="text-sm font-normal text-muted-foreground">
              {ownerItemDetailCopy.perDay}
            </span>
          </p>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{ownerItemDetailCopy.conditionLabel}</dt>
              <dd className="font-medium text-foreground">{itemConditionLabel[item.condition]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{ownerItemDetailCopy.categoryLabel}</dt>
              <dd className="font-medium text-foreground">{item.category}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-foreground">
              {ownerItemDetailCopy.descriptionTitle}
            </h2>
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {item.description || "Belum ada deskripsi."}
            </p>
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href={`/owner/items/${item.id}/edit`}>{ownerItemDetailCopy.editButton}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/owner/items">{ownerItemDetailCopy.backToItems}</Link>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-foreground">
            {transactionHistoryCopy.itemHistorySection.title}
          </h2>
          {loadError ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              Gagal memuat riwayat transaksi barang ini.
            </p>
          ) : itemHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {transactionHistoryCopy.itemHistorySection.empty}
            </p>
          ) : (
            <TransactionHistoryList transactions={itemHistory} role="OWNER" showFilters={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

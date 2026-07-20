import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TransactionHistoryList } from "@/components/history/TransactionHistoryList";
import { ItemPhotoGallery } from "@/components/items/ItemPhotoGallery";
import { ItemStatusBadge } from "@/components/items/ItemStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { itemConditionLabel, ownerItemDetailCopy } from "@/lib/copy/items";
import { transactionHistoryCopy } from "@/lib/copy/history";
import { getBookingsByOwner } from "@/lib/mock/bookings";
import { getItemPhotos, MOCK_ITEMS } from "@/lib/mock/items";
import { MOCK_USERS } from "@/lib/mock/session";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detail Barang — Rental Sewa Barang Tracker",
};

interface OwnerItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerItemDetailPage({ params }: OwnerItemDetailPageProps) {
  const { id } = await params;
  const item = MOCK_ITEMS.find((candidate) => candidate.id === id);

  // Only the owning Owner may view this page — matches the permission
  // matrix in docs/prd.md §7 (Owner can only manage their own listings).
  if (!item || item.ownerId !== MOCK_USERS.OWNER.id) {
    notFound();
  }

  const photos = getItemPhotos(item.id);
  const itemBookings = getBookingsByOwner(MOCK_USERS.OWNER.id).filter(
    (booking) => booking.itemId === item.id
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ItemPhotoGallery photos={photos} itemName={item.name} />

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
            <p className="text-sm whitespace-pre-line text-muted-foreground">{item.description}</p>
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
          {itemBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {transactionHistoryCopy.itemHistorySection.empty}
            </p>
          ) : (
            <TransactionHistoryList bookings={itemBookings} role="OWNER" showFilters={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

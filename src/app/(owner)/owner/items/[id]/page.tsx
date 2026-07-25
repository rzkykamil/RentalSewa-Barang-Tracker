import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ItemPhotoGallery } from "@/components/items/ItemPhotoGallery";
import { ItemStatusBadge } from "@/components/items/ItemStatusBadge";
import { Button } from "@/components/ui/button";
import { itemConditionLabel, ownerItemDetailCopy } from "@/lib/copy/items";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getItemById } from "@/modules/items/items.service";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detail Barang — Rental Sewa Barang Tracker",
};

interface OwnerItemDetailPageProps {
  params: Promise<{ id: string }>;
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
    </div>
  );
}

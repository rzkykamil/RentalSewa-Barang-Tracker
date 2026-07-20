import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OwnerItemEditForm } from "@/components/items/OwnerItemEditForm";
import { itemFormCopy } from "@/lib/copy/items";
import { getItemPhotos, MOCK_ITEMS } from "@/lib/mock/items";

export const metadata: Metadata = {
  title: "Edit Barang — Rental Sewa Barang Tracker",
};

interface OwnerItemEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerItemEditPage({ params }: OwnerItemEditPageProps) {
  const { id } = await params;
  const item = MOCK_ITEMS.find((candidate) => candidate.id === id);

  if (!item) {
    notFound();
  }

  const photos = getItemPhotos(item.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{itemFormCopy.editTitle}</h1>
        <p className="text-sm text-muted-foreground">{itemFormCopy.editSubtitle}</p>
      </div>
      <OwnerItemEditForm item={item} photos={photos} />
    </div>
  );
}

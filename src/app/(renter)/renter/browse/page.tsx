import type { Metadata } from "next";

import { BrowseItemsView } from "@/components/items/BrowseItemsView";
import { browseCopy } from "@/lib/copy/items";
import { getItemPhotos, MOCK_CATEGORIES, MOCK_ITEMS } from "@/lib/mock/items";

export const metadata: Metadata = {
  title: "Jelajah Barang — Rental Sewa Barang Tracker",
};

export default function RenterBrowsePage() {
  const primaryPhotoByItemId = Object.fromEntries(
    MOCK_ITEMS.map((item) => [item.id, getItemPhotos(item.id)[0]?.url])
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{browseCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{browseCopy.subtitle}</p>
      </div>
      <BrowseItemsView
        items={MOCK_ITEMS}
        categories={[...MOCK_CATEGORIES]}
        primaryPhotoByItemId={primaryPhotoByItemId}
      />
    </div>
  );
}

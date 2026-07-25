import type { Metadata } from "next";

import { BrowseItemsView, type BrowseSortOption } from "@/components/items/BrowseItemsView";
import { browseCopy } from "@/lib/copy/items";
import { ITEM_CATEGORIES } from "@/lib/constants/items";
import { listItems } from "@/modules/items/items.service";

export const metadata: Metadata = {
  title: "Jelajah Barang — Rental Sewa Barang Tracker",
};

const PAGE_SIZE = 12;

interface RenterBrowsePageProps {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

function parseNumericParam(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function RenterBrowsePage({ searchParams }: RenterBrowsePageProps) {
  const params = await searchParams;

  const category = params.category?.trim() || undefined;
  const minPrice = parseNumericParam(params.minPrice);
  const maxPrice = parseNumericParam(params.maxPrice);
  const sort: BrowseSortOption = params.sort === "price_desc" ? "price_desc" : "price_asc";
  const page = Math.max(1, Number(params.page) || 1);

  let items: Awaited<ReturnType<typeof listItems>>["items"] = [];
  let pagination: Awaited<ReturnType<typeof listItems>>["pagination"] | null = null;
  let loadError = false;

  try {
    const result = await listItems({
      category,
      minPrice,
      maxPrice,
      sort,
      page,
      limit: PAGE_SIZE,
    });
    items = result.items;
    pagination = result.pagination;
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{browseCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{browseCopy.subtitle}</p>
      </div>
      <BrowseItemsView
        items={items}
        categories={[...ITEM_CATEGORIES]}
        pagination={pagination}
        loadError={loadError}
        filters={{
          category: category ?? "",
          minPrice: params.minPrice ?? "",
          maxPrice: params.maxPrice ?? "",
          sort,
        }}
      />
    </div>
  );
}

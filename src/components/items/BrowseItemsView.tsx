"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/auth/FormField";
import { EmptyState } from "@/components/shared/EmptyState";
import { ItemCard } from "@/components/items/ItemCard";
import { browseCopy } from "@/lib/copy/items";
import type { MockItem } from "@/lib/mock/items";

type SortOption = (typeof browseCopy.filters.sort.options)[number]["value"];

const ALL_CATEGORIES_VALUE = "ALL";

interface BrowseItemsViewProps {
  items: MockItem[];
  categories: string[];
  primaryPhotoByItemId: Record<string, string | undefined>;
}

/**
 * Client-side filter/sort view for the Browse & Discovery page. Shows all
 * items regardless of status (not just TERSEDIA) — a real inventory
 * browse page should reflect items that are DISEWA/TELAT_KEMBALI too, with
 * the status badge communicating availability rather than hiding them.
 */
export function BrowseItemsView({
  items,
  categories,
  primaryPhotoByItemId,
}: BrowseItemsViewProps) {
  const [category, setCategory] = React.useState<string>(ALL_CATEGORIES_VALUE);
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [sort, setSort] = React.useState<SortOption>("price-asc");

  const filteredItems = React.useMemo(() => {
    const min = minPrice.trim() ? Number(minPrice) : undefined;
    const max = maxPrice.trim() ? Number(maxPrice) : undefined;

    return items
      .filter((item) => category === ALL_CATEGORIES_VALUE || item.category === category)
      .filter((item) => (min === undefined || Number.isNaN(min) ? true : item.pricePerDay >= min))
      .filter((item) => (max === undefined || Number.isNaN(max) ? true : item.pricePerDay <= max))
      .sort((a, b) => (sort === "price-asc" ? a.pricePerDay - b.pricePerDay : b.pricePerDay - a.pricePerDay));
  }, [items, category, minPrice, maxPrice, sort]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField id="browse-category" label={browseCopy.filters.category.label}>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="browse-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_VALUE}>
                  {browseCopy.filters.category.allOption}
                </SelectItem>
                {categories.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="browse-min-price" label={browseCopy.filters.minPrice.label}>
            <Input
              id="browse-min-price"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={browseCopy.filters.minPrice.placeholder}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />
          </FormField>

          <FormField id="browse-max-price" label={browseCopy.filters.maxPrice.label}>
            <Input
              id="browse-max-price"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={browseCopy.filters.maxPrice.placeholder}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </FormField>

          <FormField id="browse-sort" label={browseCopy.filters.sort.label}>
            <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <SelectTrigger id="browse-sort" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {browseCopy.filters.sort.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      {filteredItems.length === 0 ? (
        <EmptyState title={browseCopy.empty.title} description={browseCopy.empty.description} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              photoUrl={primaryPhotoByItemId[item.id]}
              href={`/renter/browse/${item.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
import type { ItemDto } from "@/modules/items/items.service";

export type BrowseSortOption = "price_asc" | "price_desc";

export interface BrowsePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BrowseFilters {
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: BrowseSortOption;
}

const ALL_CATEGORIES_VALUE = "ALL";

interface BrowseItemsViewProps {
  items: ItemDto[];
  categories: string[];
  pagination: BrowsePagination | null;
  filters: BrowseFilters;
  loadError: boolean;
}

/**
 * Filter/sort/pagination controls for the Browse & Discovery page. Unlike
 * the mock-data phase, filtering happens server-side (`GET /api/v1/items`,
 * called from `renter/browse/page.tsx`) — this component only reflects the
 * current URL query params and pushes new ones on change, it doesn't filter
 * `items` locally.
 */
export function BrowseItemsView({
  items,
  categories,
  pagination,
  filters,
  loadError,
}: BrowseItemsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const [category, setCategory] = React.useState(filters.category || ALL_CATEGORIES_VALUE);
  const [minPrice, setMinPrice] = React.useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = React.useState(filters.maxPrice);

  function navigate(next: Partial<{
    category: string;
    minPrice: string;
    maxPrice: string;
    sort: BrowseSortOption;
    page: number;
  }>) {
    const merged = {
      category,
      minPrice,
      maxPrice,
      sort: filters.sort,
      page: 1,
      ...next,
    };

    const params = new URLSearchParams();
    if (merged.category && merged.category !== ALL_CATEGORIES_VALUE) {
      params.set("category", merged.category);
    }
    if (merged.minPrice.trim()) params.set("minPrice", merged.minPrice.trim());
    if (merged.maxPrice.trim()) params.set("maxPrice", merged.maxPrice.trim());
    params.set("sort", merged.sort);
    if (merged.page > 1) params.set("page", String(merged.page));

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    navigate({ category: value });
  }

  function handleSortChange(value: string) {
    navigate({ sort: value as BrowseSortOption });
  }

  function handlePriceFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ minPrice, maxPrice });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={handlePriceFilterSubmit}
          >
            <FormField id="browse-category" label={browseCopy.filters.category.label}>
              <Select value={category} onValueChange={handleCategoryChange}>
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
              <Select value={filters.sort} onValueChange={handleSortChange}>
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

            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" variant="outline" size="sm">
                Terapkan Rentang Harga
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isPending && <p className="text-sm text-muted-foreground">Memuat...</p>}

      {loadError ? (
        <EmptyState title={browseCopy.loadError.title} description={browseCopy.loadError.description} />
      ) : items.length === 0 ? (
        <EmptyState title={browseCopy.empty.title} description={browseCopy.empty.description} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} href={`/renter/browse/${item.id}`} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => navigate({ page: pagination.page - 1 })}
              >
                {browseCopy.pagination.previous}
              </Button>
              <span className="text-sm text-muted-foreground">
                {browseCopy.pagination.summary(pagination.page, pagination.totalPages)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => navigate({ page: pagination.page + 1 })}
              >
                {browseCopy.pagination.next}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

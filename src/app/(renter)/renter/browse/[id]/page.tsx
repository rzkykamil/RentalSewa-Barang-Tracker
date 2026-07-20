import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ItemStatusBadge } from "@/components/items/ItemStatusBadge";
import { ItemPhotoGallery } from "@/components/items/ItemPhotoGallery";
import { RatingStars } from "@/components/items/RatingStars";
import { itemConditionLabel, itemDetailCopy } from "@/lib/copy/items";
import {
  getItemPhotos,
  getItemRating,
  MOCK_ITEMS,
  MOCK_REVIEWS,
} from "@/lib/mock/items";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detail Barang — Rental Sewa Barang Tracker",
};

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;
  const item = MOCK_ITEMS.find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-medium text-foreground">{itemDetailCopy.notFoundTitle}</p>
          <p className="text-sm text-muted-foreground">{itemDetailCopy.notFoundDescription}</p>
          <Button asChild variant="outline">
            <Link href="/renter/browse">{itemDetailCopy.backToBrowse}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const photos = getItemPhotos(item.id);
  const rating = getItemRating(item.id);
  const reviews = MOCK_REVIEWS.filter((review) => review.itemId === item.id);
  const canRequest = item.status === "TERSEDIA";

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

          <div className="flex items-center gap-2">
            {rating ? (
              <>
                <RatingStars rating={rating.average} />
                <span className="text-sm text-muted-foreground">
                  {rating.average.toFixed(1)} {itemDetailCopy.ratingCount(rating.count)}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                {itemDetailCopy.ratingNoReviews}
              </span>
            )}
          </div>

          <p className="text-2xl font-semibold text-foreground">
            {formatRupiah(item.pricePerDay)}
            <span className="text-sm font-normal text-muted-foreground">
              {itemDetailCopy.perDay}
            </span>
          </p>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{itemDetailCopy.conditionLabel}</dt>
              <dd className="font-medium text-foreground">
                {itemConditionLabel[item.condition]}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{itemDetailCopy.ownerLabel}</dt>
              <dd className="font-medium text-foreground">{item.ownerName}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-foreground">
              {itemDetailCopy.descriptionTitle}
            </h2>
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {item.description}
            </p>
          </div>

          {canRequest ? (
            <Button asChild size="lg" className="mt-2 w-full sm:w-auto">
              <Link href={`/renter/browse/${item.id}/request`}>
                {itemDetailCopy.requestButton}
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              disabled
              title={itemDetailCopy.requestButtonDisabledHint}
              className="mt-2 w-full sm:w-auto"
            >
              {itemDetailCopy.requestButton}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-foreground">{itemDetailCopy.reviewsTitle}</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">{itemDetailCopy.ratingNoReviews}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {reviews.map((review) => (
                <li key={review.id} className="flex flex-col gap-1 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {review.renterName}
                    </span>
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { MockItemPhoto } from "@/lib/mock/items";

interface ItemPhotoGalleryProps {
  photos: MockItemPhoto[];
  itemName: string;
}

/** Simple main-image + thumbnail gallery, no carousel library needed. */
export function ItemPhotoGallery({ photos, itemName }: ItemPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activePhoto = photos[activeIndex];

  if (!activePhoto) {
    return (
      <div className="flex aspect-4/3 w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Tidak ada foto
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-4/3 w-full overflow-hidden rounded-xl bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- mock placeholder photo, not a real remote asset config */}
        <img
          src={activePhoto.url}
          alt={`Foto ${itemName} ${activeIndex + 1}`}
          className="size-full object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Lihat foto ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-lg ring-2 transition-colors",
                index === activeIndex ? "ring-ring" : "ring-transparent hover:ring-border"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- mock placeholder photo, not a real remote asset config */}
              <img src={photo.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

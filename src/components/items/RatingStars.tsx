import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface RatingStarsProps {
  /** Average rating from 0 to 5, can be fractional (rounded to nearest star). */
  rating: number;
  className?: string;
}

/**
 * Simple, non-interactive 1-5 star display used on the item detail page.
 * Rendered with `role="img"` + text label so the rating value doesn't
 * rely on color/shape alone (docs/design-system.md §5).
 */
export function RatingStars({ rating, className }: RatingStarsProps) {
  const roundedRating = Math.round(rating);

  return (
    <span
      role="img"
      aria-label={`Rating ${rating.toFixed(1)} dari 5`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            "size-4",
            index < roundedRating
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  );
}

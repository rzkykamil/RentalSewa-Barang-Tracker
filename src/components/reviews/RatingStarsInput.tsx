"use client";

import { Star } from "lucide-react";

import { reviewFormCopy } from "@/lib/copy/reviews";
import { cn } from "@/lib/utils";

interface RatingStarsInputProps {
  /** Currently selected rating, 0 means nothing selected yet. */
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Interactive 1-5 star rating picker used by `ReviewForm`. Each star is a
 * real `<button>` (not a bare `onClick` div) so it is reachable and
 * operable via keyboard, and carries its own `aria-label` so the value
 * doesn't rely on color/shape alone (docs/design-system.md §5).
 */
export function RatingStarsInput({ value, onChange, disabled, className }: RatingStarsInputProps) {
  return (
    <div role="radiogroup" aria-label={reviewFormCopy.fields.rating.label} className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1;
        const isSelected = star <= value;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={reviewFormCopy.starLabel(star)}
            disabled={disabled}
            onClick={() => onChange(star)}
            className="rounded-sm p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Star
              aria-hidden="true"
              className={cn(
                "size-6 transition-colors",
                isSelected ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

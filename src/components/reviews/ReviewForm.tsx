"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/auth/FormField";
import { RatingStarsInput } from "@/components/reviews/RatingStarsInput";
import { reviewFormCopy } from "@/lib/copy/reviews";

interface ReviewFormProps {
  bookingId: string;
  itemName: string;
  onSubmitted: (rating: number, comment: string) => void;
}

interface FormErrors {
  rating?: string;
  comment?: string;
}

/**
 * Form to give a 1-5 star rating + comment for a COMPLETED booking. Periode
 * 13 (frontend + mock data only): submitting only calls `onSubmitted` so the
 * parent page can update local state — no real persistence to MOCK_REVIEWS
 * yet, matching the mock-mutation pattern used by OwnerPaymentForm/ItemForm
 * (see docs/todo/frontend.md Modul Rating/Review).
 */
export function ReviewForm({ bookingId, itemName, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isLoading, setIsLoading] = React.useState(false);

  const commentFieldId = `review-comment-${bookingId}`;

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (rating <= 0) nextErrors.rating = reviewFormCopy.errors.ratingRequired;
    if (!comment.trim()) nextErrors.comment = reviewFormCopy.errors.commentRequired;
    return nextErrors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);

    // Simulated network round-trip (mock only — no real persistence yet).
    setTimeout(() => {
      setIsLoading(false);
      onSubmitted(rating, comment.trim());
    }, 600);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">{reviewFormCopy.dialogDescription(itemName)}</p>

      <FormField id={`review-rating-${bookingId}`} label={reviewFormCopy.fields.rating.label} error={errors.rating}>
        <RatingStarsInput
          value={rating}
          onChange={(nextValue) => {
            setRating(nextValue);
            setErrors((prev) => ({ ...prev, rating: undefined }));
          }}
          disabled={isLoading}
        />
      </FormField>

      <FormField id={commentFieldId} label={reviewFormCopy.fields.comment.label} error={errors.comment}>
        <Textarea
          id={commentFieldId}
          name="comment"
          placeholder={reviewFormCopy.fields.comment.placeholder}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setErrors((prev) => ({ ...prev, comment: undefined }));
          }}
          disabled={isLoading}
          rows={3}
          aria-invalid={Boolean(errors.comment)}
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isLoading ? reviewFormCopy.submitLoading : reviewFormCopy.submit}
        </Button>
      </div>
    </form>
  );
}

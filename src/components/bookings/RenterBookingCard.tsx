"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";
import { PaymentStatusDisplay } from "@/components/payments/PaymentStatusDisplay";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { renterBookingsCopy, type BookingStatusValue } from "@/lib/copy/bookings";
import { reviewFormCopy } from "@/lib/copy/reviews";
import { bookingHasPayment, type PaymentDto } from "@/lib/copy/payments";
import { formatRupiah } from "@/lib/utils";

/** Enriched booking (real `BookingDto` + resolved item/owner names) for the Renter "Booking Saya" page. */
export interface RenterBooking {
  id: string;
  itemName: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatusValue;
  notes: string | null;
  hasReview: boolean;
}

interface RenterBookingCardProps {
  booking: RenterBooking;
  payment: PaymentDto | null;
}

function formatDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return `${formatter.format(new Date(startDate))} — ${formatter.format(new Date(endDate))}`;
}

export function RenterBookingCard({ booking, payment }: RenterBookingCardProps) {
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [justReviewed, setJustReviewed] = React.useState(false);
  const canReview = booking.status === "COMPLETED" && !booking.hasReview && !justReviewed;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-medium text-foreground">{booking.itemName}</h2>
            <p className="text-sm text-muted-foreground">
              {renterBookingsCopy.card.ownerLabel}: {booking.ownerName}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} className="shrink-0" />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{renterBookingsCopy.card.periodLabel}</dt>
            <dd className="font-medium text-foreground">
              {formatDateRange(booking.startDate, booking.endDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{renterBookingsCopy.card.totalLabel}</dt>
            <dd className="font-medium text-foreground">{formatRupiah(booking.totalPrice)}</dd>
          </div>
        </dl>

        {booking.status === "REJECTED" ? (
          <p className="rounded-md bg-status-inactive/10 px-3 py-2 text-sm text-muted-foreground">
            {renterBookingsCopy.rejectedNote}
          </p>
        ) : (
          <BookingTimeline status={booking.status} />
        )}

        {bookingHasPayment(booking.status) && <PaymentStatusDisplay payment={payment} />}

        {booking.status === "COMPLETED" &&
          (canReview ? (
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="self-start">
                  {reviewFormCopy.trigger}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{reviewFormCopy.dialogTitle}</DialogTitle>
                </DialogHeader>
                <ReviewForm
                  bookingId={booking.id}
                  itemName={booking.itemName}
                  onSubmitted={() => {
                    setJustReviewed(true);
                    setReviewDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-sm font-medium text-status-positive">{reviewFormCopy.alreadyReviewed}</p>
          ))}
      </CardContent>
    </Card>
  );
}

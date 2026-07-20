"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/auth/FormField";
import { bookingRequestFormCopy } from "@/lib/copy/bookings";
import { calculateBookingDays } from "@/lib/mock/bookings";
import { formatRupiah } from "@/lib/utils";

interface FieldErrors {
  startDate?: string;
  endDate?: string;
}

interface BookingRequestFormProps {
  itemId: string;
  itemName: string;
  pricePerDay: number;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Request-sewa form for a single barang. Periode 4 (frontend + mock data
 * only): submitting simulates a network round-trip and does not create a
 * real booking record — see docs/todo/frontend.md.
 */
export function BookingRequestForm({ itemId, itemName, pricePerDay }: BookingRequestFormProps) {
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  const days =
    startDate && endDate && new Date(endDate) > new Date(startDate)
      ? calculateBookingDays(startDate, endDate)
      : null;
  const totalPrice = days ? days * pricePerDay : null;

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};
    const today = todayDateString();

    if (!startDate) {
      nextErrors.startDate = bookingRequestFormCopy.errors.startDateRequired;
    } else if (startDate < today) {
      nextErrors.startDate = bookingRequestFormCopy.errors.startDatePast;
    }

    if (!endDate) {
      nextErrors.endDate = bookingRequestFormCopy.errors.endDateRequired;
    } else if (startDate && endDate <= startDate) {
      nextErrors.endDate = bookingRequestFormCopy.errors.endDateBeforeStart;
    }

    return nextErrors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("loading");

    // Simulated network round-trip (mock only — no real persistence yet).
    setTimeout(() => {
      setStatus("success");
    }, 800);
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <Card className="max-w-xl">
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <p className="text-sm text-muted-foreground">
            {bookingRequestFormCopy.subtitle(itemName)}
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="booking-start-date"
              label={bookingRequestFormCopy.fields.startDate.label}
              error={errors.startDate}
            >
              <Input
                id="booking-start-date"
                name="startDate"
                type="date"
                min={todayDateString()}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={Boolean(errors.startDate)}
                disabled={isLoading || isSuccess}
              />
            </FormField>

            <FormField
              id="booking-end-date"
              label={bookingRequestFormCopy.fields.endDate.label}
              error={errors.endDate}
            >
              <Input
                id="booking-end-date"
                name="endDate"
                type="date"
                min={startDate || todayDateString()}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                aria-invalid={Boolean(errors.endDate)}
                disabled={isLoading || isSuccess}
              />
            </FormField>
          </div>

          <FormField id="booking-notes" label={bookingRequestFormCopy.fields.notes.label}>
            <Textarea
              id="booking-notes"
              name="notes"
              placeholder={bookingRequestFormCopy.fields.notes.placeholder}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={isLoading || isSuccess}
              rows={3}
            />
          </FormField>

          <div className="rounded-md border border-border bg-muted/40 p-4">
            <h2 className="text-sm font-medium text-foreground">
              {bookingRequestFormCopy.priceSummary.title}
            </h2>
            {totalPrice && days ? (
              <dl className="mt-2 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {bookingRequestFormCopy.priceSummary.pricePerDay}
                  </dt>
                  <dd className="text-foreground">{formatRupiah(pricePerDay)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Durasi</dt>
                  <dd className="text-foreground">
                    {bookingRequestFormCopy.priceSummary.duration(days)}
                  </dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold">
                  <dt className="text-foreground">{bookingRequestFormCopy.priceSummary.total}</dt>
                  <dd className="text-foreground">{formatRupiah(totalPrice)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {bookingRequestFormCopy.priceSummary.placeholder}
              </p>
            )}
          </div>

          {isSuccess && (
            <p role="status" className="text-sm font-medium text-status-positive">
              {bookingRequestFormCopy.success}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-sm font-medium text-destructive">
              Gagal mengirim permintaan sewa. Coba lagi.
            </p>
          )}

          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="outline">
              <Link href={`/renter/browse/${itemId}`}>{bookingRequestFormCopy.backToItem}</Link>
            </Button>
            <Button type="submit" disabled={isLoading || isSuccess}>
              {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isLoading ? bookingRequestFormCopy.submitLoading : bookingRequestFormCopy.submit}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

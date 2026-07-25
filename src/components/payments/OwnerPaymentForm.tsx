"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/auth/FormField";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import {
  DEFAULT_PAYMENT_STATUS,
  ownerPaymentCopy,
  type PaymentDto,
  type PaymentStatus,
} from "@/lib/copy/payments";

interface OwnerPaymentFormProps {
  bookingId: string;
  payment: PaymentDto | null;
  onSave: (status: PaymentStatus, methodNote: string | null) => Promise<void>;
}

/**
 * Owner-only form to mark a booking's payment as LUNAS/BELUM_LUNAS with an
 * optional free-text method note (`method_note` in docs/database-design.md
 * — no fixed enum of payment methods, so a text field matches the planned
 * schema). `onSave` performs the real `PATCH /bookings/:id/payment` call
 * (see `OwnerBookingsList`) — this form only owns its own loading/success/
 * error UI state.
 */
export function OwnerPaymentForm({ bookingId, payment, onSave }: OwnerPaymentFormProps) {
  const [status, setStatus] = React.useState<PaymentStatus>(
    payment?.status ?? DEFAULT_PAYMENT_STATUS
  );
  const [methodNote, setMethodNote] = React.useState(payment?.methodNote ?? "");
  const [isLoading, setIsLoading] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const statusFieldId = `payment-status-${bookingId}`;
  const methodNoteFieldId = `payment-method-note-${bookingId}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setJustSaved(false);
    setErrorMessage(null);

    try {
      await onSave(status, methodNote.trim() ? methodNote.trim() : null);
      setJustSaved(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : ownerPaymentCopy.error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{ownerPaymentCopy.title}</h3>
        <PaymentStatusBadge status={payment?.status ?? DEFAULT_PAYMENT_STATUS} />
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <FormField id={statusFieldId} label={ownerPaymentCopy.statusLabel}>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as PaymentStatus);
              setJustSaved(false);
            }}
            disabled={isLoading}
          >
            <SelectTrigger id={statusFieldId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BELUM_LUNAS">{ownerPaymentCopy.statusOptions.BELUM_LUNAS}</SelectItem>
              <SelectItem value="LUNAS">{ownerPaymentCopy.statusOptions.LUNAS}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField id={methodNoteFieldId} label={ownerPaymentCopy.methodNoteLabel}>
          <Textarea
            id={methodNoteFieldId}
            name="methodNote"
            placeholder={ownerPaymentCopy.methodNotePlaceholder}
            value={methodNote}
            onChange={(event) => {
              setMethodNote(event.target.value);
              setJustSaved(false);
            }}
            disabled={isLoading}
            rows={2}
          />
        </FormField>

        {justSaved && (
          <p role="status" className="text-sm font-medium text-status-positive">
            {ownerPaymentCopy.success}
          </p>
        )}

        {errorMessage && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isLoading ? ownerPaymentCopy.submitLoading : ownerPaymentCopy.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}

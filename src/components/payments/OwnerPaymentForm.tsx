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
import { ownerPaymentCopy } from "@/lib/copy/payments";
import { DEFAULT_PAYMENT_STATUS, type MockPayment, type PaymentStatus } from "@/lib/mock/payments";

interface OwnerPaymentFormProps {
  bookingId: string;
  payment: MockPayment | null;
  onSave: (status: PaymentStatus, methodNote: string | null) => void;
}

/**
 * Owner-only form to mark a booking's payment as LUNAS/BELUM_LUNAS with an
 * optional free-text method note (`method_note` in docs/database-design.md
 * — no fixed enum of payment methods, so a text field matches the planned
 * schema). Periode 10 (frontend + mock data only): saving only updates
 * local React state via `onSave`, no real persistence — see
 * docs/todo/frontend.md.
 */
export function OwnerPaymentForm({ bookingId, payment, onSave }: OwnerPaymentFormProps) {
  const [status, setStatus] = React.useState<PaymentStatus>(
    payment?.status ?? DEFAULT_PAYMENT_STATUS
  );
  const [methodNote, setMethodNote] = React.useState(payment?.methodNote ?? "");
  const [isLoading, setIsLoading] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);

  const statusFieldId = `payment-status-${bookingId}`;
  const methodNoteFieldId = `payment-method-note-${bookingId}`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setJustSaved(false);

    // Simulated network round-trip (mock only — no real persistence yet).
    setTimeout(() => {
      onSave(status, methodNote.trim() ? methodNote.trim() : null);
      setIsLoading(false);
      setJustSaved(true);
    }, 600);
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

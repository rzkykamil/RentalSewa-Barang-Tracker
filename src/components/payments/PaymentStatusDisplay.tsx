import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { renterPaymentCopy } from "@/lib/copy/payments";
import { DEFAULT_PAYMENT_STATUS, type MockPayment } from "@/lib/mock/payments";

interface PaymentStatusDisplayProps {
  payment: MockPayment | null;
}

/**
 * Read-only payment status view for the Renter side (permission matrix in
 * docs/prd.md §7: Renter cannot mark payment status, only view it). Falls
 * back to the default BELUM_LUNAS state when no payment record exists yet.
 */
export function PaymentStatusDisplay({ payment }: PaymentStatusDisplayProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{renterPaymentCopy.title}</h3>
        <PaymentStatusBadge status={payment?.status ?? DEFAULT_PAYMENT_STATUS} />
      </div>
      <p className="text-sm text-muted-foreground">
        {payment?.methodNote ? (
          <>
            {renterPaymentCopy.methodNoteLabel}: <span className="text-foreground">{payment.methodNote}</span>
          </>
        ) : (
          renterPaymentCopy.noteEmpty
        )}
      </p>
    </div>
  );
}

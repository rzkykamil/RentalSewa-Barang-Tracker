import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { OwnerPaymentForm } from "@/components/payments/OwnerPaymentForm";
import { ownerBookingsCopy } from "@/lib/copy/bookings";
import type { MockBooking } from "@/lib/mock/bookings";
import { bookingHasPayment, type MockPayment, type PaymentStatus } from "@/lib/mock/payments";
import { formatRupiah } from "@/lib/utils";

interface OwnerBookingCardProps {
  booking: MockBooking;
  payment: MockPayment | null;
  onApprove: () => void;
  onReject: () => void;
  onMarkActive: () => void;
  onMarkCompleted: () => void;
  onUpdatePayment: (status: PaymentStatus, methodNote: string | null) => void;
}

function formatDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return `${formatter.format(new Date(startDate))} — ${formatter.format(new Date(endDate))}`;
}

export function OwnerBookingCard({
  booking,
  payment,
  onApprove,
  onReject,
  onMarkActive,
  onMarkCompleted,
  onUpdatePayment,
}: OwnerBookingCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-medium text-foreground">{booking.itemName}</h2>
            <p className="text-sm text-muted-foreground">
              {ownerBookingsCopy.card.renterLabel}: {booking.renterName}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} className="shrink-0" />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{ownerBookingsCopy.card.periodLabel}</dt>
            <dd className="font-medium text-foreground">
              {formatDateRange(booking.startDate, booking.endDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{ownerBookingsCopy.card.totalLabel}</dt>
            <dd className="font-medium text-foreground">{formatRupiah(booking.totalPrice)}</dd>
          </div>
          {booking.notes && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">{ownerBookingsCopy.card.notesLabel}</dt>
              <dd className="text-foreground">{booking.notes}</dd>
            </div>
          )}
        </dl>

        {booking.status === "PENDING" && (
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <ConfirmDialog
              trigger={<Button variant="outline">{ownerBookingsCopy.actions.reject}</Button>}
              title={ownerBookingsCopy.dialogs.reject.title}
              description={ownerBookingsCopy.dialogs.reject.description}
              confirmLabel={ownerBookingsCopy.dialogs.reject.confirm}
              onConfirm={onReject}
            />
            <ConfirmDialog
              trigger={<Button>{ownerBookingsCopy.actions.approve}</Button>}
              title={ownerBookingsCopy.dialogs.approve.title}
              description={ownerBookingsCopy.dialogs.approve.description}
              confirmLabel={ownerBookingsCopy.dialogs.approve.confirm}
              destructive={false}
              onConfirm={onApprove}
            />
          </div>
        )}

        {booking.status === "APPROVED" && (
          <div className="flex justify-end">
            <ConfirmDialog
              trigger={<Button>{ownerBookingsCopy.actions.markActive}</Button>}
              title={ownerBookingsCopy.dialogs.markActive.title}
              description={ownerBookingsCopy.dialogs.markActive.description}
              confirmLabel={ownerBookingsCopy.dialogs.markActive.confirm}
              destructive={false}
              onConfirm={onMarkActive}
            />
          </div>
        )}

        {booking.status === "ACTIVE" && (
          <div className="flex justify-end">
            <ConfirmDialog
              trigger={<Button>{ownerBookingsCopy.actions.markCompleted}</Button>}
              title={ownerBookingsCopy.dialogs.markCompleted.title}
              description={ownerBookingsCopy.dialogs.markCompleted.description}
              confirmLabel={ownerBookingsCopy.dialogs.markCompleted.confirm}
              destructive={false}
              onConfirm={onMarkCompleted}
            />
          </div>
        )}

        {bookingHasPayment(booking.status) && (
          <OwnerPaymentForm bookingId={booking.id} payment={payment} onSave={onUpdatePayment} />
        )}
      </CardContent>
    </Card>
  );
}

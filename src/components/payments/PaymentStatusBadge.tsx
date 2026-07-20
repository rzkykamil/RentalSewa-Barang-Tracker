import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { paymentStatusLabel } from "@/lib/copy/payments";
import type { PaymentStatus } from "@/lib/mock/payments";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

/**
 * Maps a payment's status enum to color + Indonesian label internally, per
 * docs/design-system.md §2 (status color mapping: LUNAS → hijau,
 * BELUM_LUNAS → merah) and §5 (badge must show a text label, not rely on
 * color alone).
 */
const STATUS_STYLES: Record<PaymentStatus, string> = {
  LUNAS: "bg-status-positive text-status-positive-foreground",
  BELUM_LUNAS: "bg-status-late text-status-late-foreground",
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_STYLES[status], className)}>
      {paymentStatusLabel[status]}
    </Badge>
  );
}

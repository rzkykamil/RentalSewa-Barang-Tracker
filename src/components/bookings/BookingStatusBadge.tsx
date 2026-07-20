import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { bookingStatusLabel } from "@/lib/copy/bookings";
import type { MockBookingStatus } from "@/lib/mock/bookings";

interface BookingStatusBadgeProps {
  status: MockBookingStatus;
  className?: string;
}

/**
 * Maps a booking's status enum to color + Indonesian label internally, per
 * docs/design-system.md §2 (status color mapping) and §5 (badge must show
 * a text label, not rely on color alone).
 */
const STATUS_STYLES: Record<MockBookingStatus, string> = {
  PENDING: "bg-status-pending text-status-pending-foreground",
  APPROVED: "bg-status-positive text-status-positive-foreground",
  ACTIVE: "bg-status-active text-status-active-foreground",
  COMPLETED: "bg-status-positive text-status-positive-foreground",
  REJECTED: "bg-status-inactive text-status-inactive-foreground",
};

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_STYLES[status], className)}>
      {bookingStatusLabel[status]}
    </Badge>
  );
}

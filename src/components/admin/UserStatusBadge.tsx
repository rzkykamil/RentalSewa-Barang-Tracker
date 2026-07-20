import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { userStatusLabel } from "@/lib/copy/admin";

interface UserStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

/**
 * Maps a user's active/inactive state to color + Indonesian label
 * internally, per docs/design-system.md §2 (status color mapping) and §5
 * (badge must show a text label, not rely on color alone). Reuses the same
 * status tokens as `ItemStatusBadge`/`BookingStatusBadge`
 * (`TERSEDIA`/`APPROVED` → positive green, `NONAKTIF`/`REJECTED` → inactive
 * gray) for consistency.
 */
export function UserStatusBadge({ isActive, className }: UserStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        isActive
          ? "bg-status-positive text-status-positive-foreground"
          : "bg-status-inactive text-status-inactive-foreground",
        className
      )}
    >
      {isActive ? userStatusLabel.active : userStatusLabel.inactive}
    </Badge>
  );
}

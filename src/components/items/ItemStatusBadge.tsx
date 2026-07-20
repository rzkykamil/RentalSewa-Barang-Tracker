import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { itemStatusLabel } from "@/lib/copy/items";
import type { MockItemStatus } from "@/lib/mock/items";

interface ItemStatusBadgeProps {
  status: MockItemStatus;
  className?: string;
}

/**
 * Maps an item's status enum to color + Indonesian label internally, per
 * docs/design-system.md §2 (status color mapping) and §5 (badge must show
 * a text label, not rely on color alone).
 */
const STATUS_STYLES: Record<MockItemStatus, string> = {
  TERSEDIA: "bg-status-positive text-status-positive-foreground",
  DISEWA: "bg-status-active text-status-active-foreground",
  TELAT_KEMBALI: "bg-status-late text-status-late-foreground",
  NONAKTIF: "bg-status-inactive text-status-inactive-foreground",
};

export function ItemStatusBadge({ status, className }: ItemStatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_STYLES[status], className)}>
      {itemStatusLabel[status]}
    </Badge>
  );
}

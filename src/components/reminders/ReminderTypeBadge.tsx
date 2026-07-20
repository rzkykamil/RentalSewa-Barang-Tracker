import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { reminderTypeLabel } from "@/lib/copy/reminders";
import type { ReminderType } from "@/lib/mock/reminders";

interface ReminderTypeBadgeProps {
  type: ReminderType;
  className?: string;
}

/**
 * Maps a reminder's type enum to color + Indonesian label internally, per
 * docs/design-system.md §2 (H-1 is a "menunggu aksi" state → amber like
 * `PENDING`; overdue is a "butuh perhatian" state → red like
 * `TELAT_KEMBALI`/`BELUM_LUNAS`) and §5 (badge must show a text label, not
 * rely on color alone).
 */
const TYPE_STYLES: Record<ReminderType, string> = {
  H1_REMINDER: "bg-status-pending text-status-pending-foreground",
  OVERDUE_ALERT: "bg-status-late text-status-late-foreground",
};

export function ReminderTypeBadge({ type, className }: ReminderTypeBadgeProps) {
  return (
    <Badge className={cn(TYPE_STYLES[type], className)}>{reminderTypeLabel[type]}</Badge>
  );
}

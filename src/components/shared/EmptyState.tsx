import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  /** Optional Lucide icon shown above the title (decorative only, hidden from screen readers). */
  icon?: LucideIcon;
  title: string;
  description: string;
  /** Optional call-to-action, e.g. a `Button`/`Link` to resolve the empty state. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty-state block for list/detail pages (no items, no bookings,
 * no results after filtering, not-found, etc.) — see
 * docs/todo/frontend.md cross-cutting `EmptyState`. Replaces the ad-hoc
 * `Card` + centered text markup that was previously duplicated per page.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        {Icon && <Icon className="mb-1 size-8 text-muted-foreground" aria-hidden="true" />}
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}

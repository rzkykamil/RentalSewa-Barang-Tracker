import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { bookingTimelineSteps } from "@/lib/copy/bookings";
import type { MockBookingStatus } from "@/lib/mock/bookings";

interface BookingTimelineProps {
  /** Timeline only covers the normal path — render REJECTED separately at the call site. */
  status: Exclude<MockBookingStatus, "REJECTED">;
  className?: string;
}

/**
 * Visual progress timeline for the normal booking path (PENDING → APPROVED
 * → ACTIVE → COMPLETED), per docs/design-system.md §1 ("alur booking
 * ditampilkan sebagai progress yang eksplisit"). Each step always shows a
 * text label so progress is not conveyed by color/position alone (§5).
 */
export function BookingTimeline({ status, className }: BookingTimelineProps) {
  const currentIndex = bookingTimelineSteps.findIndex((step) => step.status === status);

  return (
    <ol className={cn("flex w-full items-start", className)}>
      {bookingTimelineSteps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === bookingTimelineSteps.length - 1;

        return (
          <li key={step.status} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium",
                  isCompleted && "border-status-positive bg-status-positive text-status-positive-foreground",
                  isCurrent && "border-status-active bg-status-active text-status-active-foreground",
                  !isCompleted && !isCurrent && "border-border bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-1 h-0.5 flex-1",
                    isCompleted ? "bg-status-positive" : "bg-border"
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "mt-1.5 text-center text-xs font-medium",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

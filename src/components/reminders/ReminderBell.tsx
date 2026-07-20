"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReminderTypeBadge } from "@/components/reminders/ReminderTypeBadge";
import { reminderBellCopy } from "@/lib/copy/reminders";
import { countReminders, type MockReminder } from "@/lib/mock/reminders";

interface ReminderBellProps {
  reminders: MockReminder[];
  role: "OWNER" | "RENTER";
}

/** Number of reminders shown inline before collapsing into "+N notifikasi lainnya". */
const PREVIEW_LIMIT = 4;

/**
 * In-app notification badge/counter for the dashboard header (Periode 13 —
 * see docs/todo/frontend.md Modul Reminder). Shows the total count of
 * active H-1 + overdue reminders as a counter dot, and a dropdown preview
 * linking to the full "Notifikasi" page. `reminders` is pre-scoped by the
 * caller (via getRemindersForOwner/getRemindersForRenter).
 */
export function ReminderBell({ reminders, role }: ReminderBellProps) {
  const counts = countReminders(reminders);
  const notificationsHref = role === "OWNER" ? "/owner/notifications" : "/renter/notifications";
  const preview = reminders.slice(0, PREVIEW_LIMIT);
  const remainingCount = reminders.length - preview.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          counts.total > 0
            ? `${reminderBellCopy.triggerLabel} (${counts.total} belum dibaca)`
            : reminderBellCopy.triggerLabel
        }
        className="relative flex size-8 items-center justify-center rounded-full text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Bell className="size-4" aria-hidden="true" />
        {counts.total > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-late px-1 text-[10px] font-semibold text-status-late-foreground"
          >
            {counts.total > 9 ? "9+" : counts.total}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{reminderBellCopy.triggerLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {preview.length === 0 ? (
          <p className="px-1.5 py-3 text-center text-sm text-muted-foreground">
            {reminderBellCopy.emptyLabel}
          </p>
        ) : (
          <>
            {preview.map((reminder) => (
              <DropdownMenuItem key={reminder.id} asChild className="flex-col items-start gap-1">
                <Link href={notificationsHref}>
                  <div className="flex w-full items-center gap-2">
                    <ReminderTypeBadge type={reminder.type} />
                    <span className="truncate font-medium text-foreground">{reminder.itemName}</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
            {remainingCount > 0 && (
              <p className="px-1.5 py-1 text-xs text-muted-foreground">
                {reminderBellCopy.moreLabel(remainingCount)}
              </p>
            )}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={notificationsHref}>{reminderBellCopy.viewAllLabel}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

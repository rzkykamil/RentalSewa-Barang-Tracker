import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReminderTypeBadge } from "@/components/reminders/ReminderTypeBadge";
import { reminderListCopy } from "@/lib/copy/reminders";
import type { MockReminder } from "@/lib/mock/reminders";

interface ReminderListProps {
  reminders: MockReminder[];
  /** Determines the counterpart column & booking list link: Owner sees the renter, Renter sees the owner. */
  role: "OWNER" | "RENTER";
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

/**
 * Full in-app notification list for the Owner/Renter "Notifikasi" page, per
 * docs/todo/frontend.md Modul Reminder. Reminders are pre-scoped by the
 * caller (via getRemindersForOwner/getRemindersForRenter) — this component
 * only renders them, grouped visually by type via `ReminderTypeBadge`.
 */
export function ReminderList({ reminders, role }: ReminderListProps) {
  const bookingsHref = role === "OWNER" ? "/owner/bookings" : "/renter/bookings";
  const counterpartLabel =
    role === "OWNER" ? reminderListCopy.ownerCounterpartLabel : reminderListCopy.renterCounterpartLabel;

  if (reminders.length === 0) {
    return (
      <EmptyState title={reminderListCopy.empty.title} description={reminderListCopy.empty.description} />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {reminders.map((reminder) => {
        const counterpartName = role === "OWNER" ? reminder.renterName : reminder.ownerName;
        const message = reminderListCopy.messages[reminder.type](reminder.itemName);

        return (
          <li key={reminder.id}>
            <Card>
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReminderTypeBadge type={reminder.type} />
                    <span className="text-sm font-medium text-foreground">{reminder.itemName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{message}</p>
                  <p className="text-xs text-muted-foreground">
                    {counterpartLabel}: {counterpartName} &middot; {reminderListCopy.dueDateLabel}:{" "}
                    {formatDate(reminder.dueDate)}
                  </p>
                </div>
                <Link
                  href={bookingsHref}
                  className="shrink-0 self-start text-sm font-medium text-primary hover:underline"
                >
                  {reminderListCopy.viewBookingsLabel}
                </Link>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

import type { ReminderDto } from "@/modules/reminders/reminder.service";

export interface ReminderCounts {
  h1: number;
  overdue: number;
  total: number;
}

/**
 * Pure counting helper, kept in a client-safe module separate from
 * `reminder.service.ts` — that file also exports `runReminderJob()`, which
 * transitively imports `nodemailer` (Node-only, breaks client bundling if
 * anything non-type gets imported from it in a "use client" component).
 */
export function countReminders(reminders: ReminderDto[]): ReminderCounts {
  const h1 = reminders.filter((reminder) => reminder.type === "H1_REMINDER").length;
  const overdue = reminders.filter((reminder) => reminder.type === "OVERDUE_ALERT").length;
  return { h1, overdue, total: h1 + overdue };
}

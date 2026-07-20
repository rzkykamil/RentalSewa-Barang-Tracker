/**
 * Mock reminder data for the frontend-only phase (Periode 13 — see
 * docs/development-workflow.md, Modul Reminder). There is no real
 * `reminder_logs` table or scheduled job yet (prisma/schema.prisma has zero
 * models) — reminders are derived client-side from `MOCK_BOOKINGS` instead
 * of read from an API. Shape mirrors the `reminder_logs` table planned in
 * docs/database-design.md (`type`, `channel`), scoped to `channel = IN_APP`
 * only (email reminders are a backend/worker concern, out of scope here).
 *
 * `MOCK_TODAY` stands in for "now" so the demo data (which bookings count
 * as H-1 / overdue) stays deterministic regardless of the real calendar
 * date — see docs/decision-log.md entry for Modul Reminder.
 *
 * Once the reminder backend module (job worker + `reminder_logs`) lands,
 * this file should be replaced by real API calls (see docs/api-spec.md)
 * and can be deleted.
 */

import { MOCK_BOOKINGS, type MockBooking } from "@/lib/mock/bookings";

/** Mirrors the `type` enum planned in docs/database-design.md `reminder_logs` table. */
export type ReminderType = "H1_REMINDER" | "OVERDUE_ALERT";

export interface MockReminder {
  id: string;
  bookingId: string;
  type: ReminderType;
  itemId: string;
  itemName: string;
  ownerId: string;
  ownerName: string;
  renterId: string;
  renterName: string;
  /** The booking's `endDate` — the return due date this reminder is about. */
  dueDate: string;
  /** When the (mock) reminder was generated/sent, per BR5 idempotency (one per booking+type). */
  sentAt: string;
}

/** Fixed reference "now" for reminder demo data — see file header comment. */
const MOCK_TODAY = "2026-07-20";

function daysUntilDue(dueDate: string): number {
  const due = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  const today = new Date(`${MOCK_TODAY}T00:00:00.000Z`).getTime();
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function reminderTypeFor(booking: MockBooking): ReminderType | null {
  if (booking.status !== "ACTIVE") return null;

  const diff = daysUntilDue(booking.endDate);
  if (diff === 1) return "H1_REMINDER";
  if (diff < 0) return "OVERDUE_ALERT";
  return null;
}

/**
 * Reminders derived from currently-active bookings, per BR5 in
 * docs/prd.md (one reminder per booking per type). Only `ACTIVE` bookings
 * are eligible — pending/approved/completed/rejected bookings have no
 * return due date to remind about.
 */
export const MOCK_REMINDERS: MockReminder[] = MOCK_BOOKINGS.reduce<MockReminder[]>((acc, booking) => {
  const type = reminderTypeFor(booking);
  if (!type) return acc;

  acc.push({
    id: `reminder-${booking.id}-${type}`,
    bookingId: booking.id,
    type,
    itemId: booking.itemId,
    itemName: booking.itemName,
    ownerId: booking.ownerId,
    ownerName: booking.ownerName,
    renterId: booking.renterId,
    renterName: booking.renterName,
    dueDate: booking.endDate,
    sentAt: `${MOCK_TODAY}T07:00:00.000Z`,
  });
  return acc;
}, []).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

export function getRemindersForOwner(ownerId: string): MockReminder[] {
  return MOCK_REMINDERS.filter((reminder) => reminder.ownerId === ownerId);
}

export function getRemindersForRenter(renterId: string): MockReminder[] {
  return MOCK_REMINDERS.filter((reminder) => reminder.renterId === renterId);
}

export interface ReminderCounts {
  h1: number;
  overdue: number;
  total: number;
}

export function countReminders(reminders: MockReminder[]): ReminderCounts {
  const h1 = reminders.filter((reminder) => reminder.type === "H1_REMINDER").length;
  const overdue = reminders.filter((reminder) => reminder.type === "OVERDUE_ALERT").length;
  return { h1, overdue, total: h1 + overdue };
}

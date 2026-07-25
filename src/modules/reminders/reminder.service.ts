import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { sendReminderEmail } from "@/lib/email";
import { logInfo, logError } from "@/lib/logger";

/**
 * Summary returned by `runReminderJob()`, surfaced via
 * `POST /api/v1/internal/reminders/run` response `data` and logged by
 * `worker/reminder-job.ts`.
 */
export interface ReminderJobSummary {
  h1RemindersSent: number;
  overdueAlertsSent: number;
  errors: number;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** `true` when `error` is a Prisma unique-constraint violation (P2002). */
function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * `POST /api/v1/internal/reminders/run` and `worker/reminder-job.ts` entrypoint.
 *
 * Implements BR3 (transition to `LATE`/`TELAT_KEMBALI` is job-triggered, not
 * realtime) and BR5 (each reminder type sent at most once per booking).
 *
 * Idempotency (BR5) is enforced two ways:
 *   1. Primary: the query filter excludes bookings that already have a
 *      matching `ReminderLog` (`reminderLogs: { none: { type } }`).
 *   2. Fallback: `reminderLogs.bookingId_type` unique constraint — if two job
 *      runs race for the same booking, the loser's `reminderLog.create` throws
 *      P2002, which is caught and treated as "already handled" rather than an
 *      error.
 *
 * Email is sent *before* writing the `ReminderLog`/status transition so a
 * failed send leaves the booking eligible again on the next run (retry via
 * re-querying), instead of silently losing the notification.
 */
export async function runReminderJob(): Promise<ReminderJobSummary> {
  const summary: ReminderJobSummary = { h1RemindersSent: 0, overdueAlertsSent: 0, errors: 0 };

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);

  await runH1Reminders(tomorrow, dayAfterTomorrow, summary);
  await runOverdueAlerts(today, summary);

  return summary;
}

async function runH1Reminders(
  tomorrow: Date,
  dayAfterTomorrow: Date,
  summary: ReminderJobSummary
): Promise<void> {
  const candidates = await prisma.booking.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: tomorrow, lt: dayAfterTomorrow },
      reminderLogs: { none: { type: "H1_REMINDER" } },
    },
    include: { renter: true, item: true },
  });

  for (const booking of candidates) {
    try {
      await sendReminderEmail({
        to: booking.renter.email,
        subject: `Pengingat: pengembalian "${booking.item.name}" besok`,
        body: `Halo ${booking.renter.name}, sewa barang "${booking.item.name}" akan berakhir besok (${formatDate(
          booking.endDate
        )}). Mohon segera dipersiapkan pengembaliannya.`,
      });

      await prisma.reminderLog.create({
        data: { bookingId: booking.id, type: "H1_REMINDER", channel: "EMAIL" },
      });
      summary.h1RemindersSent += 1;
      logInfo("reminder.sent", { reminderType: "H1_REMINDER", bookingId: booking.id });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) continue;
      summary.errors += 1;
      logError("reminder.send_failed", error, { reminderType: "H1_REMINDER", bookingId: booking.id });
    }
  }
}

async function runOverdueAlerts(today: Date, summary: ReminderJobSummary): Promise<void> {
  const candidates = await prisma.booking.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: today },
      reminderLogs: { none: { type: "OVERDUE_ALERT" } },
    },
    include: { renter: true, item: { include: { owner: true } } },
  });

  for (const booking of candidates) {
    try {
      // PRD §Reminder: both the Renter (who is late) and the Owner (whose
      // item is stuck) are notified once the deadline is passed.
      await sendReminderEmail({
        to: booking.renter.email,
        subject: `Anda melewati tenggat pengembalian "${booking.item.name}"`,
        body: `Halo ${booking.renter.name}, sewa barang "${booking.item.name}" sudah melewati tenggat pengembalian (${formatDate(
          booking.endDate
        )}). Mohon segera dikembalikan.`,
      });
      await sendReminderEmail({
        to: booking.item.owner.email,
        subject: `Penyewa melewati tenggat pengembalian "${booking.item.name}"`,
        body: `Halo ${booking.item.owner.name}, penyewa "${booking.renter.name}" melewati tenggat pengembalian barang "${booking.item.name}" (${formatDate(
          booking.endDate
        )}). Silakan tindak lanjuti.`,
      });

      // BR3: booking -> LATE, item -> TELAT_KEMBALI, plus the ReminderLog
      // that guards BR5, all written atomically.
      await prisma.$transaction(async (tx) => {
        await tx.reminderLog.create({
          data: { bookingId: booking.id, type: "OVERDUE_ALERT", channel: "EMAIL" },
        });
        await tx.booking.update({ where: { id: booking.id }, data: { status: "LATE" } });
        await tx.item.update({ where: { id: booking.itemId }, data: { status: "TELAT_KEMBALI" } });
      });

      summary.overdueAlertsSent += 1;
      logInfo("reminder.sent", { reminderType: "OVERDUE_ALERT", bookingId: booking.id });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) continue;
      summary.errors += 1;
      logError("reminder.send_failed", error, { reminderType: "OVERDUE_ALERT", bookingId: booking.id });
    }
  }
}

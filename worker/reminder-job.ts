// Scheduled entrypoint for the reminder job (Modul Reminder, `docs/todo/backend.md`).
// Run manually with `npm run worker`, or wired up to an OS-level cron every
// 15 minutes in production (`docs/technical-spec.md` §5/§11). Calls the
// service layer directly (not an HTTP request to `/api/v1/internal/reminders/run`)
// so this process never depends on the Next.js server being up.

import { runReminderJob } from "@/modules/reminders/reminder.service";
import { logInfo, logError } from "@/lib/logger";

async function main() {
  const startedAt = new Date();

  try {
    const summary = await runReminderJob();
    logInfo("reminder.job_finished", {
      job: "reminder",
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      ...summary,
    });
    process.exitCode = summary.errors > 0 ? 1 : 0;
  } catch (error) {
    logError("reminder.job_failed", error, {
      job: "reminder",
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
    });
    process.exitCode = 1;
  }
}

main();

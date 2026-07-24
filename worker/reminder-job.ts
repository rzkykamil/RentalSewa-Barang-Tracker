// Scheduled entrypoint for the reminder job (Modul Reminder, `docs/todo/backend.md`).
// Run manually with `npm run worker`, or wired up to an OS-level cron every
// 15 minutes in production (`docs/technical-spec.md` §5/§11). Calls the
// service layer directly (not an HTTP request to `/api/v1/internal/reminders/run`)
// so this process never depends on the Next.js server being up.

import { runReminderJob } from "@/modules/reminders/reminder.service";

async function main() {
  const startedAt = new Date();

  try {
    const summary = await runReminderJob();
    console.log(
      JSON.stringify({
        level: "info",
        job: "reminder",
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        ...summary,
      })
    );
    process.exitCode = summary.errors > 0 ? 1 : 0;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        job: "reminder",
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
      })
    );
    process.exitCode = 1;
  }
}

main();

import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { runReminderJob } from "@/modules/reminders/reminder.service";

/**
 * `POST /api/v1/internal/reminders/run` — server-only trigger for the
 * reminder job (`docs/api-spec.md` §Reminder). Not tied to a user session at
 * all (no Renter/Owner/Admin role applies here) — access is gated purely by
 * a shared secret header compared against `INTERNAL_JOB_SECRET`. Returns
 * `401 UNAUTHENTICATED` (rather than `403 FORBIDDEN`) when the header is
 * missing/mismatched, since there is no "logged in but wrong role" concept
 * for this endpoint — it is simply unauthenticated.
 *
 * In production this is a secondary trigger path (e.g. manual testing, or a
 * cron that prefers HTTP); `worker/reminder-job.ts` calls
 * `runReminderJob()` directly so the scheduled job doesn't depend on the
 * Next.js server being up.
 */
export async function POST(request: NextRequest) {
  const providedSecret = request.headers.get("x-internal-job-secret");
  const expectedSecret = process.env.INTERNAL_JOB_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return apiError("UNAUTHENTICATED", "Missing or invalid internal job secret.");
  }

  try {
    const summary = await runReminderJob();
    return apiSuccess(summary);
  } catch (error) {
    logError("api.unhandled_error", error, { route: "POST /api/v1/internal/reminders/run" });
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}

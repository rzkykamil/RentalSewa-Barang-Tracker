import nodemailer, { type Transporter } from "nodemailer";

/**
 * Minimal SMTP email client used only by the reminder worker
 * (`worker/reminder-job.ts`, `src/modules/reminders/reminder.service.ts`) per
 * `docs/technical-spec.md` §14 — "Email (reminder): SMTP provider atau Resend,
 * dipanggil hanya dari worker". SMTP is prioritized because `.env.example`
 * documents SMTP_HOST/PORT/USER/PASSWORD/SMTP_FROM_EMAIL in full detail;
 * `RESEND_API_KEY` is reserved as an alternative but not wired up yet (see
 * decision-log entry for this module).
 */

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  return cachedTransporter;
}

export interface SendReminderEmailInput {
  to: string;
  subject: string;
  /** Plain-text body; a simple HTML paragraph version is derived from it. */
  body: string;
}

/** Sends a single reminder email via SMTP. Throws if the SMTP send fails. */
export async function sendReminderEmail({ to, subject, body }: SendReminderEmailInput): Promise<void> {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM_EMAIL || "no-reply@example.com",
    to,
    subject,
    text: body,
    html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
  });
}

import { emailApproved, emailFailed, emailDailyAlert } from "./templates";
import type { EmailTemplateArgs } from "./templates";

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmailResend(args: SendEmailArgs) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", args.to);
    return { skipped: true, to: args.to };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FUNDGUARD <no-reply@fundguard.io>",
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

export async function sendNotificationEvent(kind: "approved" | "failed" | "alert_daily_dd", data: EmailTemplateArgs) {
  const tpl =
    kind === "approved" ? emailApproved
    : kind === "failed" ? emailFailed
    : emailDailyAlert;
  const subject =
    kind === "approved" ? `🎉 ${data.challengeName} APROBADO`
    : kind === "failed" ? `❌ ${data.challengeName} reprobado`
    : `⚠️ Alerta DD diario en ${data.challengeName}`;
  const html = tpl(data);
  // To: challenge.user.email (insertar aquí el fetch al profile)
  return { html, subject };
}

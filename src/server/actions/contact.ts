"use server";

import { z } from "zod";
import { sendTransactionalEmail } from "@/server/services/email/resend";

const CONTACT_FROM = "no-reply@orgaflow.dev";
const CONTACT_TO = "app@orgaflow.dev";
const CONTACT_CC = "orgaflow@proton.me";

/** Minimum ms between page render and submission — bot heuristic */
const MIN_SUBMIT_MS = 1500;

const contactSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(254),
  topic: z.string().min(1).max(80),
  message: z.string().min(10).max(5000),
  /** Honeypot — must be empty */
  website: z.string().max(0),
  /** ISO timestamp set by the client when the form mounted */
  formStartedAt: z.string(),
});

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

function escapeHtml(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function submitContactForm(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    topic: formData.get("topic"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
    formStartedAt: formData.get("formStartedAt") ?? "",
  };

  const parsed = contactSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: "error", message: "Please check all fields and try again." };
  }

  const { firstName, lastName, email, topic, message, website, formStartedAt } =
    parsed.data;

  // Honeypot: bots fill the hidden field
  if (website.length > 0) {
    return { status: "success" }; // silent — don't reveal detection
  }

  // Timing check: submissions faster than MIN_SUBMIT_MS are likely bots
  const startedAt = new Date(formStartedAt).getTime();
  if (!Number.isNaN(startedAt) && Date.now() - startedAt < MIN_SUBMIT_MS) {
    return { status: "success" }; // silent
  }

  const name = `${firstName} ${lastName}`;
  const subject = `[Contact] ${topic} — ${name}`;

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${topic}`,
    "",
    message,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#101828;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:28px 32px;border-radius:16px 16px 0 0;">
        <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Orgaflow Contact</p>
        <h1 style="margin:10px 0 0;font-size:22px;color:#ffffff;">${escapeHtml(topic)}</h1>
      </div>
      <div style="padding:28px 32px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;width:100px;">From</td>
            <td style="padding:8px 0;font-size:14px;font-weight:600;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;">Email</td>
            <td style="padding:8px 0;font-size:14px;">
              <a href="mailto:${escapeHtml(email)}" style="color:#4f46e5;">${escapeHtml(email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;">Topic</td>
            <td style="padding:8px 0;font-size:14px;">${escapeHtml(topic)}</td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
        <p style="margin:0;font-size:14px;line-height:1.75;white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    </div>
  `.trim();

  try {
    await sendTransactionalEmail({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      cc: CONTACT_CC,
      replyTo: email,
      subject,
      html,
      text,
    });

    return { status: "success" };
  } catch {
    return {
      status: "error",
      message: "Failed to send your message. Please try again or email us directly.",
    };
  }
}

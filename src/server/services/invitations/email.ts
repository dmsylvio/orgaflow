import "server-only";

import { getAppBaseUrl } from "@/lib/base-url";
import { sendTransactionalEmail } from "@/server/services/email/resend";

const INVITATION_TTL_DAYS = 7;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function buildInvitationUrl(token: string): string {
  return `${getAppBaseUrl()}/invite/${token}`;
}

export function getInvitationExpiresAt(): Date {
  return new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function sendOrganizationInvitationEmail(params: {
  email: string;
  organizationName: string;
  invitedByName: string;
  acceptUrl: string;
  expiresAt: Date;
  roleName?: string | null;
}) {
  const subject = `${params.invitedByName} invited you to ${params.organizationName}`;
  const roleLine = params.roleName
    ? `Role: ${params.roleName}`
    : "Role: No role assigned yet";
  const expiresLine = `This invitation expires on ${formatDate(params.expiresAt)}.`;

  const text = [
    `You've been invited to join ${params.organizationName} on Orgaflow.`,
    "",
    `Invited by: ${params.invitedByName}`,
    roleLine,
    expiresLine,
    "",
    `Accept your invitation: ${params.acceptUrl}`,
  ].join("\n");

  const html = `
    <div style="background:#f6f6f1;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#101828;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
        <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Orgaflow Invite</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;">Join ${escapeHtml(params.organizationName)}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
            <strong>${escapeHtml(params.invitedByName)}</strong> invited you to collaborate in
            <strong>${escapeHtml(params.organizationName)}</strong> on Orgaflow.
          </p>
          <div style="margin:0 0 24px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><strong>Invited email:</strong> ${escapeHtml(params.email)}</p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><strong>Role:</strong> ${escapeHtml(params.roleName ?? "No role assigned yet")}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;"><strong>Expires:</strong> ${escapeHtml(formatDate(params.expiresAt))} (UTC)</p>
          </div>
          <a
            href="${escapeHtml(params.acceptUrl)}"
            style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:12px;"
          >
            Accept invitation
          </a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#475467;">
            If the button does not work, open this link:
          </p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.7;word-break:break-all;color:#163329;">
            ${escapeHtml(params.acceptUrl)}
          </p>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#475467;">
            ${escapeHtml(expiresLine)}
          </p>
        </div>
      </div>
    </div>
  `.trim();

  await sendTransactionalEmail({
    to: params.email,
    subject,
    html,
    text,
  });
}

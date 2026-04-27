import "server-only";

import { getAppBaseUrl } from "@/lib/base-url";
import { sendTransactionalEmail } from "./resend";
import { buildEmailHtml, buildEmailText, escapeHtml } from "./template";

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
}): Promise<void> {
  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}/app`;
  const settingsUrl = `${baseUrl}/app/settings/account`;

  const firstName = params.name.split(" ")[0] ?? params.name;

  const body = `
    <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
      <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Welcome</div>
      <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;">Hey ${escapeHtml(firstName)}, glad you're here.</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#101828;">
        Your Orgaflow account is ready. You can now create your workspace, invite your team, and start sending invoices.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475467;">
        If you ever get stuck, reply to this email — we actually read them.
      </p>
      <a
        href="${escapeHtml(dashboardUrl)}"
        style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:12px;font-size:15px;"
      >
        Go to your dashboard →
      </a>
    </div>
  `;

  const html = buildEmailHtml({
    preheader: `Hey ${firstName}, your Orgaflow account is ready.`,
    body,
    settingsUrl,
  });

  const text = buildEmailText([
    `Hey ${firstName}, glad you're here.`,
    "",
    "Your Orgaflow account is ready. You can now create your workspace, invite your team, and start sending invoices.",
    "",
    "If you ever get stuck, reply to this email — we actually read them.",
    "",
    `Go to your dashboard: ${dashboardUrl}`,
  ]);

  await sendTransactionalEmail({
    to: params.email,
    subject: `Hey ${firstName}, welcome to Orgaflow`,
    html,
    text,
  });
}

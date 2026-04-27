import "server-only";

import { getAppBaseUrl } from "@/lib/base-url";
import { sendTransactionalEmail } from "./resend";
import { buildEmailHtml, buildEmailText, escapeHtml } from "./template";

function getUrls() {
  const baseUrl = getAppBaseUrl();
  return {
    dashboard: `${baseUrl}/app`,
    invoices: `${baseUrl}/app/invoices`,
    estimates: `${baseUrl}/app/estimates`,
    recurring: `${baseUrl}/app/recurring-invoices`,
    settings: `${baseUrl}/app/settings/account`,
  };
}

export async function sendOnboardingD1Email(params: {
  email: string;
  name: string;
}): Promise<void> {
  const urls = getUrls();
  const firstName = params.name.split(" ")[0] ?? params.name;

  const body = `
    <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
      <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Getting started</div>
      <h1 style="margin:14px 0 0;font-size:26px;line-height:1.2;">Your first steps with Orgaflow</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#101828;">
        Hey ${escapeHtml(firstName)}, here's a quick checklist to get you up and running.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0eb;">
            <span style="font-size:18px;vertical-align:middle;">🏢</span>
            <span style="margin-left:10px;font-size:15px;line-height:1.6;color:#101828;vertical-align:middle;">
              <strong>Create your workspace</strong> — set up your organization name and details
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0eb;">
            <span style="font-size:18px;vertical-align:middle;">👥</span>
            <span style="margin-left:10px;font-size:15px;line-height:1.6;color:#101828;vertical-align:middle;">
              <strong>Invite your team</strong> — bring in collaborators with the right roles
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <span style="font-size:18px;vertical-align:middle;">📄</span>
            <span style="margin-left:10px;font-size:15px;line-height:1.6;color:#101828;vertical-align:middle;">
              <strong>Send your first invoice</strong> — it only takes a minute
            </span>
          </td>
        </tr>
      </table>
      <a
        href="${escapeHtml(urls.invoices)}"
        style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:12px;font-size:15px;"
      >
        Create an invoice →
      </a>
    </div>
  `;

  const html = buildEmailHtml({
    preheader: "Here's how to get the most out of Orgaflow from day one.",
    body,
    settingsUrl: urls.settings,
  });

  const text = buildEmailText([
    `Hey ${firstName}, here's a quick checklist to get you up and running.`,
    "",
    "1. Create your workspace — set up your organization name and details",
    "2. Invite your team — bring in collaborators with the right roles",
    "3. Send your first invoice — it only takes a minute",
    "",
    `Create an invoice: ${urls.invoices}`,
  ]);

  await sendTransactionalEmail({
    to: params.email,
    subject: "Your first steps with Orgaflow",
    html,
    text,
  });
}

export async function sendOnboardingD3Email(params: {
  email: string;
  name: string;
}): Promise<void> {
  const urls = getUrls();
  const firstName = params.name.split(" ")[0] ?? params.name;

  const body = `
    <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
      <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Hidden gems</div>
      <h1 style="margin:14px 0 0;font-size:26px;line-height:1.2;">Features you might have missed</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#101828;">
        Hey ${escapeHtml(firstName)}, most people discover these features weeks in. You're getting them on day 3.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0eb;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#101828;">🔁 Recurring invoices</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#475467;">
              Set up invoices that send automatically every week, month, or custom period. Never chase a retainer again.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0eb;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#101828;">📋 Estimates</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#475467;">
              Send a proposal before the invoice. Your client can approve or reject it directly from the link — no account needed.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#101828;">💸 Expense tracking</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#475467;">
              Log business expenses with receipts. See what's going out alongside what's coming in.
            </p>
          </td>
        </tr>
      </table>
      <a
        href="${escapeHtml(urls.dashboard)}"
        style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:12px;font-size:15px;"
      >
        Explore Orgaflow →
      </a>
    </div>
  `;

  const html = buildEmailHtml({
    preheader:
      "Recurring invoices, estimates, expense tracking — features worth knowing.",
    body,
    settingsUrl: urls.settings,
  });

  const text = buildEmailText([
    `Hey ${firstName}, most people discover these features weeks in. You're getting them on day 3.`,
    "",
    "🔁 Recurring invoices",
    "Set up invoices that send automatically every week, month, or custom period. Never chase a retainer again.",
    `→ ${urls.recurring}`,
    "",
    "📋 Estimates",
    "Send a proposal before the invoice. Your client can approve or reject it directly from the link.",
    `→ ${urls.estimates}`,
    "",
    "💸 Expense tracking",
    "Log business expenses with receipts. See what's going out alongside what's coming in.",
    `→ ${urls.dashboard}`,
  ]);

  await sendTransactionalEmail({
    to: params.email,
    subject: "3 Orgaflow features worth knowing",
    html,
    text,
  });
}

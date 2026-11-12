import "server-only";

import { getAppBaseUrl } from "@/lib/base-url";
import { sendTransactionalEmail } from "./resend";
import { buildEmailHtml, buildEmailText, escapeHtml } from "./template";

function actionEmail(params: {
  heading: string;
  intro: string;
  buttonLabel: string;
  url: string;
  footnote: string;
}) {
  const settingsUrl = `${getAppBaseUrl()}/app/settings/account`;
  const body = `
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#101828;">${escapeHtml(params.heading)}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475467;">${escapeHtml(params.intro)}</p>
      <a
        href="${escapeHtml(params.url)}"
        style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:8px;font-size:15px;"
      >${escapeHtml(params.buttonLabel)}</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#667085;">${escapeHtml(params.footnote)}</p>
      <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#98a2b3;word-break:break-all;">${escapeHtml(params.url)}</p>
    </div>
  `;

  return {
    html: buildEmailHtml({ preheader: params.intro, body, settingsUrl }),
    text: buildEmailText([
      params.heading,
      "",
      params.intro,
      "",
      `${params.buttonLabel}: ${params.url}`,
      "",
      params.footnote,
    ]),
  };
}

export async function sendMagicLinkEmail(params: {
  email: string;
  url: string;
}): Promise<void> {
  const { html, text } = actionEmail({
    heading: "Your sign-in link",
    intro:
      "Click the button below to sign in to Orgaflow. The link works once and expires in 15 minutes.",
    buttonLabel: "Sign in to Orgaflow",
    url: params.url,
    footnote:
      "If you didn't ask for this, you can ignore this email. Nobody can sign in without the link.",
  });

  await sendTransactionalEmail({
    to: params.email,
    subject: "Sign in to Orgaflow",
    html,
    text,
  });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  url: string;
}): Promise<void> {
  const { html, text } = actionEmail({
    heading: "Reset your password",
    intro:
      "We got a request to reset your Orgaflow password. Click the button below to choose a new one. The link expires in 1 hour.",
    buttonLabel: "Choose a new password",
    url: params.url,
    footnote:
      "If you didn't ask to reset your password, you can ignore this email. Your password won't change.",
  });

  await sendTransactionalEmail({
    to: params.email,
    subject: "Reset your Orgaflow password",
    html,
    text,
  });
}

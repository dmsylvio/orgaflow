#!/usr/bin/env tsx
/**
 * One-time blast: Starter plan announcement to all users.
 *
 * Usage:
 *   DATABASE_URL=... RESEND_API_KEY=... pnpm tsx scripts/send-starter-announcement.ts
 *
 * Add --dry-run to print recipients without sending.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Resend } from "resend";
import * as schema from "../src/server/db/schemas";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const APP_URL = "https://orgaflow.dev/app";
const INSTAGRAM_URL = "https://www.instagram.com/orgaflow.app/";
const FROM = "Orgaflow <hello@orgaflow.dev>";
const SUBJECT = "Orgaflow is now free — no credit card needed";
const BATCH_SIZE = 100;
const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Email HTML
// ---------------------------------------------------------------------------

function escapeHtml(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Orgaflow is now free</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f1;font-family:Arial,Helvetica,sans-serif;color:#101828;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f6f6f1;">Orgaflow Starter is free — no credit card, no commitment. Here's what changed.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" style="max-width:620px;" cellspacing="0" cellpadding="0" border="0">

          <!-- Wordmark -->
          <tr>
            <td style="padding:0 0 24px;">
              <span style="font-size:18px;font-weight:700;color:#163329;letter-spacing:-0.02em;">Orgaflow</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">

              <!-- Card header -->
              <div style="padding:32px 32px 24px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Big news</div>
                <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;">Orgaflow is now free.</h1>
              </div>

              <!-- Card body -->
              <div style="padding:32px;">
                <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#101828;">
                  Hey ${escapeHtml(firstName)},
                </p>
                <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#101828;">
                  Starting today, the <strong>Starter plan is free</strong> — no credit card required, no commitment. Just sign up and start running your business.
                </p>

                <!-- Plan box -->
                <div style="margin:0 0 28px;padding:20px 22px;background:#f8faf8;border:1px solid #d1e7dd;border-radius:14px;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#163329;">What's included in Starter</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr><td style="padding:5px 0;font-size:14px;line-height:1.6;color:#374151;">✓&nbsp; Invoices, estimates &amp; expenses</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;line-height:1.6;color:#374151;">✓&nbsp; File attachments on all documents</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;line-height:1.6;color:#374151;">✓&nbsp; Customers approve or reject estimates directly from the link</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;line-height:1.6;color:#374151;">✓&nbsp; Recurring invoices sent automatically</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;line-height:1.6;color:#374151;">✓&nbsp; Team members with custom roles &amp; permissions</td></tr>
                  </table>
                </div>

                <!-- Trial box -->
                <div style="margin:0 0 28px;padding:20px 22px;background:#fafafa;border:1px solid #e5e7eb;border-radius:14px;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#374151;">How the trial works</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr><td style="padding:5px 0;font-size:14px;line-height:1.6;color:#374151;">→&nbsp; Free trial to explore all features</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;line-height:1.6;color:#374151;">→&nbsp; No credit card required to start</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;line-height:1.6;color:#374151;">→&nbsp; When the trial ends, your account pauses — your data stays safe and nothing is deleted. Upgrade anytime to keep going.</td></tr>
                  </table>
                </div>

                <a
                  href="${APP_URL}"
                  style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:12px;font-size:15px;"
                >
                  Go to your dashboard →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;line-height:1.6;">
                The Orgaflow team
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                <a href="${INSTAGRAM_URL}" style="color:#163329;text-decoration:none;">@orgaflow.app</a> on Instagram
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(firstName: string): string {
  return [
    `Hey ${firstName},`,
    "",
    "Big news: Orgaflow is now free to get started.",
    "No credit card. No commitment. Just sign up and go.",
    "",
    "WHAT'S INCLUDED IN STARTER",
    "✓ Invoices, estimates & expenses",
    "✓ File attachments on all documents",
    "✓ Customers approve or reject estimates directly from the link",
    "✓ Recurring invoices sent automatically",
    "✓ Team members with custom roles & permissions",
    "",
    "HOW THE TRIAL WORKS",
    "→ Free trial to explore all features",
    "→ No credit card required to start",
    "→ When the trial ends, your account pauses — your data stays safe,",
    "   nothing is deleted. Upgrade anytime to keep going.",
    "",
    `Go to your dashboard: ${APP_URL}`,
    "",
    "— The Orgaflow team",
    `Instagram: ${INSTAGRAM_URL}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Fetching all users...");
  const allUsers = await db
    .select({
      email: schema.users.email,
      name: schema.users.name,
    })
    .from(schema.users);

  console.log(`Found ${allUsers.length} users.`);

  if (DRY_RUN) {
    console.log("\n-- DRY RUN — no emails sent --");
    for (const u of allUsers) {
      console.log(`  ${u.email}`);
    }
    await pool.end();
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set.");
    await pool.end();
    process.exit(1);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
    const batch = allUsers.slice(i, i + BATCH_SIZE);

    const payload = batch.map((u) => {
      const firstName = u.name.split(" ")[0] ?? u.name;
      return {
        from: FROM,
        to: u.email,
        subject: SUBJECT,
        html: buildHtml(firstName),
        text: buildText(firstName),
      };
    });

    try {
      const result = await resend.batch.send(payload);
      const batchSent = result.data?.data?.length ?? 0;
      sent += batchSent;
      console.log(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1}: sent ${batchSent}/${batch.length}`,
      );
    } catch (err) {
      failed += batch.length;
      console.error(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`,
        err,
      );
    }
  }

  console.log(`\nDone. Sent: ${sent} | Failed: ${failed}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

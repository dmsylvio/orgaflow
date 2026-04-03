import "server-only";

import { and, eq } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import {
  organizationMembers,
  organizationNotificationSettings,
  users,
} from "@/server/db/schemas";
import { sendTransactionalEmail } from "@/server/services/email/resend";

interface SendInvoiceOverdueNotificationParams {
  db: DbClient;
  organizationId: string;
  invoiceNumber: string;
  customerName: string;
  dueDate: string;
  documentUrl: string;
}

export async function sendInvoiceOverdueNotification({
  db,
  organizationId,
  invoiceNumber,
  customerName,
  dueDate,
  documentUrl,
}: SendInvoiceOverdueNotificationParams): Promise<void> {
  const [settings] = await db
    .select()
    .from(organizationNotificationSettings)
    .where(eq(organizationNotificationSettings.organizationId, organizationId))
    .limit(1);

  if (!(settings?.invoiceOverdue ?? false)) return;

  let toEmail = settings?.notifyEmail?.trim() || null;

  if (!toEmail) {
    const [owner] = await db
      .select({ email: users.email })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.isOwner, true),
        ),
      )
      .limit(1);

    toEmail = owner?.email ?? null;
  }

  if (!toEmail) return;

  const subject = `Invoice ${invoiceNumber} is overdue`;
  const formattedDate = new Date(`${dueDate}T00:00:00`).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:13px;font-weight:700;letter-spacing:0.08em;color:#2563eb;text-transform:uppercase;">Orgaflow</span>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#dc2626;height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 40px;">

                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="font-size:40px;line-height:1;margin-bottom:16px;">⚠️</div>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;">
                      Invoice overdue
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;color:#64748b;">
                      This invoice has passed its due date
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:10px;border:1px solid #fecaca;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Client</p>
                                <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0f172a;">${customerName}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:12px;">
                                <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Invoice number</p>
                                <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#2563eb;">${invoiceNumber}</p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Due date</p>
                                <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#dc2626;">${formattedDate}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <a href="${documentUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;padding:13px 32px;">
                      View Invoice →
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 0 8px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                You're receiving this because <strong>Invoice overdue</strong> notifications<br/>are enabled in your
                <a href="${documentUrl.replace(/\/app\/.*/, "/app/settings/notifications")}" style="color:#2563eb;text-decoration:none;">Orgaflow notification settings</a>.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;">
                © ${new Date().getFullYear()} Orgaflow
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Invoice ${invoiceNumber} for ${customerName} is overdue. Due date was ${formattedDate}.\n\nView it here: ${documentUrl}`;

  try {
    await sendTransactionalEmail({ to: toEmail, subject, html, text });
  } catch {
    // Notification failures should not break the flow
  }
}

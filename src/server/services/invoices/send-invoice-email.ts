import "server-only";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getAppBaseUrl } from "@/lib/base-url";
import type { DbClient } from "@/server/db";
import { invoices } from "@/server/db/schemas";
import { sendTransactionalEmail } from "@/server/services/email/resend";

/** Narrow enough that a transaction handle satisfies it just as well as the pool. */
type InvoiceWriter = Pick<DbClient, "update">;

export type SendInvoiceEmailInput = {
  invoiceId: string;
  invoiceNumber: string;
  customerDisplayName: string;
  customerEmail: string | null;
  /** `YYYY-MM-DD`, shown to the customer as the payment deadline. */
  dueDate?: string | null;
  sentAt?: Date;
};

/**
 * Emails an invoice to its customer through a public link and flips it from
 * draft to sent.
 *
 * Returns `false` when the customer has no address on file. That is a normal
 * outcome rather than a failure: automated callers leave the invoice as a draft
 * so somebody can send it by hand.
 */
export async function sendInvoiceEmail(
  db: InvoiceWriter,
  input: SendInvoiceEmailInput,
): Promise<boolean> {
  const recipient = input.customerEmail?.trim();
  if (!recipient) return false;

  const sentAt = input.sentAt ?? new Date();
  const publicToken = randomBytes(32).toString("hex");
  const viewUrl = `${getAppBaseUrl()}/invoice/${publicToken}`;

  await sendTransactionalEmail({
    to: recipient,
    subject: `Invoice ${input.invoiceNumber}`,
    html: buildInvoiceEmailHtml({
      invoiceNumber: input.invoiceNumber,
      customerDisplayName: input.customerDisplayName,
      customerEmail: recipient,
      dueDate: input.dueDate ?? null,
      viewUrl,
    }),
    text: buildInvoiceEmailText({
      invoiceNumber: input.invoiceNumber,
      dueDate: input.dueDate ?? null,
      viewUrl,
    }),
  });

  await db
    .update(invoices)
    .set({
      status: "SENT",
      publicLinkToken: publicToken,
      publicLinkCreatedAt: sentAt,
      updatedAt: sentAt,
    })
    .where(eq(invoices.id, input.invoiceId));

  return true;
}

function buildInvoiceEmailHtml(params: {
  invoiceNumber: string;
  customerDisplayName: string;
  customerEmail: string;
  dueDate: string | null;
  viewUrl: string;
}): string {
  const dueRow = params.dueDate
    ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.6;"><strong>Due:</strong> ${escapeHtml(params.dueDate)}</p>`
    : "";

  return `
    <div style="background:#f6f6f1;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#101828;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
        <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Orgaflow Invoice</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;">Invoice ${escapeHtml(params.invoiceNumber)}</h1>
        </div>
        <div style="padding:32px;">
          <div style="margin:0 0 18px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><strong>Customer:</strong> ${escapeHtml(params.customerDisplayName)}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;"><strong>To:</strong> ${escapeHtml(params.customerEmail)}</p>
            ${dueRow}
          </div>
          <div style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#101828;">
            Please find your invoice attached.
          </div>
          <a href="${escapeHtml(params.viewUrl)}" style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:12px;">
            View invoice
          </a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#475467;">
            If the button does not work, open this link:
          </p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.7;word-break:break-all;color:#163329;">
            ${escapeHtml(params.viewUrl)}
          </p>
        </div>
      </div>
    </div>
  `.trim();
}

function buildInvoiceEmailText(params: {
  invoiceNumber: string;
  dueDate: string | null;
  viewUrl: string;
}): string {
  const due = params.dueDate ? `\nDue: ${params.dueDate}` : "";
  return `Invoice ${params.invoiceNumber}${due}\n\nPlease find your invoice at: ${params.viewUrl}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

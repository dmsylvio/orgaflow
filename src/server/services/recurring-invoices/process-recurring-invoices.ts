import "server-only";

import { randomBytes } from "node:crypto";
import { and, eq, lte, max } from "drizzle-orm";
import { getAppBaseUrl } from "@/lib/base-url";
import { db } from "@/server/db";
import {
  currencies,
  customers,
  invoiceItems,
  invoices,
  organizationPreferences,
  recurringInvoiceTemplateItems,
  recurringInvoiceTemplates,
} from "@/server/db/schemas";
import { runWorkflowAutomations } from "@/server/services/automations/run-workflow-automations";
import { sendTransactionalEmail } from "@/server/services/email/resend";
import { calculateNextRunAt } from "./calculate-next-run";

function formatInvoiceNumber(seq: number): string {
  return `INV-${String(seq).padStart(6, "0")}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function todayUtcString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  const yr = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dy = String(dt.getUTCDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

export async function processRecurringInvoices(): Promise<void> {
  const now = new Date();

  const dueTemplates = await db
    .select({
      id: recurringInvoiceTemplates.id,
      organizationId: recurringInvoiceTemplates.organizationId,
      customerId: recurringInvoiceTemplates.customerId,
      currencyId: recurringInvoiceTemplates.currencyId,
      frequency: recurringInvoiceTemplates.frequency,
      limitType: recurringInvoiceTemplates.limitType,
      limitDate: recurringInvoiceTemplates.limitDate,
      limitCount: recurringInvoiceTemplates.limitCount,
      generatedCount: recurringInvoiceTemplates.generatedCount,
      sendAutomatically: recurringInvoiceTemplates.sendAutomatically,
      dueDaysOffset: recurringInvoiceTemplates.dueDaysOffset,
      notes: recurringInvoiceTemplates.notes,
      discount: recurringInvoiceTemplates.discount,
      discountFixed: recurringInvoiceTemplates.discountFixed,
      subTotal: recurringInvoiceTemplates.subTotal,
      total: recurringInvoiceTemplates.total,
      tax: recurringInvoiceTemplates.tax,
      customerDisplayName: customers.displayName,
      customerEmail: customers.email,
    })
    .from(recurringInvoiceTemplates)
    .innerJoin(
      customers,
      eq(recurringInvoiceTemplates.customerId, customers.id),
    )
    .where(
      and(
        eq(recurringInvoiceTemplates.status, "active"),
        lte(recurringInvoiceTemplates.nextRunAt, now),
      ),
    );

  for (const template of dueTemplates) {
    try {
      await processSingleTemplate(template, now);
    } catch (err) {
      console.error(
        `[recurring-invoices] Failed to process template ${template.id}:`,
        err,
      );
    }
  }
}

type TemplateRow = Awaited<
  ReturnType<typeof processRecurringInvoices>
> extends void
  ? never
  : never;

async function processSingleTemplate(
  template: {
    id: string;
    organizationId: string;
    customerId: string;
    currencyId: string;
    frequency: string;
    limitType: string;
    limitDate: string | null;
    limitCount: number | null;
    generatedCount: number;
    sendAutomatically: boolean;
    dueDaysOffset: number | null;
    notes: string | null;
    discount: string | null;
    discountFixed: boolean;
    subTotal: string;
    total: string;
    tax: string;
    customerDisplayName: string;
    customerEmail: string | null;
  },
  now: Date,
): Promise<void> {
  const todayStr = todayUtcString();

  // Check limits before generating
  if (template.limitType === "date" && template.limitDate) {
    if (todayStr >= template.limitDate) {
      await db
        .update(recurringInvoiceTemplates)
        .set({ status: "completed", updatedAt: now })
        .where(eq(recurringInvoiceTemplates.id, template.id));
      return;
    }
  }

  if (
    template.limitType === "count" &&
    template.limitCount !== null &&
    template.generatedCount >= template.limitCount
  ) {
    await db
      .update(recurringInvoiceTemplates)
      .set({ status: "completed", updatedAt: now })
      .where(eq(recurringInvoiceTemplates.id, template.id));
    return;
  }

  // Load template items
  const templateItems = await db
    .select({
      itemId: recurringInvoiceTemplateItems.itemId,
      name: recurringInvoiceTemplateItems.name,
      description: recurringInvoiceTemplateItems.description,
      unitName: recurringInvoiceTemplateItems.unitName,
      quantity: recurringInvoiceTemplateItems.quantity,
      price: recurringInvoiceTemplateItems.price,
      total: recurringInvoiceTemplateItems.total,
    })
    .from(recurringInvoiceTemplateItems)
    .where(eq(recurringInvoiceTemplateItems.templateId, template.id));

  if (templateItems.length === 0) {
    console.warn(
      `[recurring-invoices] Template ${template.id} has no items, skipping.`,
    );
    return;
  }

  const [prefs] = await db
    .select({ discountPerItem: organizationPreferences.discountPerItem })
    .from(organizationPreferences)
    .where(
      eq(organizationPreferences.organizationId, template.organizationId),
    )
    .limit(1);

  const invoiceDate = todayStr;
  const dueDate =
    template.dueDaysOffset !== null && template.dueDaysOffset !== undefined
      ? addDays(todayStr, template.dueDaysOffset)
      : null;

  const newCount = template.generatedCount + 1;
  const nextRunAt = calculateNextRunAt(
    template.frequency as Parameters<typeof calculateNextRunAt>[0],
    now,
  );

  const limitReached =
    (template.limitType === "count" &&
      template.limitCount !== null &&
      newCount >= template.limitCount) ||
    (template.limitType === "date" &&
      template.limitDate !== null &&
      todayStr >= template.limitDate);

  const newStatus = limitReached ? "completed" : "active";

  await db.transaction(async (tx) => {
    // Get next sequence number
    const [maxRow] = await tx
      .select({ maxSeq: max(invoices.sequenceNumber) })
      .from(invoices)
      .where(eq(invoices.organizationId, template.organizationId));

    const nextSeq = (maxRow?.maxSeq ?? 0) + 1;
    const invoiceNumber = formatInvoiceNumber(nextSeq);

    const [createdInvoice] = await tx
      .insert(invoices)
      .values({
        organizationId: template.organizationId,
        customerId: template.customerId,
        currencyId: template.currencyId,
        sequenceNumber: nextSeq,
        invoiceDate,
        dueDate: dueDate ?? undefined,
        invoiceNumber,
        status: "DRAFT",
        taxPerItem: false,
        discountPerItem: prefs?.discountPerItem ?? false,
        discountFixed: template.discountFixed,
        notes: template.notes ?? undefined,
        discount: template.discount ?? undefined,
        discountVal: "0.000",
        subTotal: template.subTotal,
        total: template.total,
        tax: template.tax,
        recurringTemplateId: template.id,
      })
      .returning({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
      });

    if (!createdInvoice) throw new Error("Invoice insert returned no rows");

    // Copy items
    await tx.insert(invoiceItems).values(
      templateItems.map((item) => ({
        organizationId: template.organizationId,
        invoiceId: createdInvoice.id,
        itemId: item.itemId ?? undefined,
        name: item.name,
        description: item.description ?? undefined,
        unitName: item.unitName ?? undefined,
        quantity: item.quantity,
        price: item.price,
        discountType: "fixed" as const,
        discount: null,
        discountVal: null,
        tax: null,
        total: item.total,
        exchangeRate: null,
        baseDiscountVal: null,
        basePrice: null,
        baseTax: null,
        baseTotal: null,
      })),
    );

    let finalStatus = createdInvoice.status;

    // Send automatically if enabled
    if (template.sendAutomatically && template.customerEmail) {
      const publicToken = randomBytes(32).toString("hex");
      const publicLinkCreatedAt = now;
      const viewUrl = `${getAppBaseUrl()}/invoice/${publicToken}`;

      const html = `
        <div style="background:#f6f6f1;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#101828;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
            <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Orgaflow Invoice</div>
              <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;">Invoice ${escapeHtml(invoiceNumber)}</h1>
            </div>
            <div style="padding:32px;">
              <div style="margin:0 0 18px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><strong>Customer:</strong> ${escapeHtml(template.customerDisplayName)}</p>
                <p style="margin:0;font-size:14px;line-height:1.6;"><strong>To:</strong> ${escapeHtml(template.customerEmail)}</p>
              </div>
              <div style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#101828;">
                Please find your invoice attached.
              </div>
              <a href="${escapeHtml(viewUrl)}" style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:12px;">
                View invoice
              </a>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#475467;">
                If the button does not work, open this link:
              </p>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.7;word-break:break-all;color:#163329;">
                ${escapeHtml(viewUrl)}
              </p>
            </div>
          </div>
        </div>
      `.trim();

      const text = `Invoice ${invoiceNumber}\n\nPlease find your invoice at: ${viewUrl}`;

      await sendTransactionalEmail({
        to: template.customerEmail,
        subject: `Invoice ${invoiceNumber}`,
        html,
        text,
      });

      await tx
        .update(invoices)
        .set({
          status: "SENT",
          publicLinkToken: publicToken,
          publicLinkCreatedAt,
          updatedAt: now,
        })
        .where(eq(invoices.id, createdInvoice.id));

      finalStatus = "SENT";
    }

    // Update template
    await tx
      .update(recurringInvoiceTemplates)
      .set({
        generatedCount: newCount,
        nextRunAt,
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(recurringInvoiceTemplates.id, template.id));

    // Run workflow automations (outside tx to avoid blocking)
    await runWorkflowAutomations(db, {
      organizationId: template.organizationId,
      triggerDocument: "invoice",
      triggerStatus: finalStatus,
      documentId: createdInvoice.id,
      actorUserId: null,
      triggeredAt: now,
    });
  });
}

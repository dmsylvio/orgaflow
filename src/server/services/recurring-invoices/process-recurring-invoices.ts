import "server-only";

import { and, eq, lte, max } from "drizzle-orm";
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
import { sendInvoiceEmail } from "@/server/services/invoices/send-invoice-email";
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
    if (template.sendAutomatically) {
      const sent = await sendInvoiceEmail(tx, {
        invoiceId: createdInvoice.id,
        invoiceNumber,
        customerDisplayName: template.customerDisplayName,
        customerEmail: template.customerEmail,
        dueDate,
        sentAt: now,
      });

      if (sent) finalStatus = "SENT";
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

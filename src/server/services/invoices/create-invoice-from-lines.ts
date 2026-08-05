import "server-only";

import { count, eq, max } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import { invoiceItems, invoices } from "@/server/db/schemas";
import { getOrganizationPlan } from "@/server/services/billing/get-organization-plan";
import { getUsageLimit } from "@/server/services/billing/plan-limits";

export type InvoiceLineInput = {
  itemId?: string | null;
  name: string;
  description?: string | null;
  unitName?: string | null;
  /** Decimal strings matching the `numeric(13,3)` columns. */
  quantity: string;
  price: string;
  total: string;
};

export type CreateInvoiceInput = {
  organizationId: string;
  customerId: string;
  currencyId: string;
  /** `YYYY-MM-DD`. */
  invoiceDate: string;
  dueDate?: string | null;
  notes?: string | null;
  lines: InvoiceLineInput[];
};

export type CreateInvoiceResult =
  | {
      ok: true;
      invoiceId: string;
      invoiceNumber: string;
    }
  | {
      ok: false;
      reason: "no_lines" | "plan_limit_reached";
      message: string;
    };

const SEQUENCE_RETRY_ATTEMPTS = 5;

export function formatInvoiceNumber(sequenceNumber: number): string {
  return `INV-${String(sequenceNumber).padStart(6, "0")}`;
}

/**
 * Creates a draft invoice from a flat list of lines.
 *
 * Returns plan-limit rejections instead of throwing so background callers
 * (such as the scheduler) can record the blockage on the source record and
 * keep processing the remaining work.
 */
export async function createInvoiceFromLines(
  db: DbClient,
  input: CreateInvoiceInput,
): Promise<CreateInvoiceResult> {
  if (input.lines.length === 0) {
    return {
      ok: false,
      reason: "no_lines",
      message: "Cannot create an invoice without at least one line.",
    };
  }

  const plan = await getOrganizationPlan(db, input.organizationId);
  const limit = getUsageLimit(plan, "invoices");

  if (limit !== null) {
    const [row] = await db
      .select({ total: count(invoices.id) })
      .from(invoices)
      .where(eq(invoices.organizationId, input.organizationId));

    if (Number(row?.total ?? 0) >= limit) {
      return {
        ok: false,
        reason: "plan_limit_reached",
        message: `Your plan allows up to ${limit} invoices. Upgrade to keep billing automatically.`,
      };
    }
  }

  const subTotal = sumDecimals(input.lines.map((line) => line.total));

  let lastError: unknown = null;

  // The (organization_id, sequence_number) unique index is the source of truth.
  // Two engines now create invoices, so a collision is possible under load.
  for (let attempt = 0; attempt < SEQUENCE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await db.transaction(async (tx) => {
        const [maxRow] = await tx
          .select({ maxSeq: max(invoices.sequenceNumber) })
          .from(invoices)
          .where(eq(invoices.organizationId, input.organizationId));

        const sequenceNumber = (maxRow?.maxSeq ?? 0) + 1;
        const invoiceNumber = formatInvoiceNumber(sequenceNumber);

        const [created] = await tx
          .insert(invoices)
          .values({
            organizationId: input.organizationId,
            customerId: input.customerId,
            currencyId: input.currencyId,
            sequenceNumber,
            invoiceNumber,
            invoiceDate: input.invoiceDate,
            dueDate: input.dueDate ?? undefined,
            status: "DRAFT",
            taxPerItem: false,
            discountPerItem: false,
            discountFixed: false,
            notes: input.notes ?? undefined,
            discountVal: "0.000",
            subTotal,
            total: subTotal,
            tax: "0.000",
          })
          .returning({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
          });

        if (!created) throw new Error("Invoice insert returned no rows");

        await tx.insert(invoiceItems).values(
          input.lines.map((line) => ({
            organizationId: input.organizationId,
            invoiceId: created.id,
            itemId: line.itemId ?? undefined,
            name: line.name,
            description: line.description ?? undefined,
            unitName: line.unitName ?? undefined,
            quantity: line.quantity,
            price: line.price,
            discountType: "fixed" as const,
            discount: null,
            discountVal: null,
            tax: null,
            total: line.total,
            exchangeRate: null,
            baseDiscountVal: null,
            basePrice: null,
            baseTax: null,
            baseTotal: null,
          })),
        );

        return {
          ok: true as const,
          invoiceId: created.id,
          invoiceNumber: created.invoiceNumber,
        };
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not allocate an invoice number.");
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

/** Adds `numeric(13,3)` strings without drifting through float arithmetic. */
export function sumDecimals(values: string[]): string {
  const totalThousandths = values.reduce(
    (acc, value) => acc + toThousandths(value),
    0,
  );
  return fromThousandths(totalThousandths);
}

export function multiplyDecimals(a: string, b: string): string {
  const result = (toThousandths(a) * toThousandths(b)) / 1_000_000;
  return fromThousandths(Math.round(result * 1000));
}

function toThousandths(value: string): number {
  return Math.round(Number(value || "0") * 1000);
}

function fromThousandths(value: number): string {
  return (value / 1000).toFixed(3);
}

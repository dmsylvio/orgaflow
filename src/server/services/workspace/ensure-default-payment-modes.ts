import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import { paymentModes } from "@/server/db/schemas";

const DEFAULT_PAYMENT_MODES = [
  "Bank Transfer",
  "Cash",
  "Check",
  "Credit Card",
  "Venmo",
  "Zelle",
];

export async function ensureDefaultPaymentModes(
  db: DbClient,
  organizationId: string,
) {
  const existing = await db
    .select({ id: paymentModes.id })
    .from(paymentModes)
    .where(eq(paymentModes.organizationId, organizationId))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(paymentModes).values(
    DEFAULT_PAYMENT_MODES.map((name) => ({ organizationId, name })),
  );
}

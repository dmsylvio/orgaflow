import "server-only";

import { db } from "@/server/db";
import { runScheduleBilling } from "./bill-appointments";
import { materializeDueSeries } from "./materialize-appointments";

/**
 * Hourly scheduler pass: keeps the calendar populated and turns delivered
 * appointments into invoices.
 *
 * Materialization runs first so appointments created in this pass are eligible
 * for billing in the same run.
 */
export async function processSchedule(): Promise<void> {
  const now = new Date();

  try {
    const materialized = await materializeDueSeries(db, now);
    if (materialized.created > 0) {
      console.info(
        `[schedule] Materialized ${materialized.created} appointments across ${materialized.processed} series.`,
      );
    }
  } catch (error) {
    console.error("[schedule] Materialization pass failed:", error);
  }

  try {
    const billed = await runScheduleBilling(db, now);
    if (billed.invoicesCreated > 0 || billed.blocked > 0) {
      console.info(
        `[schedule] Billing pass created ${billed.invoicesCreated} invoices from ` +
          `${billed.appointmentsBilled} appointments (${billed.blocked} blocked).`,
      );
    }
  } catch (error) {
    console.error("[schedule] Billing pass failed:", error);
  }
}

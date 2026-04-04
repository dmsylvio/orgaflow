export async function register() {
  // Only run the cron scheduler in the Node.js runtime (not Edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { schedule } = await import("node-cron");
    const { processRecurringInvoices } = await import(
      "@/server/services/recurring-invoices/process-recurring-invoices"
    );

    // Fire every hour at minute 0.
    schedule("0 * * * *", async () => {
      try {
        await processRecurringInvoices();
      } catch (err) {
        console.error("[cron] processRecurringInvoices failed:", err);
      }
    });

    console.log("[cron] Recurring invoices scheduler registered (0 * * * *)");
  }
}

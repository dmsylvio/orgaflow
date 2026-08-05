export async function register() {
  // Only run the cron scheduler in the Node.js runtime (not Edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { schedule } = await import("node-cron");
    const { processRecurringInvoices } = await import(
      "@/server/services/recurring-invoices/process-recurring-invoices"
    );
    const { processOnboardingEmails } = await import(
      "@/server/services/onboarding/process-onboarding-emails"
    );
    const { processSchedule } = await import(
      "@/server/services/schedule/process-schedule"
    );

    // Fire every hour at minute 0.
    schedule("0 * * * *", async () => {
      try {
        await processRecurringInvoices();
      } catch (err) {
        console.error("[cron] processRecurringInvoices failed:", err);
      }
    });

    // Fire once a day at 10:00 UTC.
    schedule("0 10 * * *", async () => {
      try {
        await processOnboardingEmails();
      } catch (err) {
        console.error("[cron] processOnboardingEmails failed:", err);
      }
    });

    // Materialize upcoming appointments and bill delivered ones, every half hour.
    schedule("30 * * * *", async () => {
      try {
        await processSchedule();
      } catch (err) {
        console.error("[cron] processSchedule failed:", err);
      }
    });

    console.log("[cron] Recurring invoices scheduler registered (0 * * * *)");
    console.log("[cron] Onboarding emails scheduler registered (0 10 * * *)");
    console.log("[cron] Schedule processor registered (30 * * * *)");
  }
}

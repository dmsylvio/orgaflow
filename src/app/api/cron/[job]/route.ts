import { timingSafeEqual } from "node:crypto";
import { processOnboardingEmails } from "@/server/services/onboarding/process-onboarding-emails";
import { processRecurringInvoices } from "@/server/services/recurring-invoices/process-recurring-invoices";
import { processSchedule } from "@/server/services/schedule/process-schedule";

// Called by the Cloudflare Cron Triggers (see worker.ts), never cached.
export const dynamic = "force-dynamic";

const JOBS: Record<string, () => Promise<void>> = {
  "recurring-invoices": processRecurringInvoices,
  "onboarding-emails": processOnboardingEmails,
  schedule: processSchedule,
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ job: string }> },
) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { job } = await params;
  const run = JOBS[job];
  if (!run) {
    return new Response("Unknown job", { status: 404 });
  }

  try {
    await run();
  } catch (error) {
    console.error(`[cron] ${job} failed:`, error);
    return new Response(`${job} failed`, { status: 500 });
  }

  console.log(`[cron] ${job} done`);
  return new Response(null, { status: 204 });
}

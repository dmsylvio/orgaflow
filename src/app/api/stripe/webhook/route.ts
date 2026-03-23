import { handleStripeWebhook } from "@/server/stripe/webhook-handler";

// Stripe sends a raw body — never let Next.js parse it.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new Response("Could not read request body", { status: 400 });
  }

  try {
    await handleStripeWebhook(rawBody, signature);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler error";
    console.error("[stripe/webhook]", message);
    // Return 400 so Stripe retries on signature / config errors.
    return new Response(message, { status: 400 });
  }

  return new Response(null, { status: 200 });
}

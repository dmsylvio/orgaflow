import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { getServerSessionSafe } from "@/server/auth/session";

const inputSchema = z.object({
  plan: z.enum(["growth", "enterprise"]),
  interval: z.enum(["month", "year"]),
  orgName: z.string().min(2),
  orgId: z.string().min(2),
});

const priceMap = {
  growth: {
    month: env.STRIPE_PRICE_GROWTH_MONTHLY,
    year: env.STRIPE_PRICE_GROWTH_ANNUAL,
  },
  enterprise: {
    month: env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    year: env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
  },
} as const;

export async function POST(request: Request) {
  const session = await getServerSessionSafe();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const input = inputSchema.parse(body);

  const priceId = priceMap[input.plan][input.interval];
  const origin = request.headers.get("origin") || env.BETTER_AUTH_URL || "";

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: session.user.email ?? undefined,
    success_url: `${origin}/app?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    metadata: {
      userId: session.user.id,
      plan: input.plan,
      interval: input.interval,
      orgName: input.orgName,
      orgId: input.orgId,
    },
  });

  return NextResponse.json({ url: checkout.url });
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { getServerSessionSafe } from "@/server/auth/session";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSessionSafe();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.headers.get("origin") || env.BETTER_AUTH_URL || "";

  const userRow = await db
    .select({ activeOrgId: schema.user.activeOrgId })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  const orgId = userRow[0]?.activeOrgId;
  if (!orgId) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const subRow = await db
    .select({ stripeCustomerId: schema.subscription.stripeCustomerId })
    .from(schema.subscription)
    .where(eq(schema.subscription.orgId, orgId))
    .limit(1);

  const stripeCustomerId = subRow[0]?.stripeCustomerId;
  if (!stripeCustomerId) {
    return NextResponse.json({ error: "Stripe customer not found" }, { status: 404 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/app/settings/billing`,
  });

  return NextResponse.json({ url: portal.url });
}

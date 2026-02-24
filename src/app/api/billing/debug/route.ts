import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const lastSub = await db
    .select({
      id: schema.subscription.id,
      plan: schema.subscription.plan,
      status: schema.subscription.status,
      interval: schema.subscription.interval,
      stripeCustomerId: schema.subscription.stripeCustomerId,
      stripeSubscriptionId: schema.subscription.stripeSubscriptionId,
      currentPeriodStart: schema.subscription.currentPeriodStart,
      currentPeriodEnd: schema.subscription.currentPeriodEnd,
      createdAt: schema.subscription.createdAt,
    })
    .from(schema.subscription)
    .orderBy(desc(schema.subscription.createdAt))
    .limit(1);

  return NextResponse.json({
    lastSubscription: lastSub[0] ?? null,
  });
}

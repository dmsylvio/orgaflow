import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { uuidv7 } from "uuidv7";

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "org"
  );
}

async function createOrganizationForUser(params: {
  userId: string;
  orgName: string;
}) {
  const base = slugify(params.orgName);
  let slug = base || "org";
  for (
    let i = 2;
    (
      await db
        .select({ id: schema.organization.id })
        .from(schema.organization)
        .where(eq(schema.organization.slug, slug))
        .limit(1)
    )[0];
    i++
  )
    slug = `${base}-${i}`;

  const orgId = uuidv7();
  await db.transaction(async (tx) => {
    await tx.insert(schema.organization).values({
      id: orgId,
      name: params.orgName,
      slug,
    });
    await tx.insert(schema.organizationMember).values({
      id: uuidv7(),
      orgId,
      userId: params.userId,
      isOwner: true,
    });
    await tx
      .update(schema.user)
      .set({ activeOrgId: orgId })
      .where(eq(schema.user.id, params.userId));
  });

  return orgId;
}

async function upsertSubscription(params: {
  userId: string;
  orgId: string;
  plan: string;
  interval: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
}) {
  const existing = await db
    .select({ id: schema.subscription.id })
    .from(schema.subscription)
    .where(eq(schema.subscription.orgId, params.orgId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.subscription)
      .set({
        plan: params.plan,
        interval: params.interval,
        status: params.status,
        stripeCustomerId: params.stripeCustomerId,
        stripeSubscriptionId: params.stripeSubscriptionId,
        stripePriceId: params.stripePriceId,
        currentPeriodStart: params.currentPeriodStart ?? null,
        currentPeriodEnd: params.currentPeriodEnd ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscription.id, existing[0].id));
    return;
  }

  await db.insert(schema.subscription).values({
    id: uuidv7(),
    userId: params.userId,
    orgId: params.orgId,
    plan: params.plan,
    interval: params.interval,
    status: params.status,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    stripePriceId: params.stripePriceId,
    currentPeriodStart: params.currentPeriodStart ?? null,
    currentPeriodEnd: params.currentPeriodEnd ?? null,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.log("[stripe-webhook] missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const secretTail = env.STRIPE_WEBHOOK_SECRET.slice(-6);
    console.log("[stripe-webhook] invalid signature", {
      message,
      secretTail,
      signaturePrefix: signature.slice(0, 8),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[stripe-webhook] event", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription") {
      return NextResponse.json({ received: true });
    }

    const metadata = session.metadata || {};
    console.log("[stripe-webhook] metadata", metadata);
    const userId = metadata.userId;
    const plan = metadata.plan;
    const interval = metadata.interval;
    const orgName = metadata.orgName || "Orgaflow";
    const orgIdFromMeta = metadata.orgId;

    if (!userId || !plan || !interval) {
      console.log("[stripe-webhook] missing fields", {
        userId,
        plan,
        interval,
        orgId: orgIdFromMeta,
      });
      return NextResponse.json({ received: true });
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    const stripeSubscription = subscriptionId
      ? await stripe.subscriptions.retrieve(subscriptionId)
      : null;

    let orgId = orgIdFromMeta || "";

    if (orgId) {
      const existing = await db
        .select({ id: schema.organization.id })
        .from(schema.organization)
        .where(eq(schema.organization.id, orgId))
        .limit(1);
      if (!existing[0]) {
        orgId = await createOrganizationForUser({ userId, orgName });
      }
    } else {
      orgId = await createOrganizationForUser({ userId, orgName });
    }

    await upsertSubscription({
      userId,
      orgId,
      plan,
      interval,
      status: stripeSubscription?.status ?? "active",
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : null,
      stripeSubscriptionId: subscriptionId ?? null,
      stripePriceId: stripeSubscription?.items.data[0]?.price.id ?? null,
      currentPeriodStart: stripeSubscription
        ? new Date(stripeSubscription.current_period_start * 1000)
        : null,
      currentPeriodEnd: stripeSubscription
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null,
    });

    await db
      .update(schema.user)
      .set({ activeOrgId: orgId })
      .where(eq(schema.user.id, userId));
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscriptionEvent = event.data.object as Stripe.Subscription;
    const stripeSubscriptionId = subscriptionEvent.id;

    const rows = await db
      .select({ id: schema.subscription.id, orgId: schema.subscription.orgId })
      .from(schema.subscription)
      .where(eq(schema.subscription.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);

    if (rows[0]) {
      await db
        .update(schema.subscription)
        .set({
          status: subscriptionEvent.status,
          currentPeriodStart: new Date(
            subscriptionEvent.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            subscriptionEvent.current_period_end * 1000,
          ),
          updatedAt: new Date(),
        })
        .where(eq(schema.subscription.id, rows[0].id));
    }
  }

  return NextResponse.json({ received: true });
}

import "server-only";

import { eq, or } from "drizzle-orm";
import Stripe from "stripe";
import type { WorkspacePlan } from "@/schemas/workspace";
import { db } from "@/server/db";
import { organizationSubscriptions } from "@/server/db/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

type SubscriptionUpdate = {
  plan?: "starter" | "growth" | "scale";
  status?: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  updatedAt?: Date;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/**
 * Maps a Stripe price ID back to our plan.
 * Reads the same env vars used when creating the checkout session.
 */
function planFromPriceId(priceId: string): WorkspacePlan | null {
  const env = (k: string) => process.env[k]?.trim();
  if (
    priceId === env("STRIPE_PRICE_GROWTH_MONTHLY") ||
    priceId === env("STRIPE_PRICE_GROWTH_ANNUAL")
  )
    return "growth";
  if (
    priceId === env("STRIPE_PRICE_SCALE_MONTHLY") ||
    priceId === env("STRIPE_PRICE_SCALE_ANNUAL")
  )
    return "scale";
  return null;
}

function toDate(unix: number | null | undefined): Date | null {
  return typeof unix === "number" ? new Date(unix * 1000) : null;
}

function extractId(
  field: string | { id: string } | null | undefined,
): string | null {
  if (!field) return null;
  return typeof field === "string" ? field : field.id;
}

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const known: SubscriptionStatus[] = [
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "paused",
  ];
  return known.includes(status as SubscriptionStatus)
    ? (status as SubscriptionStatus)
    : "active";
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * `checkout.session.completed`
 *
 * Primary event that links a Stripe customer + subscription to an org.
 * The `organizationId` is stored in `session.metadata` when creating the
 * checkout session in `organization-checkout.ts`.
 */
async function onCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const organizationId = session.metadata?.organizationId;
  if (!organizationId) return;

  const customerId = extractId(
    session.customer as string | { id: string } | null,
  );
  const subscriptionId = extractId(
    session.subscription as string | { id: string } | null,
  );
  if (!customerId || !subscriptionId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const subItem = sub.items.data[0];
  const priceId = subItem?.price.id ?? null;
  const plan =
    (session.metadata?.plan as WorkspacePlan | undefined) ??
    (priceId ? planFromPriceId(priceId) : null) ??
    "starter";

  await db
    .update(organizationSubscriptions)
    .set({
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      plan: plan as "starter" | "growth" | "scale",
      status: mapStatus(sub.status),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodStart: toDate(subItem?.current_period_start),
      currentPeriodEnd: toDate(subItem?.current_period_end),
      updatedAt: new Date(),
    })
    .where(eq(organizationSubscriptions.organizationId, organizationId));
}

/**
 * `customer.subscription.created` / `customer.subscription.updated`
 *
 * Handles plan changes, status transitions (e.g. trial → active, active →
 * past_due), period renewals, and cancellation scheduling.
 *
 * Tries to find the subscription row by `stripeSubscriptionId` first; if not
 * found (e.g. created event arrives before checkout.session.completed), falls
 * back to `organizationId` in the subscription metadata — which is always set
 * by `organization-checkout.ts`.
 */
async function onSubscriptionUpserted(sub: Stripe.Subscription): Promise<void> {
  const priceId = sub.items.data[0]?.price.id ?? null;
  const plan = priceId ? planFromPriceId(priceId) : null;
  const orgIdFromMeta = sub.metadata?.organizationId ?? null;

  const item = sub.items.data[0];
  const update: SubscriptionUpdate = {
    status: mapStatus(sub.status),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    currentPeriodStart: toDate(item?.current_period_start),
    currentPeriodEnd: toDate(item?.current_period_end),
    updatedAt: new Date(),
  };

  if (priceId) update.stripePriceId = priceId;
  if (plan) update.plan = plan as "starter" | "growth" | "scale";

  // Always ensure the subscription ID is stored (handles the race where
  // customer.subscription.created fires before checkout.session.completed).
  update.stripeSubscriptionId = sub.id;

  if (orgIdFromMeta) {
    await db
      .update(organizationSubscriptions)
      .set(update)
      .where(
        or(
          eq(organizationSubscriptions.stripeSubscriptionId, sub.id),
          eq(organizationSubscriptions.organizationId, orgIdFromMeta),
        ),
      );
  } else {
    await db
      .update(organizationSubscriptions)
      .set(update)
      .where(eq(organizationSubscriptions.stripeSubscriptionId, sub.id));
  }
}

/**
 * `customer.subscription.deleted`
 *
 * Stripe fires this when a subscription is permanently cancelled (not
 * scheduled). Downgrades the org to Starter and clears Stripe subscription
 * fields. The customer ID is kept so the org can re-subscribe later.
 */
async function onSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const priceId = sub.items.data[0]?.price.id ?? null;
  const plan = priceId ? planFromPriceId(priceId) : null;

  await db
    .update(organizationSubscriptions)
    .set({
      ...(plan ? { plan: plan as "starter" | "growth" | "scale" } : {}),
      status: "canceled",
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: null,
      ...(priceId ? { stripePriceId: priceId } : {}),
      currentPeriodStart: null,
      currentPeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(organizationSubscriptions.stripeSubscriptionId, sub.id));
}

/**
 * `invoice.payment_succeeded`
 *
 * Resets `past_due` / `unpaid` back to `active` and refreshes billing period
 * dates from the current subscription state.
 */
async function onInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subDetails = invoice.parent?.subscription_details;
  const subscriptionId = extractId(
    subDetails?.subscription as string | { id: string } | null | undefined,
  );
  if (!subscriptionId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const item = sub.items.data[0];

  await db
    .update(organizationSubscriptions)
    .set({
      status: "active",
      currentPeriodStart: toDate(item?.current_period_start),
      currentPeriodEnd: toDate(item?.current_period_end),
      updatedAt: new Date(),
    })
    .where(eq(organizationSubscriptions.stripeSubscriptionId, subscriptionId));
}

/**
 * `invoice.payment_failed`
 *
 * Marks the subscription as `past_due`. Stripe will retry automatically; if
 * all retries fail, it fires `customer.subscription.deleted` (or sets the
 * subscription status to `unpaid`, depending on dunning config).
 */
async function onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subDetails = invoice.parent?.subscription_details;
  const subscriptionId = extractId(
    subDetails?.subscription as string | { id: string } | null | undefined,
  );
  if (!subscriptionId) return;

  await db
    .update(organizationSubscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(organizationSubscriptions.stripeSubscriptionId, subscriptionId));
}

// ---------------------------------------------------------------------------
// Public dispatcher
// ---------------------------------------------------------------------------

/**
 * Verifies the Stripe webhook signature and dispatches to the correct handler.
 *
 * @param rawBody  Raw request body string (must NOT be parsed).
 * @param signature  Value of the `stripe-signature` header.
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret)
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    webhookSecret,
  );

  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await onSubscriptionUpserted(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_succeeded":
      await onInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      // Unknown event — acknowledge and ignore.
      break;
  }
}

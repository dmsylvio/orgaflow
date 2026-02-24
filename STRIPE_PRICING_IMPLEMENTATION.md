# Stripe Pricing Implementation (Orgaflow)

## Goal
Implement Stripe billing for Orgaflow with Free, Growth, and Enterprise plans, monthly and annual billing (annual has 40% discount). Provide a clean signup → choose plan → checkout → organization activation flow.

---

## Pricing (USD)

### Free
- Price: $0
- Companies: 1
- Invoices: 100
- Estimates: 100
- Users: 2

### Growth (Target Plan)
- Monthly: $39
- Annual: $23/mo billed yearly ($276/year, 40% off)
- Companies: up to 5
- Invoices: 5,000
- Estimates: 5,000
- Users: unlimited

### Enterprise (Anchor)
- Monthly: $99
- Annual: $59/mo billed yearly ($708/year, 40% off)
- Companies: up to 10
- Invoices: 20,000
- Estimates: 20,000
- Users: unlimited

---

## Stripe Setup

### Products (3)
1. Orgaflow Free
2. Orgaflow Growth
3. Orgaflow Enterprise

### Prices (5)
- Growth Monthly: $39 / month
- Growth Annual: $276 / year
- Enterprise Monthly: $99 / month
- Enterprise Annual: $708 / year
- Free: no price in Stripe (handled internally as $0 plan)

> Use Stripe **Products** for plan names and **Prices** for billing intervals.

---

## Flow Overview

1. **Signup**
   - User creates account → choose plan and billing interval.
   - For Free: create organization immediately.
   - For paid: redirect to Stripe Checkout.

2. **Checkout**
   - Create Stripe Checkout session with selected price ID.
   - Pass `customer_email` and `metadata` (userId, plan, interval, orgName).

3. **Webhook**
   - Listen for `checkout.session.completed` and `customer.subscription.created/updated`.
   - On success: mark subscription active, create organization, assign limits.

4. **Access Control**
   - On every request: validate current subscription status.
   - Block access to over-limit features.

---

## Data Model (Draft)

### Subscription
- id
- userId
- orgId
- plan (free | growth | enterprise)
- status (active | trialing | past_due | canceled)
- interval (month | year)
- stripeCustomerId
- stripeSubscriptionId
- stripePriceId
- currentPeriodStart
- currentPeriodEnd

### Limits (per plan)
- companies
- invoices
- estimates
- users

---

## Required Stripe Webhooks
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## Open Decisions
- Trial? (e.g. 7–14 days for paid plans)
- Proration rules on plan upgrade/downgrade
- Usage limits enforcement strategy (hard block vs warning)
- Whether Enterprise requires sales contact instead of checkout

---

## Next Steps
1. Create Stripe products/prices in test mode.
2. Add env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLIC_KEY.
3. Build checkout endpoint (server action or API route).
4. Add billing UI in dashboard (upgrade/downgrade, cancel).
5. Implement webhook handler to sync subscription state.

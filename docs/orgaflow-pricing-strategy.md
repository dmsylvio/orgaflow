# orgaflow-pricing-strategy.md
## Pricing Strategy for Orgaflow SaaS

This document defines the pricing strategy for Orgaflow using the **Decoy Pricing Strategy (Decoy Effect)** to encourage users to upgrade to the highest value plan.

The objective is to:
- Attract users with a generous free tier
- Provide value in the middle tier
- Encourage upgrades to the most profitable plan

---

# 1. Pricing Strategy Concept

The pricing model uses a well-known behavioral economics principle called:

## Decoy Effect (Decoy Pricing)

This strategy presents three pricing options where the middle option makes the highest option look significantly more valuable.

Example:

Small   $3
Medium  $6
Large   $6.50

Most people choose **Large** because the price difference is small while the perceived value is much higher.

Orgaflow will apply this same strategy with three customer-facing plans:

Orgaflow Starter
Orgaflow Growth
Orgaflow Scale

The Orgaflow Scale plan becomes the **primary conversion target**.

Internally, billing and product code must use the canonical plan ids: `starter`, `growth`, and `scale` (aligned with Stripe price metadata and entitlements).

---

# 2. Orgaflow Pricing Structure

Orgaflow Starter - $0
Orgaflow Growth - $19.99/mo or $167.99/year
Orgaflow Scale - $24.99/mo or $209.99/year

The small price difference between **Orgaflow Growth** and **Orgaflow Scale** encourages users to upgrade to Orgaflow Scale.

The annual pricing should preserve the same logic:

- **Growth Annual** offers a **30% discount** for commitment.
- **Scale Annual** matches the **30% discount** and remains the best value option.
- The annual gap stays intentionally small to reinforce the decoy effect.

---

# 3. Orgaflow Starter Plan (Free Tier)

The Orgaflow Starter plan is designed to allow users to experience the product and understand its value before upgrading.

## Limits

50 invoices
50 estimates
50 customers
50 items
2 users
No attachment storage (attachments not included)

## Included Features

- Dashboard
- Customers
- Items
- Estimates
- Invoices
- Manual payments
- PDF export
- Basic reporting

## Restrictions

- No tasks
- No Stripe payments
- No workflow automations
- No attachments
- No branded documents
- No platform billing
- Orgaflow footer required on Starter plan document exports

## Goal

The goal of the Starter plan is:

- Allow users to test the platform
- Help them reach the point where they depend on the product
- Create a natural reason to upgrade when their usage grows

---

# 4. Orgaflow Growth Plan - $19.99/mo or $167.99/year

The Orgaflow Growth plan is designed for freelancers and small businesses that require more functionality but do not yet need advanced automation or integrated payments.

## Limits

Unlimited invoices
Unlimited estimates
Unlimited customers
5 users
1 GB attachment storage

## Included Features

Everything in Starter plus:

- Attachments
- Public invoice links
- Estimate approval
- Custom branding
- Activity timeline

## Restrictions

Payments remain **manual only**.

No Stripe payments

## Purpose of this Plan

The Growth plan acts as the **decoy tier**.

It offers meaningful improvements but intentionally excludes the most valuable feature: **online payments**.

This encourages users to upgrade to the Orgaflow Scale plan.

## Annual Pricing Logic

`$167.99/year` gives the user a meaningful annual discount while keeping Growth clearly below Scale in perceived value.

---

# 5. Orgaflow Scale Plan - $24.99/mo or $209.99/year (Most Popular)

The Orgaflow Scale plan is the primary revenue driver.

This plan includes the most powerful features and is intended for businesses actively using Orgaflow for daily operations.

## Limits

Unlimited invoices
Unlimited estimates
Unlimited customers
Up to 10 users
10 GB attachment storage

## Included Features

Everything in Growth plus:

- Stripe payments
- Workflow automations
- Automatic task creation
- Advanced reports
- Priority support

## Key Feature

The most important upgrade trigger:

Accept online payments through Stripe

Businesses quickly realize that being able to receive payments directly from invoices saves time and increases revenue.

This becomes a strong motivation to upgrade.

## Annual Pricing Logic

`$209.99/year` keeps the annual gap against Growth at only `$42/year`.

That makes Orgaflow Scale feel like the obvious better deal for teams already willing to pay for the product.

---

# 6. Why Stripe Payments Should Be Paid

Allowing Stripe payments only in the Orgaflow Scale plan is strategic.

When a user reaches the point where they want to collect payments online, their business is already active and generating revenue.

At that moment the upgrade decision becomes easy.

Example trigger:

Upgrade to Orgaflow Scale to accept online payments from your customers.

This creates a powerful conversion moment.

---

# 7. Starter Plan Conversion Triggers

Starter users should naturally encounter upgrade triggers such as:

You reached the limit of 50 invoices.
Upgrade to continue sending invoices.

or

Upgrade to Orgaflow Scale to accept online payments.

The key idea is to limit **usage**, not **core features**.

---

# 8. Recommended Pricing Page Layout

Orgaflow Starter - $0

- 50 invoices
- 50 estimates
- 50 customers
- 50 items
- 2 users
- No attachments
- Manual payments
- PDF export
- No tasks or automations

---

Orgaflow Growth - $19.99/mo or $167.99/year

- Unlimited invoices
- Unlimited estimates
- Unlimited customers
- 5 users
- 1 GB attachments
- Attachments
- Estimate approval
- Branding
- Activity timeline
- Manual payments only

---

Orgaflow Scale - Most Popular - $24.99/mo or $209.99/year

- Everything in Growth
- Stripe payments
- Workflow automations
- Task creation
- Advanced reports
- Up to 10 users
- 10 GB attachments

Marking the Orgaflow Scale plan as **Most Popular** significantly improves conversion.

---

# 9. Important Rule for Trials

All plans should include the same free trial window.

Recommended approach:

Free trial 15 days on Starter, Growth, and Scale

After the trial, billing starts automatically unless the subscription is canceled.

---

# 10. Additional Monetization Opportunities

In the future, Orgaflow could generate additional revenue through:

- Payment processing fee (optional)
- API access plans
- Advanced automation plans
- Additional team seats
- Premium integrations

These can be introduced after the initial launch.

---

# 11. Final Recommendation

The pricing structure should guide users naturally toward the Orgaflow Scale plan.

Starter -> Adoption
Growth -> Entry paid tier
Scale -> Main revenue plan

The Scale plan should always appear as the best value option.

Recommended annual pricing:

- **Starter Annual**: $83.92/year
- **Growth Annual**: $209.92/year
- **Scale Annual**: $377.92/year

This keeps the annual discount consistent across all tiers while preserving a clear value ladder from Starter to Scale.

This combination of usage limits, feature gating, and behavioral pricing psychology will maximize conversion while keeping the product accessible to new users.

---

# 12. Plan Descriptions (English - for Stripe and Website)

## Orgaflow Starter (internal id: `starter`)

### Short description (Stripe)

Orgaflow Starter plan — $9.99/month or $83.92/year. Includes a 15-day free trial for freelancers and small teams to manage customers, items, estimates, and invoices with generous usage limits, manual payment tracking, PDF export, and basic reporting. No tasks, automations, attachments, or online payments.

### Extended description (website)

Orgaflow Starter is the entry plan for Orgaflow. Ideal for freelancers and very small teams that need to organize customers, items, estimates, and invoices at a lower monthly cost, with a 15-day free trial before billing starts. It includes a dashboard, customers and items management, estimates and invoices, manual payment recording, PDF export, and basic reporting. Limits: 50 customers, 50 invoices, 50 estimates, 50 items, and up to 2 users. File attachments are not included. No tasks, automations, fully branded documents, or online payments.

---

## Orgaflow Growth (internal id: `growth`)

### Short description (Stripe)

Orgaflow Growth plan — $24.99/month or $209.92/year. Everything in Orgaflow Starter with unlimited invoices, estimates, and customers, plus attachments, public invoice links, estimate approvals, custom branding, and activity timeline, while keeping payments as manual registration. Includes a 15-day free trial.

### Extended description (website)

Orgaflow Growth is the plan for freelancers and small businesses operating at a professional pace. It includes everything in the Orgaflow Starter plan and removes the main usage limits: invoices, estimates, and customers become unlimited, with up to 5 users and 1 GB of attachment storage. You also get attachments on documents, public invoice links, estimate approval workflows, custom branding, and a detailed activity timeline, while keeping payments as manual registration. It’s the ideal step up for teams that need more polish and control without enabling online payments and automations yet.

---

## Orgaflow Scale (internal id: `scale`) — Most Popular

### Short description (Stripe)

Orgaflow Scale — $44.99/month or $377.92/year. Everything in Orgaflow Growth plus Stripe online payments, workflow automations (optional, status-based triggers), automatic task creation from those automations, advanced reporting, priority support, up to 10 users, and 10 GB attachment storage, built for teams running their daily operations on Orgaflow. Includes a 15-day free trial.

### Extended description (website)

Orgaflow Scale is the full Orgaflow experience, built for teams running their daily operations on the platform. It includes everything in the Orgaflow Growth plan and adds the most valuable capabilities: accept online payments via Stripe directly from invoices, enable workflow automations with per-rule on/off and **configurable triggers by document status** (the product does **not** auto-create tasks from estimate approval by default), generate tasks when those rules fire, and access advanced reports and priority support, with up to 10 users per account and 10 GB attachment storage. This is the recommended plan for businesses that want to centralize billing, operations, and automation in one place.

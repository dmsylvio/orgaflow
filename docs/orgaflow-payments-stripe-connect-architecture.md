# Orgaflow — `payments` domain architecture with Stripe Connect

## Purpose

This document defines the Orgaflow `payments` domain using **Stripe Connect**, focusing on:

- security
- multi-tenancy
- feature readiness
- separation of feature, configuration, and connection
- integration with invoices
- implementation within the current `src/server` layout

**Core decision:**

> Orgaflow **does not** store the customer’s default **secret key**.  
> Orgaflow uses **Stripe Connect**: Orgaflow’s Stripe account is the **platform**, and each SaaS tenant is a **connected account**.

---

# 1. Core decision

## 1.1 What we will not do

We will not ask the customer to paste:

- secret key
- publishable key
- webhook secret

as the primary integration model.

### Why

That approach:

- increases security risk
- widens the attack surface
- complicates credential rotation
- makes the SaaS responsible for storing critical customer secrets

---

## 1.2 What we will do

We use **Stripe Connect**.

### Model

- Orgaflow has a platform Stripe account
- each organization connects its own Stripe account to Orgaflow
- Orgaflow stores only:
  - `stripe_account_id`
  - connection status
  - account capabilities
  - readiness data

### Benefit

Orgaflow operates with:

- the **platform** secret key
- **connected account** context

without storing the customer’s default secret key.

---

# 2. Role of `payments` in the system

## 2.1 Payments is a feature

In Orgaflow, `payments` is an **organization feature**.

### Rules

- can be turned on or off
- lives under **Settings**
- is **owner-only**
- does **not** appear in the main app menu
- may use Stripe as a provider
- needs configuration before it is **ready**

---

## 2.2 Payments is not only “connection”

The `payments` domain must handle four concerns:

1. **feature state**
2. **payment settings**
3. **Stripe connection**
4. **readiness**

---

# 3. Domain concepts

## 3.1 Feature

The organization has the `payments` feature on or off.

Example:

- plan allows payments
- owner enabled payments

## 3.2 Configuration

The organization defines how it wants to operate payments.

Examples:

- default method
- payment instructions
- active provider
- future payment options

## 3.3 Connection

The organization connects its Stripe account to Orgaflow.

This yields:

- `stripe_account_id`
- account status
- capabilities
- onboarding state

## 3.4 Readiness

The feature is only ready when:

- it is available
- it is enabled
- the connection exists
- onboarding / capabilities are valid

---

# 4. Readiness rule

Mental model:

```txt
payments.ready =
  feature available
  && feature enabled
  && stripe connected
  && onboarding/configuration valid
```

---

# 5. `payments` domain structure

Suggested layout:

```txt
src/server/payments/
├─ payments.types.ts
├─ payments.schema.ts
├─ stripe-connect.schema.ts
├─ payments.service.ts
├─ payments.repository.ts
├─ stripe-connect.service.ts
├─ stripe-connect.repository.ts
├─ payments-readiness.ts
└─ index.ts
```

---

# 6. File responsibilities

## `payments.types.ts`

Domain types.

Examples:

- `PaymentsProvider`
- `PaymentsStatus`
- `PaymentsReadiness`
- `StripeConnectionStatus`

---

## `payments.schema.ts`

Zod schemas for:

- updating module settings
- enabling/disabling payments
- choosing provider
- updating payment instructions

---

## `stripe-connect.schema.ts`

Zod schemas for:

- starting onboarding
- refreshing onboarding
- syncing account
- disconnecting Stripe
- updating provider data if needed

---

## `payments.service.ts`

Main domain layer.

Responsible for:

- validating that the payments feature is active
- returning overall module state
- orchestrating settings + connection + readiness
- integrating with invoices when needed

---

## `payments.repository.ts`

Database access for domain settings.

Responsible for:

- read/write `organization_payment_settings`
- persistence for the payments module

---

## `stripe-connect.service.ts`

Stripe API integration.

Responsible for:

- creating connected accounts
- creating onboarding links
- creating refresh links
- syncing account data
- interpreting connection status

---

## `stripe-connect.repository.ts`

Stripe connection persistence.

Responsible for:

- read/write `organization_stripe_connections`
- `stripe_account_id`
- status / capabilities / sync data

---

## `payments-readiness.ts`

Resolve final module state.

Responsible for:

- `available`
- `enabled`
- `connected`
- `configured`
- `ready`
- `status`

---

# 7. Database structure

## 7.1 `organization_features`

Generic per-organization feature flags.

### Conceptual fields

```txt
id
organization_id
feature_key
enabled
created_at
updated_at
```

### Usage here

For `payments`, the relevant key is:

- `feature_key = "payments"`

---

## 7.2 `organization_payment_settings`

Operational settings for the domain.

### Suggested fields

```txt
id
organization_id
provider
default_payment_method
instructions
created_at
updated_at
```

### Notes

- `provider` may start as `stripe`
- `default_payment_method` can grow over time
- `instructions` can be used on invoices and payment pages

---

## 7.3 `organization_stripe_connections`

Stripe Connect connection table.

### Suggested fields

```txt
id
organization_id
stripe_account_id
charges_enabled
payouts_enabled
details_submitted
country
default_currency
account_type
onboarding_completed
last_synced_at
created_at
updated_at
```

### Note

`stripe_account_id` is the primary identifier for the connected account.

---

## 7.4 What we will not store

We do **not** store as the default model:

- customer secret key
- customer publishable key
- customer webhook secret

If a future custom provider needs extra secrets, treat that as an exception with strong encryption and secret management—not the base product rule.

---

# 8. Onboarding flow

## 8.1 Preconditions

To start Stripe onboarding:

1. user must be authenticated
2. membership must be active
3. user must be owner
4. `payments` feature must be enabled

---

## 8.2 End-to-end flow

### Step 1 — owner enables Payments

Owner enables `payments` in Settings.

Result:

- `organization_features.payments = true`

---

### Step 2 — owner clicks “Connect Stripe”

Backend:

1. checks whether a Stripe connection already exists
2. if not, creates the connected account
3. generates onboarding link
4. returns URL for redirect

---

### Step 3 — Stripe onboarding

Owner completes Stripe-hosted onboarding.

---

### Step 4 — return to Orgaflow

After return:

1. Orgaflow fetches the connected account
2. updates stored data
3. recalculates readiness

---

### Step 5 — final status

The module ends in one of:

- `disconnected`
- `pending_onboarding`
- `restricted`
- `connected`
- `ready`

---

# 9. Module status

## Suggested states

### `disconnected`

- no `stripe_account_id` yet

### `pending_onboarding`

- account created
- onboarding not finished

### `restricted`

- account exists
- requirements still missing

### `connected`

- account connected
- some operational configuration still missing

### `ready`

- module can be used to collect payments

---

# 10. Module readiness

## Suggested type

```ts
type PaymentsReadiness = {
  available: boolean;
  enabled: boolean;
  connected: boolean;
  configured: boolean;
  ready: boolean;
  status:
    | "disconnected"
    | "pending_onboarding"
    | "restricted"
    | "connected"
    | "ready";
};
```

---

## Suggested rules

### `available`

Plan allows `payments`.

### `enabled`

Feature is turned on by the organization.

### `connected`

`stripe_account_id` exists.

### `configured`

Stripe account is validly connected.

### `ready`

```txt
available && enabled && connected && configured
```

---

## Initial rule for `configured`

For MVP:

```txt
configured =
  details_submitted === true
  && charges_enabled === true
```

Optionally include `payouts_enabled === true`.

---

# 11. How the domain surfaces in the product

## 11.1 Menu

Payments **does not** appear in the main menu.

---

## 11.2 Settings

Payments appears at:

```txt
/app/settings/payments
```

Access: **owner-only**.

---

## 11.3 Invoices

Invoices can use `payments` domain state.

Examples:

- show/hide “Collect payment”
- show “Complete Stripe setup”
- display payment instructions
- enable online flow when `payments.ready === true`

---

# 12. Invoice integration

## Usage rule

Online charging is allowed only if:

1. `payments` is `ready`
2. user has relevant invoice permissions
3. invoice status allows charging

---

## Behavior examples

### If `payments.ready === false`

- hide online payment button, or
- show CTA: “Complete payment setup in Settings”

### If `payments.ready === true`

- allow actions such as:
  - payment link
  - checkout
  - payment request

---

# 13. Suggested types

## `PaymentsProvider`

```ts
type PaymentsProvider = "stripe";
```

Future:

```ts
type PaymentsProvider = "stripe" | "manual" | "paypal";
```

---

## `StripeConnectionStatus`

```ts
type StripeConnectionStatus =
  | "disconnected"
  | "pending_onboarding"
  | "restricted"
  | "connected"
  | "ready";
```

---

# 14. tRPC router structure

Recommended router:

```txt
src/server/trpc/routers/payments.ts
```

## Suggested procedures

- `payments.getSettings`
- `payments.updateSettings`
- `payments.getConnectionStatus`
- `payments.startStripeOnboarding`
- `payments.refreshStripeOnboarding`
- `payments.syncStripeConnection`
- `payments.disconnectStripe`

---

## Access rules

All procedures:

- authenticated
- organization-scoped
- owner-only

---

# 15. Procedure behavior

## `payments.getSettings`

Returns:

- saved settings
- feature state
- connection state
- final readiness

---

## `payments.updateSettings`

Updates:

- provider
- instructions
- default payment method

Access: owner-only.

---

## `payments.getConnectionStatus`

Returns:

- `stripe_account_id`
- capabilities
- onboarding state
- resolved status

---

## `payments.startStripeOnboarding`

Responsibilities:

1. validate owner
2. validate feature enabled
3. create connected account if needed
4. generate onboarding link
5. return URL

---

## `payments.refreshStripeOnboarding`

Responsibilities:

- generate a new onboarding link if onboarding is incomplete

---

## `payments.syncStripeConnection`

Responsibilities:

- fetch Stripe account
- update local DB
- recalculate readiness

---

## `payments.disconnectStripe`

Responsibilities:

- mark module disconnected
- clear or archive local link
- require owner confirmation

For MVP, may only invalidate local connection without deleting history.

---

# 16. Repositories

## `payments.repository.ts`

Responsible for:

- fetching domain settings
- updating settings
- fetching feature enabled flag

---

## `stripe-connect.repository.ts`

Responsible for:

- fetching Stripe connection by organization
- saving `stripe_account_id`
- updating capabilities/status
- marking sync

---

# 17. Services

## `payments.service.ts`

Responsible for:

- aggregated module response
- combining:
  - feature state
  - payment settings
  - stripe connection
  - readiness

---

## `stripe-connect.service.ts`

Responsible for:

- direct Stripe SDK integration
- connected account creation
- onboarding links
- account sync
- reading capabilities

---

# 18. Security

## Project rules

### 1. Never store the customer default secret key

Fixed rule.

### 2. Operate with the platform secret key

Backend uses only Orgaflow’s platform key.

### 3. Store only IDs and connection state

Examples:

- `stripe_account_id`
- capabilities
- readiness

### 4. Platform secrets are infrastructure

Platform secrets live in:

- secure env
- secret manager, if applicable
- never in the frontend

---

# 19. Why Stripe Connect fits Orgaflow

## Security

No customer secret key storage.

## Real multi-tenancy

Each business uses its own Stripe account.

## Scalability

Supports SaaS growth without changing the model.

## Compliance

Stripe handles onboarding and connected-account requirements.

## UX

Owner connects an account—no pasting technical credentials.

---

# 20. Product flow summary

## For the owner

### Settings > Payments

1. enable feature
2. connect Stripe
3. complete onboarding
4. return to Orgaflow
5. see status: `connected` / `ready`

---

## For operational users

On the invoice:

- if payments is ready, online charging is possible
- if not, only manual methods or setup warnings

---

# 21. Suggested implementation order

## Phase 1

- domain schema
- tables
- repository
- basic settings

## Phase 2

- Stripe Connect integration
- create connected account
- onboarding link
- sync

## Phase 3

- readiness
- status UI
- Settings > Payments

## Phase 4

- invoice integration
- online charging actions
- conditional behavior by readiness

---

# 22. Conclusion

The `payments` domain should follow:

1. **Payments is an organization feature**
2. **Payments lives in Settings and is owner-only**
3. **Orgaflow uses Stripe Connect**
4. **Orgaflow does not store the customer default secret key**
5. **Stripe connection is modeled as a connected account**
6. **Readiness decides whether the feature can be used**
7. **Invoices consult `payments` to know if online charging is allowed**

This design is secure, scalable, multi-tenant, and aligned with the rest of Orgaflow’s architecture.

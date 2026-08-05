# Orgaflow — System Overview (reference)

**Purpose of this document.** A single entry point that explains what Orgaflow is, how it is built, and where everything lives. Read this first when returning to the codebase after time away, or when onboarding a new contributor (human or AI). Deep dives live in the sibling documents linked from [`README.md`](./README.md); this file is the map, not the territory.

Last verified against the codebase: August 2026.

---

## 1. What the product is

Orgaflow is a **multi-tenant B2B SaaS that owns the "quote-to-cash-to-done" loop** for small businesses.

The core loop, and the thing that differentiates it from accounting tools like FreshBooks or QuickBooks, is that **getting paid kicks off the work**:

```
Customer → Estimate → Client approves (public link, no login)
         → Invoice → Payment recorded → Automation creates a Task
```

Everything else in the product (items catalog, expenses, recurring invoices, reports, Kanban) supports that loop.

---

## 2. Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Framework | Next.js `16.2.0` (App Router, Turbopack) | See §12 for version-specific gotchas |
| UI runtime | React `19.2.4` | **React Compiler is enabled** (`reactCompiler: true`) |
| Language | TypeScript | |
| API | tRPC v11 + SuperJSON | End-to-end types, no REST for domain logic |
| Data fetching | TanStack React Query v5 | Wired through tRPC client |
| Database | PostgreSQL + Drizzle ORM | 36 tables, SQL migrations in `drizzle/` |
| Auth | Auth.js / NextAuth `5.0.0-beta` | Credentials provider only, JWT sessions |
| Validation | Zod v4 + React Hook Form | |
| Styling | Tailwind CSS 3 + Radix UI primitives | Local shadcn-style components in `src/components/ui/` |
| Billing | Stripe (subscriptions) | Workspace subscriptions only — see §7 |
| Email | Resend | `nodemailer` is only a transitive Auth.js dependency |
| File storage | Vercel Blob + `document_files` table | |
| PDF | `@react-pdf/renderer` | 3 templates each for invoice and estimate |
| Scheduling | `node-cron` via `instrumentation.ts` | |
| Tooling | pnpm `10.x`, Biome `2.2` | `pnpm lint` / `pnpm format` |

---

## 3. Repository layout

```text
src/app/                    Next.js App Router
  (marketing)/              Public site: landing, pricing, about, roadmap, legal
  (auth)/                   Login, register, forgot/reset password
  (private)/app/            The authenticated product
    workspace/              Org picker + org creation (plan selection)
    (home)/                 Dashboard + all domain modules + settings
  estimate/[token]/         Public shareable estimate page
  invoice/[token]/          Public shareable invoice page
  invite/[token]/           Team invitation acceptance
  api/                      10 route handlers (see §11)
src/server/                 Server source of truth
  db/schemas/               Drizzle table definitions (barrel in index.ts)
  trpc/                     init.ts (procedure tiers), context.ts, root.ts, routers/
  iam/                      Permission catalog, ability helpers, menu definitions
  services/                 billing, email, notifications, automations, recurring, onboarding, iam
  stripe/                   Checkout session creation + webhook handler
  actions/                  Server Actions (auth, contact form)
src/trpc/                   Client-side tRPC wiring (React Query provider, RSC proxy)
src/components/             Shared UI (ui/, marketing/, auth/, providers/), plan-gate.tsx
src/schemas/                Zod schemas (auth, workspace, invitations, recurring)
src/lib/                    subscription-plans.ts, pdf/, formatting, base-url, utils
docs/                       Architecture and product docs (English)
drizzle/                    SQL migrations + meta snapshots
proxy.ts                    Route-level auth guard (this project's "middleware")
```

---

## 4. Data model

The database has **38 tables**. The tenant root is `organizations` — note the naming mismatch: **the UI and routes say "workspace", the database says "organization"**. Nearly every business entity carries `organization_id` with `onDelete: cascade`.

### Table groups

**Identity (global, not tenant-scoped)**
`users`, `accounts`, `session`, `authenticator`, `verificationToken`, `user_email_preferences`

**Tenant and access control**
`organizations`, `organization_members`, `roles`, `role_permissions`, `invitations`, `organization_subscriptions`, `organization_preferences`, `organization_features`, `organization_notification_settings`

**Global catalogs (shared across tenants)**
`currencies`, `units`, `languages`

**CRM and catalog (tenant-scoped)**
`customers`, `items`, `tax_types`, `payment_modes`, `expense_categories`, `notes`

**Financial documents**
`estimates` + `estimate_items`, `invoices` + `invoice_items`, `payments`, `expenses`

**Recurring billing**
`recurring_invoice_templates` + `recurring_invoice_template_items`

**Work execution**
`task_stages`, `tasks`, `automation_rules`

**Scheduling** — see [`schedule-module.md`](./schedule-module.md)
`schedule_series` (recurrence rule) + `appointments` (materialized occurrences, optionally linked to a generated invoice)

**Attachments**
`document_files` (polymorphic: `resourceType` + `resourceId` → expense | estimate | invoice)

### Status enums (PostgreSQL `pgEnum`)

| Enum | Values |
| --- | --- |
| `estimate_status` | `DRAFT`, `SENT`, `VIEWED`, `EXPIRED`, `APPROVED`, `REJECTED` |
| `invoice_status` | `DRAFT`, `PENDING`, `SENT`, `VIEWED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID` |
| `recurring_status` | `active`, `on_hold`, `completed` |
| `subscription_plan` | `starter`, `growth`, `scale` |
| `subscription_status` | `incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `paused` |

Three entities deliberately have **no status column**:

- **Tasks** — state is the Kanban column (`stageId` → `task_stages`), not an enum.
- **Payments** — a payment has no lifecycle; it mutates `invoices.status` instead (`PARTIALLY_PAID` / `PAID`).
- **Expenses** — recorded facts, no workflow.

### Migrations

Migrations live in `drizzle/` with a journal at `drizzle/meta/_journal.json` (17 entries). Some SQL files exist outside the journal (for example `0016_org_logo_url.sql`, `0017_pdf_templates.sql`), so treat the journal as authoritative and verify before assuming a migration was applied.

---

## 5. Multi-tenancy

The model is **shared database + `organization_id` column**, enforced entirely in the application layer.

How the active workspace is resolved on every request:

1. The client sends header `x-organization-id`, or the server falls back to the `active_organization_id` cookie. Both constants are in `src/server/trpc/constants.ts`.
2. `createTRPCContext` (`src/server/trpc/context.ts`) puts `organizationId` on the tRPC context.
3. `organizationProcedure` (`src/server/trpc/init.ts`) rejects the call unless the user is authenticated, an org is active, the user is a member of it, and the subscription is in an accessible state.
4. Each router then filters queries explicitly with `eq(table.organizationId, ctx.organizationId)`.

> **There is no Row Level Security in PostgreSQL.** Isolation depends on step 4 being done correctly in every query. A router that forgets the `organizationId` filter leaks data across tenants, and nothing below the application will catch it. Treat this as the single most important invariant when adding queries.

---

## 6. IAM (identity and access management)

Three access modes, specified in detail in [`iam-architecture-technical.md`](./iam-architecture-technical.md):

1. **Self** — account-level settings, `protectedProcedure`, no org involved.
2. **Owner** — `organization_members.is_owner = true` bypasses all permission checks.
3. **Role-based** — non-owners hold `resource:action` permissions (for example `invoice:create`, `item:view-prices`) resolved from `roles` and `role_permissions`.

Supporting pieces: the permission catalog and helpers in `src/server/iam/` (`permissions.ts`, `ability.ts`, `permission-utils.ts`), ability resolution in `src/server/services/iam/get-current-ability.ts`, and navigation generated then filtered by the resolved ability (`menu.ts`, `filter-menu.ts`). Saving a role automatically expands permission dependencies, so granting `invoice:create` also grants `invoice:view`.

`src/server/auth/permissions.ts` (`assert_org_permission`) is legacy and referenced by no active router.

---

## 7. API layer (tRPC)

### Procedure tiers — `src/server/trpc/init.ts`

| Procedure | Requires |
| --- | --- |
| `publicProcedure` | nothing |
| `protectedProcedure` | authenticated session |
| `organizationProcedure` | auth + active org + membership + resolved ability + accessible billing |
| `ownerProcedure` | all of the above + `isOwner` |
| `requirePermission(key)` | chainable after `organizationProcedure` |
| `requirePlan(minPlan)` | chainable; used to gate Scale-only features |

### Routers — `src/server/trpc/root.ts`

`root.ts` mounts **18 domain routers** plus a `health` query and a `viewer` query defined inline:

`account`, `automations`, `dashboard`, `customers`, `estimates`, `expenses`, `iam`, `invoices`, `recurringInvoices`, `items`, `payments`, `reports`, `role`, `schedule`, `settings`, `tasks`, `team`, `workspace`.

Client wiring lives in `src/trpc/` — `client.tsx` (React provider, batched HTTP link to `/api/trpc`) and `server.tsx` (RSC proxy).

Zod validation for auth, workspace onboarding, invitations, and recurring invoices is centralized in `src/schemas/`. **The remaining domains validate inline inside their routers**, which is a deviation from the "schemas live in one place" convention worth knowing before you go looking for a file that does not exist.

---

## 8. Authentication

- **Credentials provider only** (`src/server/auth/credentials.ts`) — email plus bcrypt comparison. No OAuth providers are configured.
- **JWT session strategy.** The Drizzle adapter is present for Auth.js compatibility (verification tokens, future OAuth), but sessions are not read from the database.
- Callbacks in `auth.ts` copy `user.id` into `token.sub` and back onto `session.user.id`.
- Route protection lives in **`proxy.ts` at the repo root**, not `middleware.ts`. Public routes are `/` and `/pricing`; auth routes redirect signed-in users to `/app`; everything under `/app/*` requires a session.
- Registration, forgot-password, and reset-password are **Server Actions** in `src/server/actions/auth.ts`, not tRPC.

---

## 9. Billing, plans, and gating

### Plans — `src/lib/subscription-plans.ts`

| Plan | Price | Included |
| --- | --- | --- |
| Starter | Free | 50 customers, 50 items, 50 estimates, 50 invoices |
| Growth | $24.99/mo | Unlimited records, branding, 1 GB attachments |
| Scale | $44.99/mo | Everything + Kanban, workflow automations, 10 GB |

Annual billing applies a **30% discount** (`ANNUAL_DISCOUNT_PERCENT`) and paid plans start with a **15-day trial** (`PLAN_TRIAL_DAYS`). Prices are computed from the monthly value, so changing one constant updates the marketing page, the workspace creation screen, and billing settings together.

### Where gating is actually enforced

- **Record limits** — `src/server/services/billing/plan-limits.ts` returns `50` for Starter and `null` (unlimited) otherwise, checked on create in the `customers`, `items`, `estimates`, and `invoices` routers.
- **Scale-only features** — `requirePlan("scale")` on the `tasks` and `automations` routers.
- **Ungated on purpose** — the `schedule` router has no `requirePlan`; the calendar is available on every plan. Note the interaction: invoices it generates still count against the Starter 50-invoice limit, and the scheduler records `billing_blocked_reason` rather than failing (see [`schedule-module.md`](./schedule-module.md)).
- **Client-side** — `src/components/plan-gate.tsx` exposes `PlanGate` (blocking banner) and `usePlanCheck` (disables queries).
- **Degraded plan** — if the Stripe status is `incomplete`, `incomplete_expired`, `canceled`, or `paused`, the effective plan falls back to Starter (`get-organization-plan.ts`).

### Stripe integration

Stripe is used for **workspace subscriptions only**. Checkout session creation is in `src/server/stripe/organization-checkout.ts`, the webhook handler in `src/server/stripe/webhook-handler.ts` (handles `checkout.session.completed`/`expired`, `customer.subscription.created`/`updated`/`deleted`, `invoice.payment_succeeded`/`failed`), and price IDs are mapped in `src/lib/stripe-subscription-prices.ts`.

**Stripe Connect is not implemented** — see §13.

---

## 10. Feature subsystems

### Public client links
Estimates and invoices carry a `publicLinkToken`, generated when the document is emailed. `/estimate/[token]` lets a client view, download the PDF, and **approve or reject** without an account; `/invoice/[token]` is read-only. First open marks the document `VIEWED` and can notify the owner. Expiry is configurable via `organizationPreferences.publicLinksExpireDays` (default 7).

### PDF generation
`@react-pdf/renderer` rendered server-side with `renderToBuffer()`. Three templates each for invoices and estimates in `src/lib/pdf/templates/`, selected per organization via `organizationPreferences.invoiceTemplate` / `estimateTemplate` (values 1–3). Four routes serve them (authenticated and public variants for both document types).

### Attachments
`POST /api/upload` validates session, membership, and resource ownership; restricts MIME types; caps files at 25 MB; stores in Vercel Blob under `{orgId}/{resourceType}/{resourceId}/{timestamp}-{filename}` and records metadata in `document_files`. Organization logos use a separate endpoint capped at 5 MB.

### Workflow automations
Rules in `automation_rules` express **"when document X reaches status Y, create a task"**. They support title/description templates with placeholders like `{{invoice.number}}` and `{{customer.name}}`, a target Kanban stage, an assignment strategy (`document_owner` or `organization_owner`), and a due-date offset. Maximum 10 rules per organization. The engine is `src/server/services/automations/run-workflow-automations.ts`, invoked from the `invoices`, `estimates`, and `payments` routers and from recurring invoice generation. It silently returns zero created tasks when the plan is below Scale.

### Email (Resend)
Implemented: welcome, onboarding D+1 and D+3, team invitations, send estimate, send invoice, automatic recurring invoice, contact form, and four notification types (document viewed, estimate approved/rejected, payment received, invoice overdue). Templates and the client live in `src/server/services/email/`.

### Background jobs
Registered in `src/instrumentation.ts`, Node runtime only:

| Schedule | Job | Effect |
| --- | --- | --- |
| `0 * * * *` (hourly) | `processRecurringInvoices` | Generates invoices from due templates, advances `nextRunAt`, optionally emails |
| `0 10 * * *` (daily, 10:00 UTC) | `processOnboardingEmails` | Sends D+1 and D+3 onboarding emails |
| `30 * * * *` (hourly) | `processSchedule` | Materializes upcoming appointments and bills delivered ones |

Because this uses in-process `node-cron`, jobs run **per server instance**. Horizontal scaling would double-execute them; that is a deployment constraint to keep in mind.

---

## 11. API routes

| Route | Purpose |
| --- | --- |
| `/api/auth/[...nextauth]` | Auth.js handlers |
| `/api/trpc/[trpc]` | tRPC endpoint |
| `/api/stripe/webhook` | Stripe events (raw body) |
| `/api/workspace/checkout/success` | Post-checkout callback; sets active org cookie |
| `/api/upload` | Document attachments |
| `/api/upload/logo` | Organization logo upload/removal |
| `/api/pdf/invoice/[id]` | Invoice PDF (authenticated) |
| `/api/pdf/invoice/public/[token]` | Invoice PDF (public link) |
| `/api/pdf/estimate/[id]` | Estimate PDF (authenticated) |
| `/api/pdf/estimate/public/[token]` | Estimate PDF (public link) |

---

## 12. Working in this codebase — gotchas

**This is Next.js 16, not the Next.js most references describe.** Per `AGENTS.md`, consult the bundled docs in `node_modules/next/dist/docs/` before writing framework code.

**The React Compiler is enabled.** Avoid naming local variables after browser globals. A `useState` setter named `setInterval` shadows the global timer function and the compiler's handling of it broke a working toggle in a way that looked like a dead click handler. Prefer descriptive names such as `setBillingInterval`.

**Developing over the LAN requires `allowedDevOrigins`.** Next.js 16 blocks cross-origin dev resources by default, which silently prevents client hydration when you open the app from a network IP instead of `localhost`. The allowed origins are configured in `next.config.ts`, and changes there require a dev server restart.

**Biome is stricter than expected about ARIA.** It rejects `role="radio"` and `role="group"` on `div`/`button` elements in favor of native form elements. For segmented toggles, plain buttons with `aria-pressed` pass cleanly.

**Terminology.** "Workspace" in the UI equals `organization` in the database and in most server code.

---

## 13. Known gaps — promised vs. implemented

These are places where documentation, marketing copy, or UI promise behavior the code does not yet deliver. Verify before quoting any of them to a customer.

| Gap | Current reality |
| --- | --- |
| **Online payments via Stripe Connect** | Advertised on the landing page (features list and FAQ) and the roadmap as a Scale feature. **Not implemented** — only the design doc `orgaflow-payments-stripe-connect-architecture.md` exists. Payments are manual entries in the `payments` table. |
| **Password reset email** | The token is created in `verification_tokens` and the URL is built, but it is only written to `console.info` in development. No email is sent, so **password recovery does not work in production** (`src/server/actions/auth.ts`). |
| **Member limits (2 / 5 / 10)** | Shown in pricing and the workspace UI. `team.createInvitation` does not count existing members, so the limit is not enforced. |
| **Storage limits (1 GB / 10 GB)** | Shown in pricing. `/api/upload` enforces a 25 MB per-file cap but checks neither plan nor cumulative quota. |
| **Branding restricted to paid plans** | Marketing says custom branding is Growth and above; organization preferences allow logo and PDF template changes on any plan. |
| **"Advanced reports" as a Scale feature** | The `reports` router has no plan gate; access depends only on `dashboard:view`. |

---

## 14. Local development

```bash
pnpm install
cp .env.example .env      # fill DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL at minimum
pnpm db:migrate           # or pnpm db:push in development
pnpm dev
```

Stripe, Resend, and Vercel Blob variables are only needed to exercise billing, email, and upload flows respectively. Everything else runs without them.

---

## 15. Where to go next

| Topic | Document |
| --- | --- |
| IAM, roles, permissions, menus | [`iam-architecture-technical.md`](./iam-architecture-technical.md) |
| Server layout and domain structure | [`orgaflow-server-architecture.md`](./orgaflow-server-architecture.md) |
| UI layers and shared components | [`orgaflow-ui-architecture.md`](./orgaflow-ui-architecture.md) |
| Estimate → invoice lifecycle | [`estimate-invoice-lifecycle.md`](./estimate-invoice-lifecycle.md) |
| Public client links | [`public-document-links-strategy.md`](./public-document-links-strategy.md) |
| Attachments | [`document-attachments-strategy.md`](./document-attachments-strategy.md) |
| Tasks / Kanban | [`tasks-kanban-module.md`](./tasks-kanban-module.md) |
| Workflow automations | [`workflow-automations-orgaflow.md`](./workflow-automations-orgaflow.md) |
| Pricing and plan limits | [`orgaflow-pricing-strategy.md`](./orgaflow-pricing-strategy.md), [`orgaflow-free-plan-limit-strategy.md`](./orgaflow-free-plan-limit-strategy.md) |
| Planned payments architecture | [`orgaflow-payments-stripe-connect-architecture.md`](./orgaflow-payments-stripe-connect-architecture.md) |
| Marketing copy source of truth | [`orgaflow-copy.md`](./orgaflow-copy.md) |
| Email strategy | [`email-strategy.md`](./email-strategy.md) |

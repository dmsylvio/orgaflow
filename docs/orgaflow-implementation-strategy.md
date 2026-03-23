# Orgaflow - Master Implementation Strategy

## 1. Purpose

This document consolidates the ideas described in the existing `docs/` folder and aligns them with the real state of the repository.

The main objective is to turn Orgaflow into a coherent multi-tenant SaaS for the full client workflow:

```text
Customer -> Estimate -> Client Approval -> Invoice -> Payment -> Task -> Delivery
```

This strategy treats the **current repository** as the starting point while acknowledging a **technology refresh**: the canonical application stack is **Next.js + tRPC + Auth.js + Drizzle + Zod + Radix UI** (Radix Themes + Radix Primitives as needed). Older docs that referenced a separate Fastify `api/` and Vite `app/` are superseded by this document.

---

## 2. Executive Summary

Orgaflow is building toward a solid SaaS foundation on the stack above. Depending on merge state, implemented or in progress areas typically include:

- Auth.js–based authentication integrated with the Next.js app
- organization and membership model (multi-tenant)
- RBAC with roles and permissions (target architecture)
- invitations and billing hooks (Stripe)
- customer management, item catalog, estimates with line items

The repository does **not** yet implement the full product vision described in the documents. The biggest missing parts are:

- invoices
- public estimate and invoice links
- client approval flow
- attachments
- tasks and Kanban board
- workflow automations
- settings architecture
- domain events
- reports, expenses, and activity timeline

The most important conclusion is simple:

> Orgaflow is evolving into a valid SaaS base on the new stack; it is not yet the full quote-to-execution product described in the documentation. **Nothing is “closed”** until shipped and aligned with these docs.

The implementation strategy should therefore focus on **closing the workflow**, not on adding random modules.

---

## 3. Product Vision

### 3.1 Product thesis

Orgaflow should be positioned as a **client workflow management SaaS** for small and medium businesses that operate with:

```text
request -> quote -> approval -> invoice -> payment -> execution
```

This positioning is stronger than "CRM", "invoicing app", or "team dashboard" alone because it connects commercial and operational work in one flow.

### 3.2 Best-fit niches

The current documentation consistently points to businesses that need quote approval plus execution:

- print shops
- custom apparel businesses
- signage companies
- event decorators
- design studios
- creative agencies
- local service businesses
- fabrication and custom product businesses

### 3.3 Core promise

The clearest product promise for launch is:

```text
Send estimates, collect approval, generate invoices, receive payment, and trigger work in one place.
```

---

## 4. Real Repository State

This section reflects the **Next.js monolith** layout (`src/app/`, `src/server/`), not a legacy split `api/` + `app/`.

### 4.1 Server and data layer

Typical locations: `src/server/trpc/`, `src/server/db/`, Auth config at repo root (`auth.ts`, `auth.config.ts`), Zod schemas colocated or under `/schemas` as the project matures.

Implemented or planned server concerns:

- tRPC routers and procedures (typed API)
- Drizzle schemas and migrations
- Auth.js session integration for protected procedures
- domain modules: org, billing, members, customers, items, estimates (evolve with migrations)

Core database entities (extend as features land):

- user, session, account (Auth.js)
- organization, membership, roles/permissions (as modeled)
- subscription / billing linkage
- customer, item, unit, estimate, estimate_item
- country, currency (if present)

### 4.2 Frontend (App Router)

Under `src/app/`: marketing and app routes, layouts, server components by default; client components only where needed.

Target flows:

- public marketing pages
- login/register and recovery (Auth.js)
- protected app shell
- onboarding for organization + plan
- members, invitations, billing surfaces
- items, customers, estimates CRUD
- settings (expand per `settings-module-architecture.md`)

### 4.3 What exists only in docs today

The following concepts appear in the documentation but are not implemented in the current repository:

- invoices domain
- payment collection flow from invoice
- public document token system
- estimate approval/rejection by client
- document attachments
- PDF generation
- tasks and stages
- workflow automations
- domain event bus
- organization settings architecture
- activity timeline
- reports and expenses modules

### 4.4 Alignment rules to preserve

Before public launch, the project should preserve these alignment rules:

1. **Product positioning mismatch**
   Public pages, onboarding, and sales materials should consistently describe Orgaflow as a quote-to-execution SaaS for SMBs.

2. **Pricing mismatch**
   The canonical plan ids are **`starter` | `growth` | `scale`** (display names: Orgaflow Starter, Growth, Scale). Stripe metadata and entitlements must use these ids consistently.

3. **Plan limits mismatch**
   Strategy docs describe limits for invoices, customers, users, items, attachments, and automations. **Starter** uses **total** caps: 50 invoices, 50 estimates, 50 customers, 50 items, 2 users, no attachment storage. **Growth**: 5 users, 1 GB attachments. **Scale**: 10 users, 10 GB attachments. Enforcement in code should centralize in one entitlement service and match this document.

4. **Status naming mismatch**
   The documentation uses `approved`, and the codebase should keep `APPROVED` as the canonical estimate status everywhere.

5. **Environment defaults**
   Align `NEXT_PUBLIC_*` and server env vars with Next.js dev defaults (e.g. port `3000`) and deployment docs.

These alignment rules matter early, because documentation, product messaging, and code must describe the same product.

---

## 5. Strategic Product Direction

### 5.1 Main rule

Do not optimize for maximum feature count.

Optimize for:

- complete workflow
- clear UX
- sales-ready demo
- trust and professionalism
- simple operational logic

### 5.2 What should define the launch scope

The commercial launch scope should allow:

1. create customer
2. create estimate
3. send estimate through public link
4. client approves or rejects
5. convert estimate to invoice
6. client receives payment instructions or pays online
7. internal team sees next action

### 5.3 What should not delay launch

The following should stay out of launch scope unless already nearly finished:

- full project management
- deep CRM pipeline features
- internal chat
- advanced inventory
- complex automation builders
- e-signature workflows
- multi-board operations systems

---

## 6. Target Functional Architecture

### 6.1 Identity, organizations, and IAM

This domain is already the strongest part of the repository and should remain the base for everything else.

Target rules:

- every business workspace is an organization
- all business data is scoped by `organization_id`
- users may belong to multiple organizations
- active organization continues to drive data access
- owner/admin manage billing, settings, team, and sensitive workflow options

Recommended action:

- keep the current IAM foundation
- extend permissions to future modules instead of redesigning auth

### 6.2 Customers

Customers are already implemented and should remain the relationship anchor of the commercial workflow.

Next improvements:

- customer timeline
- linked estimates and invoices list
- optional customer tags or status
- customer-level public history in future versions

### 6.3 Items

Items already exist and should remain reusable for estimates and future invoices.

Next improvements:

- unit management in UI if needed
- better search and filtering
- duplicated item cloning
- price presets by currency in future versions

### 6.4 Estimates

Estimates already exist and are the best current entry point to complete the commercial workflow.

What should be standardized:

- status model
- numbering conventions
- expiration behavior
- notes to client
- total/tax calculation rules

Recommended status model:

```text
DRAFT
SENT
VIEWED
APPROVED
REJECTED
EXPIRED
```

Recommendation:

- keep `APPROVED` as the only canonical status and map any legacy `ACCEPTED` data during normalization

### 6.5 Invoices

Invoices are not implemented yet, but they are mandatory to close the workflow promised by the docs.

Recommended invoice scope:

- invoice entity
- invoice items
- status lifecycle
- link to customer
- optional link to source estimate
- manual and automatic creation from estimate
- PDF export
- public invoice page
- payment instructions

Recommended status model:

```text
DRAFT
PENDING
SENT
VIEWED
PAID
OVERDUE
VOID
```

`PENDING` is a **first-class** state (e.g. invoice generated from an approved estimate or awaiting internal review/send — exact semantics in product copy). It is not a stand-in for “loading”; it participates in lifecycle and can be offered as an automation trigger where relevant.

### 6.6 Payments

The docs describe both payment tracking and future online payments.

Recommended payment approach:

- keep two paths:
  - manual payment registration
  - Stripe payment integration on paid plans

Recommended payment data model:

- invoice id
- amount
- method
- paid_at
- status
- external provider reference

### 6.7 Public document links

This is one of the highest-value missing domains.

Recommended public-link goals:

- secure token-based links
- public estimate page
- public invoice page
- approval/rejection actions
- view tracking
- optional expiration

Required table:

- `public_link` (singular; one row per shareable link resource)

Key rules:

- primary key `id` as **UUIDv7** (stored as `text` or compatible type, consistent with the rest of the schema)
- never expose internal document IDs in public URLs
- use an unguessable `token` (or slug) for the public path
- record `viewed_at`, IP, and user agent where appropriate
- allow revocation in future

### 6.8 Document attachments

Attachments matter because many target niches need design files, contracts, references, and proofs.

Recommended attachment scope:

- estimate attachments
- invoice attachments
- internal vs client-visible files
- secure storage metadata
- protected file access

Required table:

- `document_files`

Storage strategy:

- object storage for binary files
- metadata only in database
- signed or validated temporary file access

### 6.9 Tasks and Kanban

The task module should remain intentionally simple.

Recommended task scope from the docs:

- one board per organization
- default immutable first stage
- custom stages by owner/admin
- single assignee
- move task across stages
- optional relation to customer, estimate, or invoice

Required tables:

- `task_stages`
- `tasks`

Important product constraint:

> Do not let the task module grow into a full project management suite.

### 6.10 Workflow automations

This is the bridge between commercial events and operational execution.

Recommended automation scope:

- **Product rule:** approving an estimate **does not** create a task by default (no implicit `estimate → task` in core flow).
- Automations are **opt-in**, each rule has an **enabled** flag; “no automation” means the rule or module is **inactive**, not missing from the schema.
- Triggers are configured in **Settings**: user selects **document type** (e.g. invoice) and **which status transition or status value** fires the rule (e.g. `invoice` → `PAID` → `create_task`).
- Example rules: `invoice_paid -> create_task`, `invoice_sent -> create_task`, optional future triggers that are not estimate-approval-by-default.

Required table:

- `automation_rules` (include `enabled`, `resource_type`, `trigger_status` or equivalent, `action`, metadata)

Required task metadata:

- source type
- source event
- source id

### 6.11 Settings

The current settings screen is only a placeholder. The docs define a much broader settings architecture.

Recommended settings scopes:

- account
- organization
- team
- tasks
- estimates
- invoices
- documents
- workflow automations
- public links
- billing

Required data model:

- `organization_settings`
- `user_settings`

Do not implement settings as a random set of ad hoc fields spread across unrelated tables.

### 6.12 Domain events

Domain events should be introduced when invoices, public approvals, and automations start landing. Use **one canonical naming scheme** across code, docs, and automations (see `domain-events-architecture.md`).

**Recommended domain events (internal, per organization):**

- Estimates: `estimate_created`, `estimate_sent`, `estimate_viewed`, `estimate_approved`, `estimate_rejected`, `estimate_expired`
- Invoices: `invoice_created`, `invoice_sent`, `invoice_viewed`, `invoice_pending` (if status used), `invoice_paid`, `invoice_overdue`, `invoice_voided`
- Supporting: `payment_recorded` (manual/Stripe), `public_link_created`, `public_link_revoked`, `task_created`, `automation_rule_fired` (optional audit)

First consumers:

- workflow automations (only when rule enabled + trigger matches)
- activity timeline
- notifications in future versions

Recommendation:

- implement a lightweight in-process event dispatcher in the Next.js server context first
- avoid a distributed bus until scale demands it

---

## 7. Suggested Data Model Evolution

### 7.1 Existing schema to preserve

Keep and extend the current multi-tenant base:

- user
- organization
- membership
- RBAC
- subscription
- customer
- item
- estimate

### 7.2 New tables required for the roadmap

Recommended additions:

- `invoice`
- `invoice_item`
- `payment`
- `public_link`
- `document_file`
- `task_stage`
- `task`
- `automation_rule`
- `organization_settings`
- `user_settings`
- `activity_event` or `timeline_event`

### 7.3 Cross-cutting references

Future entities should follow the same consistency rules:

- every business entity must have `org_id`
- created and updated timestamps on every mutable entity
- source relations where a workflow creates downstream records
- no public route should depend on direct internal IDs

### 7.4 Naming recommendations

Standardize:

- `orgId` in code
- `organization_id` in docs when describing database
- status naming in uppercase enums in code
- public labels in friendly language in UI

---

## 8. Backend Implementation Strategy

### 8.1 Keep the current architectural style

The server should follow:

- **Next.js** App Router for UI and route handlers
- **tRPC** for typed internal API (routers, middleware, context)
- **Auth.js** for sessions; pass session/org into tRPC context
- **Zod** for input validation (procedures and forms)
- **Drizzle** for persistence
- **Radix UI** (Radix Themes + primitives) for UI — see `docs/orgaflow-ui-architecture.md`

New domains should be added as tRPC routers + Drizzle schemas, not ad hoc fetch routes unless justified (webhooks, OAuth callbacks).

### 8.2 Recommended backend phases

#### Phase A - Normalize current domain

- align plan names
- align estimate statuses
- align env defaults and docs
- review current permissions catalog
- remove outdated marketing assumptions from technical docs

#### Phase B - Finish estimate workflow

- add send action
- add expiration logic
- add client-facing message fields if needed
- emit estimate-related domain events

#### Phase C - Build invoices

- schema + migration
- CRUD routes
- invoice item routes
- estimate to invoice conversion service
- invoice numbering strategy
- payment state transitions

#### Phase D - Build public document system

- token generation
- public document lookup
- public estimate view/approve/reject
- public invoice view
- tracking fields

#### Phase E - Build attachments

- file metadata tables
- upload and delete routes
- client-visible filtering
- secure download strategy

#### Phase F - Build tasks

- task stages CRUD
- tasks CRUD
- move task endpoint
- default stage creation on organization bootstrap

#### Phase G - Build automation engine

- automation rules CRUD
- event dispatcher
- create-task action executor
- idempotency and duplicate prevention

#### Phase H - Build settings

- organization settings endpoints
- user settings endpoints
- feature toggles by module

### 8.3 Security requirements

All future modules must preserve:

- organization membership validation
- permission checks
- secure token-based public access
- no direct file exposure
- no unscoped data queries

### 8.4 Testing priorities

For every new workflow module, add:

- schema tests
- route authorization tests
- happy path lifecycle tests
- plan limit tests where relevant
- public link security tests

---

## 9. Frontend Implementation Strategy

### 9.1 Reposition the public app

Public pages, pricing, and onboarding copy should consistently reinforce the quote-to-execution positioning.

Public site should instead communicate:

- estimates
- approvals
- invoices
- payments
- tasks
- workflow

### 9.2 Admin-side priorities

Highest-priority dashboard experiences:

1. estimate details with actions
2. estimate to invoice conversion
3. invoice details and payment state
4. task board
5. settings navigation

### 9.3 Public-side priorities

Build public pages as first-class experiences:

- public estimate page
- rejection reason flow
- public invoice page
- PDF download entry points
- attachment visibility section

### 9.4 UX rules

The docs point to a pragmatic SMB product. The UI should therefore optimize for:

- obvious next step
- visible status labels
- low-friction forms
- trust signals on public pages
- business branding

### 9.5 Recommended frontend phases

#### Frontend phase 1

- fix landing page message
- improve pricing page message
- align plan naming with final commercial model

#### Frontend phase 2

- estimate detail page with send/public-link actions
- status chips and lifecycle UX

#### Frontend phase 3

- invoice pages
- public document pages
- approval/rejection flow

#### Frontend phase 4

- task board
- automation settings UI
- document settings UI

#### Frontend phase 5

- branding settings
- public links settings
- billing alignment with final plan strategy

---

## 10. Pricing and Packaging Strategy

The docs define a strong commercial strategy around three plans and decoy pricing.

### 10.1 Strategic recommendation

Before public launch, keep **one canonical pricing model** and apply it everywhere:

- Orgaflow Starter
- Orgaflow Growth
- Orgaflow Scale

Recommendation:

- `Orgaflow Scale` is the final paid plan for workflow + payments + operations
- AI can exist as a feature set inside plans or add-ons, not as the canonical top-tier plan name

### 10.2 Recommended packaging direction

Based on the docs, the cleaner product story is:

- `Orgaflow Starter`: limited usage, manual workflows
- `Orgaflow Growth`: unlimited core operations, branding, attachments, public invoice links
- `Orgaflow Scale`: online payments, workflow automations, advanced operations

### 10.3 Plan-limit implementation strategy

Enforcement should match **Starter** totals (50/50/50/50/2 users, no attachments), **Growth** (5 users, 1 GB attachments), and **Scale** (10 users, 10 GB attachments) rules from pricing docs.

Future enforcement should cover:

- customers
- estimates
- invoices
- members
- items
- storage
- automation rules
- maybe public link retention later

Recommendation:

- centralize all plan checks in one service
- avoid scattering plan-limit logic across route files

---

## 11. Commercial Readiness Strategy

### 11.1 Best demo flow

The repository should evolve toward a demo that can be shown in under 10 minutes:

1. create organization
2. create customer
3. create estimate
4. open public estimate link
5. approve estimate
6. convert estimate to invoice
7. show payment or payment instructions
8. show task board or next action (tasks optional; automations only if Scale + rule enabled)

### 11.2 Onboarding strategy

After billing onboarding, the next product onboarding should guide users through:

1. branding
2. first customer
3. first item
4. first estimate
5. public sharing

### 11.3 Landing page strategy

The homepage should shift from startup-ops language to direct business value language.

Recommended message pillars:

- quote faster
- approve online
- invoice with less friction
- start work automatically

---

## 12. 30-Day Practical Roadmap

This roadmap follows the documents while respecting the current codebase.

### Week 1 - Alignment and foundation

- unify positioning and terminology
- define canonical pricing names
- align environment docs
- normalize estimate statuses
- define invoice schema and lifecycle

### Week 2 - Commercial workflow completion

- implement invoices
- implement estimate -> invoice conversion
- add payment instructions
- add better estimate detail actions

### Week 3 - Public experience

- implement public token links
- implement estimate approval/rejection
- implement public invoice display
- add view tracking

### Week 4 - Operational bridge

- implement simple task board
- implement automation engine with **per-rule enabled**, **status-based triggers** (no default estimate→task)
- implement branding and basic settings
- polish landing page and demo flow

---

## 13. Definition of Done by Domain

### Estimates are done when

- statuses are consistent
- they can be shared publicly
- client can approve or reject
- conversion to invoice is available

### Invoices are done when

- they can be created from estimate
- they have a clear status lifecycle
- they support public view
- they support PDF and payment instructions

### Tasks are done when

- each org has one board
- stages are manageable
- tasks can be created manually and by automation

### Automations are done when

- rules can be configured by owner/admin with **enabled/disabled** and **document + status** trigger selection
- domain events trigger actions only for **active** rules
- generated tasks keep source metadata (no automatic task from estimate approval unless product policy changes)

---

## 14. Risks and Mitigations

### Risk 1 - Product drift

If marketing, pricing, and code keep different narratives, Orgaflow will look inconsistent.

Mitigation:

- align naming first
- keep this document as the reference source

### Risk 2 - Scope explosion

Tasks and automations can easily become much bigger than needed for the initial rollout.

Mitigation:

- keep the initial automation scope extremely narrow
- avoid multi-board, comments, subtasks, and complex condition builders

### Risk 3 - Security issues on public documents

Public links and attachments can expose sensitive data if implemented loosely.

Mitigation:

- token-based access only
- signed or validated file delivery
- no raw internal IDs in public URLs

### Risk 4 - Billing complexity before workflow completion

Too much effort in billing polish before the client workflow is complete can delay product-market validation.

Mitigation:

- billing should support the commercial model
- workflow completion should remain the main product priority

---

## 15. Recommended Immediate Actions

Order of execution:

1. align product positioning, plan naming, and estimate status naming
2. implement invoices and estimate-to-invoice conversion
3. implement public estimate approval flow
4. implement public invoice page and payment instructions
5. implement tasks and simple automations
6. implement attachments and full settings architecture

---

## 16. Final Conclusion

Orgaflow is consolidating the technical base of a serious SaaS on **Next.js + tRPC + Auth.js + Drizzle**:

- multi-tenant model
- authentication
- IAM (target)
- onboarding
- billing
- estimate foundation

What is missing is the completion of the workflow promised by the documentation, implemented on this stack.

The correct implementation strategy is therefore:

```text
align docs, plan ids, and entitlements
-> complete the commercial workflow (estimates → invoices → payments)
-> public links + approvals
-> tasks + opt-in status-based automations (Scale)
-> polish positioning and onboarding
```

If executed in this order, Orgaflow can evolve into a clear, sellable client workflow platform.

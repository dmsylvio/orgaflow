# Orgaflow — `src/server` Architecture, IAM, Features, and Conventions

## Purpose

This document consolidates the architecture discussed for the Orgaflow backend, covering:

- `src/server` structure
- `db` and `schemas` conventions
- tRPC layer
- IAM
- Settings
- Features
- domain organization
- Kanban
- Payments
- limits and usage
- implementation logic

The proposal is designed to keep the project scalable, predictable, and easy to maintain.

---

# 1. Main rule: organization by domain

The central rule of the project is:

> Every meaningful capability lives in its own domain inside `src/server`.

That means the backend should not grow around generic folders such as:

- `settings/` as a catch-all
- `features/` as a feature dump
- global `services/` mixing everything

Instead, each business rule belongs in the right domain.

## Examples

- Kanban → `src/server/kanban`
- Payments → `src/server/payments`
- Customers → `src/server/customers`
- Estimates → `src/server/estimates`
- IAM → `src/server/iam`
- Account → `src/server/account`

---

# 2. Final `src/server` structure

The consolidated structure is:

```txt
src/server/
├─ db/
│  ├─ index.ts
│  └─ schemas/
│     ├─ index.ts
│     ├─ users.ts
│     ├─ accounts.ts
│     ├─ organizations.ts
│     ├─ organization-members.ts
│     ├─ roles.ts
│     ├─ role-permissions.ts
│     ├─ organization-features.ts
│     ├─ customers.ts
│     ├─ items.ts
│     ├─ estimates.ts
│     ├─ estimate-items.ts
│     ├─ invoices.ts
│     ├─ invoice-items.ts
│     ├─ kanban-categories.ts
│     ├─ kanban-triggers.ts
│     ├─ payment-settings.ts
│     ├─ stripe-settings.ts
│     ├─ notification-settings.ts
│     ├─ tax-types.ts
│     ├─ payment-modes.ts
│     ├─ notes.ts
│     └─ expense-categories.ts
│
├─ trpc/
│  ├─ init.ts
│  ├─ root.ts
│  └─ routers/
│     ├─ account.ts
│     ├─ organization.ts
│     ├─ role.ts
│     ├─ customer.ts
│     ├─ item.ts
│     ├─ estimate.ts
│     ├─ invoice.ts
│     ├─ kanban.ts
│     ├─ payments.ts
│     ├─ notification.ts
│     ├─ tax-type.ts
│     ├─ payment-mode.ts
│     ├─ note.ts
│     └─ expense-category.ts
│
├─ iam/
│  ├─ permissions.ts
│  ├─ permission-groups.ts
│  ├─ permission-utils.ts
│  ├─ ability.ts
│  ├─ menu.ts
│  ├─ filter-menu.ts
│  ├─ role-utils.ts
│  ├─ owner-policy.ts
│  └─ index.ts
│
├─ account/
│  ├─ account.schema.ts
│  ├─ account.service.ts
│  └─ account.repository.ts
│
├─ organizations/
│  ├─ organization.schema.ts
│  ├─ organization.service.ts
│  ├─ organization.repository.ts
│  ├─ organization-feature.schema.ts
│  ├─ organization-feature.service.ts
│  ├─ organization-feature.repository.ts
│  └─ organization-feature.utils.ts
│
├─ customers/
│  ├─ customer.schema.ts
│  ├─ customer.service.ts
│  └─ customer.repository.ts
│
├─ items/
│  ├─ item.schema.ts
│  ├─ item.service.ts
│  └─ item.repository.ts
│
├─ estimates/
│  ├─ estimate.schema.ts
│  ├─ estimate.service.ts
│  ├─ estimate-pricing.ts
│  └─ estimate.repository.ts
│
├─ invoices/
│  ├─ invoice.schema.ts
│  ├─ invoice.service.ts
│  └─ invoice.repository.ts
│
├─ kanban/
│  ├─ kanban.schema.ts
│  ├─ kanban-category.schema.ts
│  ├─ kanban-trigger.schema.ts
│  ├─ kanban.service.ts
│  ├─ kanban.repository.ts
│  ├─ kanban-bootstrap.ts
│  └─ kanban-readiness.ts
│
├─ payments/
│  ├─ payments.schema.ts
│  ├─ stripe-settings.schema.ts
│  ├─ payments.service.ts
│  ├─ payments.repository.ts
│  └─ payments-readiness.ts
│
├─ notifications/
│  ├─ notification.schema.ts
│  ├─ notification.service.ts
│  └─ notification.repository.ts
│
├─ tax-types/
│  ├─ tax-type.schema.ts
│  ├─ tax-type.service.ts
│  └─ tax-type.repository.ts
│
├─ payment-modes/
│  ├─ payment-mode.schema.ts
│  ├─ payment-mode.service.ts
│  └─ payment-mode.repository.ts
│
├─ notes/
│  ├─ note.schema.ts
│  ├─ note.service.ts
│  └─ note.repository.ts
│
├─ expense-categories/
│  ├─ expense-category.schema.ts
│  ├─ expense-category.service.ts
│  └─ expense-category.repository.ts
│
├─ storage/
│  ├─ storage.service.ts
│  ├─ storage.repository.ts
│  ├─ storage-limits.ts
│  └─ storage-usage.ts
│
└─ shared/
   ├─ constants/
   ├─ guards/
   ├─ types/
   └─ utils/
```

---

# 3. `db` convention

## 3.1 Current structure

The agreed pattern for the database is:

```txt
src/server/db/
├─ index.ts
└─ schemas/
   ├─ index.ts
   ├─ users.ts
   ├─ organizations.ts
   ├─ customers.ts
   └─ ...
```

## 3.2 Convention

### `src/server/db/index.ts`
Responsible for exporting only `db`.

### `src/server/db/schemas/index.ts`
Responsible for exporting all schemas.

## 3.3 There is no `relations.ts`

In the current project pattern there is no `relations.ts`, and that is fine.

The project can keep working with:

- schemas
- explicit joins
- manual queries with Drizzle

There is no need to introduce `relations(...)` just for formality.

---

# 4. Official import convention

The official import convention is:

## Database
```ts
import { db } from "@/server/db"
```

## Schemas
```ts
import { users, organizations, customers } from "@/server/db/schemas"
```

## Rationale
This pattern makes it explicit:

- `db` = infrastructure / connection
- `schemas` = table structure

That keeps reading clear and avoids turning `db/index.ts` into an oversized export.

---

# 5. Role of each layer

## 5.1 `db/`
Responsible for:
- Drizzle instance
- tables/schemas
- structural persistence

## 5.2 `trpc/`
Responsible for:
- transport
- context
- init
- root router
- procedure layer
- domain routers

## 5.3 `iam/`
Responsible for:
- owner
- roles
- permissions
- dependencies
- ability
- menu filtering

## 5.4 `<domain>/`
Responsible for:
- business rules
- domain Zod schemas
- services
- repositories

---

# 6. Layered architecture rule

The main rule is:

## Router
Thin layer

## Service
Business rules

## Repository
Database access

---

# 7. Example flow

## Example: creating a customer

### `src/server/trpc/routers/customer.ts`
- receives input
- calls `customer.service.ts`

### `src/server/customers/customer.service.ts`
- checks permissions
- applies business rules
- calls repository

### `src/server/customers/customer.repository.ts`
- uses `db`
- uses schemas
- runs queries

That is the correct separation.

---

# 8. IAM

## 8.1 What IAM is in this project

IAM is the layer responsible for defining:

- owner
- custom roles
- permissions
- dependencies between permissions
- menu based on ability

## 8.2 Main rules

### Owner
If `organization_members.is_owner = true`:

- can do everything within the organization
- skips normal permission checks
- can access all organizational settings
- can enable and configure features
- can manage roles
- can manage billing

### Non-owner
If `is_owner = false`:

- depends on the role
- depends on permissions assigned to the role
- cannot access owner-only pages
- cannot receive owner-only permissions

### Self
Every authenticated user can access:

- `Settings > Account`

That is the only self area in the system.

---

## 8.3 `iam/` structure

```txt
src/server/iam/
├─ permissions.ts
├─ permission-groups.ts
├─ permission-utils.ts
├─ ability.ts
├─ menu.ts
├─ filter-menu.ts
├─ role-utils.ts
├─ owner-policy.ts
└─ index.ts
```

---

## 8.4 Initial assignable permissions

### Dashboard
- `dashboard:view`

### Customers
- `customer:view`
- `customer:create`
- `customer:edit`
- `customer:delete`

### Items
- `item:view`
- `item:create`
- `item:edit`
- `item:delete`

### Estimates
- `estimate:view`
- `estimate:create`
- `estimate:edit`
- `estimate:delete`

### Invoices
- `invoice:view`
- `invoice:create`
- `invoice:edit`
- `invoice:delete`

### Tasks / Kanban
- `task:view`
- `task:create`
- `task:edit`
- `task:delete`

---

## 8.5 Dependencies

A permission may depend on others.

### Example
`invoice:create` depends on:

- `invoice:view`
- `customer:view`
- `item:view`

### Rule
When saving a role, the system must expand dependencies automatically.

### Example
Chosen input:
```txt
invoice:create
```

Saved output:
```txt
invoice:create
invoice:view
customer:view
item:view
```

---

## 8.6 Ability

Ability represents the user’s effective access.

### Suggested type

```ts
type AbilityContext = {
  isOwner: boolean;
  permissions: PermissionKey[];
  isAuthenticated?: boolean;
};
```

### Rules
- owner can always do everything
- non-owner depends on the `permissions` array
- self depends only on authentication

---

# 9. Settings

## 9.1 Final Settings rule

Settings was defined as follows:

### Self
The only self area in the system:
- `Settings > Account`

### Owner-only
Everything else in Settings is owner-only:

- Company
- Preferences
- Customization
- Roles
- Notifications
- Tax Types
- Payment Modes
- Notes
- Expense Categories
- Payments
- Features
- Kanban
- Billing

---

## 9.2 Rationale

This decision reduces:
- RBAC complexity
- special permissions
- ambiguity

And guarantees a fallback for any authenticated user.

---

## 9.3 Settings menu structure

```txt
Settings
├─ Account              -> auth only
├─ Company              -> owner only
├─ Preferences          -> owner only
├─ Customization        -> owner only
├─ Roles                -> owner only
├─ Notifications        -> owner only
├─ Tax Types            -> owner only
├─ Payment Modes        -> owner only
├─ Notes                -> owner only
├─ Expense Categories   -> owner only
├─ Payments             -> owner only
├─ Features             -> owner only
├─ Kanban               -> owner only
└─ Billing              -> owner only
```

---

# 10. Features

## 10.1 What a feature is

A feature is an organizational capability.

Examples:
- Kanban
- Payments
- Estimate attachments
- Invoice attachments

A feature is not a permission.
A feature is not a menu item.
A feature is a tenant capability.

---

## 10.2 Feature rules

Each feature can have these states:

### available
Does the plan allow use?

### enabled
Did the organization turn it on?

### configured
Is the feature correctly configured?

### ready
Can it be used now?

### Formula
```txt
ready = available && enabled && configured
```

For simple features, `configured` can always be `true`.

---

## 10.3 Not every feature affects the menu

### Kanban
- affects the menu

### Payments
- does not affect the main menu

That distinction matters.

---

# 11. Rule across IAM, features, and limits

Every capability should be thought through as:

1. is the feature available on the plan?
2. is the feature enabled for the organization?
3. is the feature ready/configured?
4. does the user have permission?
5. do limits/usage allow the action?

### Mental formula

```txt
can use =
feature available
+ feature enabled
+ feature ready
+ permission
+ quota available
```

---

# 12. Kanban

## 12.1 What Kanban is

Kanban is an organization feature.

### Defined rules
- can be turned on/off
- affects the main menu
- has its own configuration
- each organization defines its own task logic
- on first activation, a default category is created

---

## 12.2 Default category

The initial Kanban category must follow:

- initial name: `To Do`
- cannot be removed
- can be renamed
- each organization can create other categories

### Suggested semantics
- `is_default = true`
- `is_system = true`

### Rule
If `is_system = true`, it cannot be deleted.
The name can still be changed.

---

## 12.3 Kanban triggers

The organization defines how cards enter Kanban.

### Rules
A trigger can come from:
- estimate
- invoice

The accepted status values are defined by the organization (per trigger configuration).

### Examples
- estimate:accepted
- estimate:sent
- invoice:draft
- invoice:paid

The system should not hardcode fixed triggers.

---

## 12.4 Kanban and menu

The “Kanban” item appears only if:

1. the `kanban` feature is `ready`
2. the user has permission, for example:
   - `task:view`

### Rule
Kanban depends on:
- feature
- IAM

---

## 12.5 Kanban domain structure

```txt
src/server/kanban/
├─ kanban.schema.ts
├─ kanban-category.schema.ts
├─ kanban-trigger.schema.ts
├─ kanban.service.ts
├─ kanban.repository.ts
├─ kanban-bootstrap.ts
└─ kanban-readiness.ts
```

### Responsibilities
- Zod schemas
- category CRUD
- trigger CRUD
- default category bootstrap
- validation for non-removable column
- module readiness

---

## 12.6 Suggested tables

### `kanban_categories`
```txt
id
organization_id
name
position
color
is_default
is_system
created_at
updated_at
```

### `kanban_triggers`
```txt
id
organization_id
source_type
source_status
is_enabled
created_at
updated_at
```

### `organization_features`
Stores the feature toggle.

---

## 12.7 Kanban activation flow

When the owner enables Kanban for the first time:

1. verify the plan allows it
2. enable the feature
3. check whether a default category already exists
4. if not, create:
   - `To Do`
   - `is_default = true`
   - `is_system = true`
5. allow later configuration of:
   - name
   - new columns
   - triggers

---

# 13. Payments

## 13.1 What Payments is

Payments is an organization feature.

### Defined rules
- can be turned on/off
- does not affect the main menu
- lives under Settings
- can have providers such as Stripe
- may require configuration before it is ready

---

## 13.2 Payments does not go in the main menu

Even when active, Payments:
- does not create an item in the app’s main menu

It appears only under Settings.

---

## 13.3 Payments = feature + configuration

### Feature
- `payments`

### Configuration
- enabled methods
- active provider
- Stripe keys
- payment instructions
- operational rules

---

## 13.4 Stripe in the Payments domain

Stripe does not need to be a separate feature for now.
It can be treated as configuration inside the Payments domain.

Example:
- `payments` feature on
- the org configures Stripe within it

---

## 13.5 Payments domain structure

```txt
src/server/payments/
├─ payments.schema.ts
├─ stripe-settings.schema.ts
├─ payments.service.ts
├─ payments.repository.ts
└─ payments-readiness.ts
```

### Responsibilities
- operational toggle
- provider configuration
- readiness validation
- payment rules

---

## 13.6 Suggested tables

### `organization_payment_settings`
```txt
id
organization_id
default_payment_method
instructions
created_at
updated_at
```

### `organization_stripe_settings`
```txt
id
organization_id
is_enabled
publishable_key
secret_key_encrypted
webhook_secret_encrypted
created_at
updated_at
```

### `organization_features`
Keeps the feature toggle.

---

## 13.7 Payments readiness

The `payments` feature should be ready only if:

1. it is available on the plan
2. it is enabled for the organization
3. minimum configuration is valid

### Minimal example for Stripe
- publishable key set
- secret key set
- webhook secret set, if required

---

# 14. Organizing features by domain

The agreed rule was:

> Anything that is specific configuration and behavior belongs in the domain.

## What that means

### What can stay central
Only the basics:
- light catalog of feature keys
- generic state per organization
- plan availability, if applicable

### What stays in the domain
- config
- readiness
- bootstrap
- internal rules

---

## Example

### `organizations`
May know:
- is feature `kanban` enabled?
- is feature `payments` enabled?

### `kanban`
Knows:
- whether the default column exists
- whether triggers are valid
- whether the module is ready

### `payments`
Knows:
- whether Stripe is configured
- whether the feature is ready
- whether it can be used inside invoices

---

# 15. Menu and features

## 15.1 Menu rules

The menu must consider:

- authentication
- owner
- permission
- feature

### Suggested type

```ts
type AppMenuItem = {
  key: string;
  label: string;
  href: string;
  icon?: string;
  authOnly?: boolean;
  ownerOnly?: boolean;
  permissions?: PermissionKey[];
  feature?: FeatureKey;
  children?: AppMenuItem[];
};
```

---

## 15.2 Examples

### Kanban
- `feature = "kanban"`
- `permissions = ["task:view"]`

### Payments
- does not enter the main menu
- appears only under owner-only Settings

---

# 16. Limits and usage

## 16.1 Limit types

Examples:
- total storage
- maximum users
- maximum customers
- upload count
- maximum file size

---

## 16.2 Starter plan example

Conceptual example:
- 100 MB storage

### Technical recommendation
Store internally in bytes.

Example:
```txt
104857600 bytes
```

The UI can convert to MB/GB.

---

## 16.3 Rule for uploads

To allow uploads on estimates/invoices:

1. the feature must be ready
2. permission must allow the action
3. storage limit must not be exceeded
4. the file must pass type/size validation

---

# 17. Generic features table

## Suggestion

### `organization_features`
```txt
id
organization_id
feature_key
enabled
created_at
updated_at
```

### Responsibility
- store toggles per organization

### Note
Plan availability does not need to live in this table.
It can be handled in a separate service.

---

# 18. Implementation by domain

The final rule was:

> Each domain implements its own configuration, validation, and readiness.

## Example

### Kanban
Knows how to:
- validate triggers
- validate categories
- ensure `To Do` exists
- decide if it is ready

### Payments
Knows how to:
- validate Stripe
- decide if it is ready
- determine the active provider

---

# 19. Implementation conventions

## 19.1 Do not scatter `if plan === ...`
Instead, centralize in:
- feature availability
- readiness
- limit checks

## 19.2 Do not mix IAM with feature config
IAM decides access.
Feature decides capability.
Config decides behavior.

## 19.3 Do not use the menu as security
Menu is UX.
Real security lives in the backend.

## 19.4 Bootstrap always in the domain
Example:
The Kanban `To Do` column should be born in `kanban-bootstrap.ts`, not in a generic util.

## 19.5 Owner-only Settings are not turned into common permissions for now
Project policy is already defined:
- `Account` = self
- rest of Settings = owner-only

---

# 20. Suggested implementation order

## Phase 1
- finish `src/server/iam`
- finish menu
- finish sidebar by ability

## Phase 2
- implement Kanban
- schemas
- tables
- default column bootstrap
- triggers
- menu conditioned on feature

## Phase 3
- implement Payments
- settings
- Stripe config
- readiness

## Phase 4
- implement storage/usage
- plan limits
- upload guards

---

# 21. Executive summary

## Architecture
- everything lives under `src/server`
- backend organized by domain
- `trpc` = transport
- `iam` = authorization
- `<domain>` = business rules
- `db` = persistence
- `schemas` = tables

## Import convention
```ts
import { db } from "@/server/db"
import { users, organizations, customers } from "@/server/db/schemas"
```

## IAM
- owner is sovereign
- roles for operational modules
- permissions with dependencies
- `Settings > Account` is the only self area

## Settings
- Account = auth only
- everything else = owner-only

## Kanban
- feature
- affects menu
- owner configures
- creates non-removable default `To Do`
- triggers by estimate/invoice with org-configured status values

## Payments
- feature
- does not affect main menu
- lives in Settings
- uses domain-level configuration
- can use Stripe as provider

## Storage / limits
- controlled by quotas
- evaluate in bytes
- used for uploads and plan growth

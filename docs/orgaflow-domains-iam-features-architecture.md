# Orgaflow — Domains, IAM, and Features Architecture

## Purpose

This document defines the conceptual and technical architecture for:

- organizing the project by domain
- system IAM
- settings
- enableable/disableable features
- quotas and limits
- integration between menu, permissions, features, and configuration
- implementation rules for modules such as Kanban and Payments

The goal is to keep the system scalable without mixing business rules into generic files or scattering conditionals across the project.

---

# 1. Core principle: organization by domain

The base rule of the project is:

> Every meaningful capability lives in its own domain.

That means we will not concentrate everything in a single place such as:

- `src/server/settings/*`
- `src/server/features/*`
- `src/server/utils/*`

when the business rule clearly belongs to a specific domain.

## Correct example

- Kanban lives in `src/server/kanban`
- Payments lives in `src/server/payments`
- Customers lives in `src/server/customers`
- Estimates lives in `src/server/estimates`
- IAM lives in `src/server/iam`

## Benefits

- avoids inappropriate coupling
- eases maintenance
- eases testing
- reduces oversized files
- makes it clear where each rule lives
- simplifies onboarding for new developers

---

# 2. Separation of system axes

Orgaflow will have four distinct axes.

## 2.1 IAM
IAM answers:

> Who is allowed to perform an action?

Examples:
- `customer:view`
- `customer:create`
- `estimate:edit`
- `invoice:delete`

IAM covers:
- owner
- roles
- permissions
- dependencies
- menu by permission

## 2.2 Features
Features answer:

> Does this organization have access to this capability?

Examples:
- Kanban
- Payments
- Estimate attachments
- Invoice attachments

A feature does not answer whether the user has permission.
A feature is not the menu either.
A feature is a tenant capability.

## 2.3 Feature configuration
Configuration answers:

> How does this feature work for the organization?

Examples:
- Kanban:
  - categories
  - trigger by estimate/invoice
  - accepted statuses
- Payments:
  - Stripe keys
  - enabled methods
  - payment rules

## 2.4 Limits / usage
Usage answers:

> How much can the organization consume?

Examples:
- 100 MB on the free plan
- maximum number of users
- maximum number of customers
- upload volume

---

# 3. Central implementation rule

Every system capability should be thought through in this order:

1. does the organization have the feature available?
2. did the organization enable the feature?
3. is the feature configured correctly?
4. does the user have permission to use it?
5. does the limit/usage allow execution?

## Mental formula

```txt
can use =
feature available
+ feature enabled
+ feature ready/configured
+ user permission
+ quota available
```

Not every feature uses all five steps, but this is the general model.

---

# 4. Folder structure by domain

## Recommended structure

```txt
src/
├─ app/
├─ components/
├─ features/                    # UI by domain
├─ server/
│  ├─ db/
│  ├─ trpc/
│  ├─ iam/
│  ├─ account/
│  ├─ organizations/
│  ├─ customers/
│  ├─ items/
│  ├─ estimates/
│  ├─ invoices/
│  ├─ kanban/
│  ├─ payments/
│  ├─ notifications/
│  ├─ tax-types/
│  ├─ payment-modes/
│  ├─ notes/
│  ├─ expense-categories/
│  ├─ storage/
│  └─ shared/
└─ trpc/
```

---

# 5. IAM

## 5.1 What IAM is in Orgaflow

IAM is the layer that defines:

- owner
- custom roles
- permissions
- dependencies between permissions
- menu visibility based on ability

## 5.2 Main rules

### Owner
If `organization_members.is_owner = true`:

- can access everything in the organization
- skips normal permission checks
- can manage roles
- can access all organization settings
- can enable/disable features
- can configure features

### Non-owner
If not owner:

- depends on the assigned role
- receives permissions defined by the owner
- cannot access owner-only pages
- does not receive owner-only permissions

### Self
Every authenticated user may access only:

- `Settings > Account`

That is the only self area in the system.

---

## 5.3 IAM domain structure

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

## 5.4 Assignable permissions

Initial examples:

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

### Tasks / Kanban (future)
- `task:view`
- `task:create`
- `task:edit`
- `task:delete`

---

## 5.5 Dependencies

Permissions may depend on others.

### Example
`invoice:create` depends on:

- `invoice:view`
- `customer:view`
- `item:view`

So when saving a role, the system should expand dependencies automatically.

### Example
If the owner selects:

```txt
invoice:create
```

the system stores:

```txt
invoice:create
invoice:view
customer:view
item:view
```

---

## 5.6 Ability

Ability is the object that represents the user’s effective access.

### Structure

```ts
type AbilityContext = {
  isOwner: boolean;
  permissions: PermissionKey[];
  isAuthenticated?: boolean;
};
```

### Rules
- owner can always do everything
- non-owner can only do what is in `permissions`
- self does not go through role; it depends on authentication

---

## 5.7 Menu and IAM

Each menu item may depend on:

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

# 6. Settings

## 6.1 Final rule for Settings

Settings is defined as follows:

### Self
The only self option in the system is:

- `Settings > Account`

### Owner-only
Everything else is owner-only:

- Company
- Preferences
- Customization
- Roles
- Notifications
- Tax Types
- Payment Modes
- Notes
- Expense Categories
- Billing
- Features
- Payments
- Kanban Settings

---

## 6.2 Rationale for this decision

This decision yields:

- less complexity in RBAC
- fewer special permissions
- less sensitive UI exposed to non-owners
- a guaranteed fallback for users without operational permissions

---

## 6.3 Settings menu structure

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

# 7. Features

## 7.1 What a feature is

A feature is an organization capability.

Examples:
- Kanban
- Payments
- Estimate Attachments
- Invoice Attachments

A feature is not a permission.
A feature is not the menu either.
A feature is a tenant capability.

---

## 7.2 Important rules

### Not every feature appears in the menu
Example:
- Kanban affects the menu
- Payments does not affect the menu

### Not every feature is used directly by the user
Example:
- Payments may exist only as configuration and internal system behavior

### Feature and configuration are different things
Example:
- `payments` is the feature
- Stripe keys are part of the feature’s configuration

---

## 7.3 Conceptual data shape

Each feature needs at least these concepts:

### available
Does the plan allow it?

### enabled
Did the organization turn it on?

### configured
Is the feature set up correctly?

### ready
Can it be used now?

### Formula
```txt
ready = available && enabled && configured
```

For simple features, `configured` may always be `true`.

---

## 7.4 Feature metadata

Suggested type:

```ts
type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  description?: string;
  ownerToggleable: boolean;
  affectsMenu: boolean;
  requiresConfiguration: boolean;
};
```

---

# 8. Kanban

## 8.1 What Kanban is in the system

Kanban is a tenant feature.

### Defined rules
- can be enabled/disabled
- affects the app’s main menu
- has its own configuration
- each organization defines its own logic
- on first enable, a default category is created

---

## 8.2 Kanban default category

The default category must satisfy:

- initial name: `To Do`
- cannot be removed
- can be renamed
- each organization may create additional categories later

### Recommended semantics
The initial column should have something like:

- `is_default = true`
- `is_system = true`

### Business rule
- if `is_system = true`, it cannot be deleted
- the name may still be changed

---

## 8.3 Kanban triggers

The organization defines how cards enter Kanban.

### Defined rules
Triggers may come from:

- estimate
- invoice

The accepted status is also defined by the organization.

### Examples
- estimate:accepted
- estimate:sent
- invoice:draft
- invoice:paid

The system should not hard-code fixed triggers.
The org configures them.

---

## 8.4 How Kanban affects the menu

The “Kanban” item appears only if:

1. the `kanban` feature is ready
2. the user has the right permission, for example:
   - `task:view`

### Rule
Kanban depends on:
- feature
- IAM

---

## 8.5 Recommended Kanban domain structure

```txt
src/server/kanban/
├─ kanban.types.ts
├─ kanban.schema.ts
├─ kanban-category.schema.ts
├─ kanban-trigger.schema.ts
├─ kanban.service.ts
├─ kanban.router.ts
├─ kanban-menu.ts
└─ index.ts
```

### Responsibilities
- Zod schemas
- rules for creating the default category
- validation for non-removable column
- category CRUD
- trigger CRUD
- initial module activation

---

## 8.6 Suggested tables

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
The toggle itself can live in a generic features table.

---

## 8.7 Kanban activation flow

When the owner enables Kanban for the first time:

1. verify the plan allows it
2. enable the feature
3. check whether the org already has a default category
4. if not, create:
   - `To Do`
   - `is_default = true`
   - `is_system = true`
5. allow later configuration of:
   - name
   - new columns
   - triggers

---

# 9. Payments

## 9.1 What Payments is in the system

Payments is an organization feature.

### Defined rules
- can be enabled/disabled
- does not affect the main menu
- lives in settings
- may include providers such as Stripe
- may require configuration before it is ready

---

## 9.2 Payments does not go in the main menu

This is an important rule.

Even with the feature active:
- it does not create an item in the app’s main menu

It appears only under Settings.

---

## 9.3 Payments as feature + configuration

The separation must be very clear here.

### Feature
- `payments`

### Configuration
- enabled methods
- active provider
- Stripe keys
- payment instructions
- default currency, if needed
- operational rules

---

## 9.4 Stripe as Payments configuration

Stripe does not need to be a separate feature for now.
It can be treated as part of the Payments domain configuration.

### Example
The `payments` feature is on, and inside it the organization configures:
- Stripe
- manual payment methods
- other payment methods in the future

---

## 9.5 Recommended Payments domain structure

```txt
src/server/payments/
├─ payments.types.ts
├─ payments.schema.ts
├─ stripe-settings.schema.ts
├─ payments.service.ts
├─ payments.router.ts
├─ payments-readiness.ts
└─ index.ts
```

### Responsibilities
- turn feature behavior on/off
- validate provider configuration
- store secrets/keys
- resolve whether the payment system is ready

---

## 9.6 Suggested tables

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
Feature state can remain generic.

---

## 9.7 Payments readiness

The `payments` feature should be considered ready only if:

1. it is available on the plan
2. it is enabled for the organization
3. minimum configuration is valid

### Minimum example for Stripe
- publishable key set
- secret key set
- webhook secret set, if required

---

# 10. Menu and features

## 10.1 Menu rule

The menu must account for:

- auth
- owner
- permissions
- feature

### Practical example
An item appears only if:

- the item’s rules allow it
- and the required feature is ready, if the item depends on a feature

---

## 10.2 Examples

### Kanban
- `feature = "kanban"`
- `permissions = ["task:view"]`

### Payments
- does not enter the main menu
- appears only under owner-only Settings

---

# 11. Limits and usage

## 11.1 What counts as a limit

Examples:
- total storage
- maximum number of users
- maximum number of customers
- upload count
- maximum file size

---

## 11.2 Free plan example

Conceptual example:

- total storage: 100 MB

### Technical recommendation
Store internally in bytes.

Example:
```txt
104857600 bytes
```

The UI may convert to MB/GB.

---

## 11.3 Rule for uploads

To allow uploads on estimates/invoices:

1. the feature must be ready
2. permission must allow the action
3. storage must not exceed the limit
4. file size/type must pass validation

---

# 12. Generic features table

## 12.1 Suggestion

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
- store per-organization toggles

### Note
Plan availability does not need to live in this table.
It can come from resolving the current plan.

---

# 13. Final feature state resolution

## 13.1 Recommended service

Suggested file:

```txt
src/server/shared/features/get-organization-feature-state.ts
```

or, if you prefer each domain fully separate, a small central service at:

```txt
src/server/organizations/organization-features.service.ts
```

### Responsibility
Resolve the final state of a feature:

- available
- enabled
- configured
- ready

---

## 13.2 Suggested type

```ts
type ResolvedFeatureState = {
  key: FeatureKey;
  available: boolean;
  enabled: boolean;
  configured: boolean;
  ready: boolean;
};
```

---

# 14. Implementation by domain

The project rule is:

> Each domain implements its own configuration, validation, and readiness rules.

## What that means

### Kanban
The `kanban` domain knows:
- how to validate categories
- how to validate triggers
- how to guarantee the default column
- how to decide if the feature is configured

### Payments
The `payments` domain knows:
- how to validate Stripe keys
- how to decide if the provider is ready
- how to resolve feature readiness

## What stays central
Only the basics:
- catalog of feature keys
- per-organization toggles
- perhaps plan-based availability

Everything else lives in the domain.

---

# 15. Recommended full implementation layout

## Business domains
```txt
src/server/customers/
src/server/items/
src/server/estimates/
src/server/invoices/
src/server/kanban/
src/server/payments/
src/server/notifications/
src/server/tax-types/
src/server/payment-modes/
src/server/notes/
src/server/expense-categories/
```

## Structural domains
```txt
src/server/iam/
src/server/account/
src/server/organizations/
src/server/storage/
src/server/shared/
```

---

# 16. Main flows

## 16.1 Flow to show the Kanban menu item

1. is the user authenticated?
2. was ability built?
3. is the `kanban` feature `ready`?
4. does the user have `task:view`?
5. if yes, show menu

---

## 16.2 Flow to open Settings > Payments

1. user authenticated
2. user is an organization member
3. `isOwner === true`
4. render screen
5. on that screen, show state:
   - available?
   - enabled?
   - configured?
   - ready?

---

## 16.3 Flow to enable Kanban

1. owner opens settings
2. enables the feature
3. system writes `organization_features.kanban = true`
4. `kanban` domain runs bootstrap
5. if no default category exists, create `To Do`
6. system exposes menu item if permission allows

---

## 16.4 Flow to enable Payments

1. owner enables the `payments` feature
2. system writes toggle
3. owner fills provider config
4. `payments` domain validates config
5. if config is valid, `configured = true`
6. feature becomes `ready`
7. invoices may use payments per domain rules

---

# 17. Important implementation rules

## 17.1 Never scatter `if plan === ...`
Instead, centralize in:
- feature availability
- limit checks
- feature readiness

## 17.2 Never mix feature config with IAM
IAM decides access.
Feature decides capability.
Config decides behavior.

## 17.3 Never treat the menu as security
Menu is UX.
Real security lives in the backend.

## 17.4 Always keep bootstrap in the domain
Example:
- creating the `To Do` column belongs in the Kanban domain, not a generic util

## 17.5 Owner-only Settings should not become role permissions for now
Project policy is already defined:
- Account = self
- rest of settings = owner-only

---

# 18. Suggested next technical step

After this design, the ideal implementation order is:

## Phase 1
- finalize `src/server/iam`
- finalize menu
- finalize sidebar by ability

## Phase 2
- implement `kanban` domain
- schema
- tables
- default column bootstrap
- triggers
- menu conditioned on feature

## Phase 3
- implement `payments` domain
- settings
- Stripe config
- readiness

## Phase 4
- implement storage/usage
- plan limits
- upload guards

---

# 19. Conclusion

The final Orgaflow architecture rests on three principles:

## 1. Organization by domain
Every relevant feature/module lives in its own domain.

## 2. Separation of concerns
- IAM decides access
- Features decide availability
- Configuration decides behavior
- Limits decide consumption

## 3. Simplified Settings
- `Account` is self
- everything else is owner-only

This design correctly addresses:

- Kanban as a real product feature
- Payments as a configurable feature without a main-menu item
- non-removable default `To Do` column
- org-configurable triggers
- uploads and storage under plan limits
- future growth without coupling

---

# 20. Executive summary

## Kanban
- feature
- affects menu
- owner configures
- has default `To Do` column
- not removable
- renameable
- triggers from estimate/invoice and statuses defined by the org

## Payments
- feature
- does not affect main menu
- owner configures
- lives in Settings
- may use Stripe as provider

## IAM
- sovereign owner
- roles for operational modules
- settings almost entirely owner-only
- account is the only self area

## Architecture
- everything by domain
- no mixing rules into generic files
- no plan logic scattered across the system

# settings-module-architecture.md

## Orgaflow Settings Module Architecture

## Overview

The **Settings Module** centralizes all configurable behavior of the
Orgaflow SaaS platform.

This module allows both **users** and **organizations** to manage
preferences that control how the system behaves.

Settings are divided into three primary scopes:

1.  **Account Settings** -- personal user settings
2.  **Organization Settings** -- company-level settings
3.  **Product Settings** -- configuration for platform modules

This separation ensures a scalable and maintainable architecture.

------------------------------------------------------------------------

# Settings Navigation Structure

Current navigation structure inside the application (settings secondary sidebar):

    Settings
    ├── Account Settings          (authOnly)
    ├── Company Settings          (ownerOnly)
    ├── Preferences               (ownerOnly)
    ├── Customization             (ownerOnly)
    ├── Roles                     (ownerOnly)
    ├── Notifications             (ownerOnly)
    ├── Tax types                 (ownerOnly)
    ├── Payment modes             (ownerOnly)
    ├── Notes                     (ownerOnly)
    ├── Expense categories        (ownerOnly)
    ├── Notifications             (ownerOnly)  ← organization_notification_settings
    ├── Billing & plan            (ownerOnly)
    └── Danger zone               (ownerOnly)

Each section controls a specific domain of the system.

------------------------------------------------------------------------

# 1. Account Settings

Account settings belong to the **currently logged-in user**.

These settings do not affect other members of the organization.

## Fields

-   Full name
-   Email
-   Password
-   Avatar

## Optional Future Fields

-   Preferred language
-   Timezone
-   Notification preferences
-   Security sessions

------------------------------------------------------------------------

# 2. Organization Settings

Organization settings define the **identity and configuration of the
workspace**.

These settings affect all members of the organization.

## Fields

-   Organization name
-   Slug
-   Logo
-   Business email
-   Phone number
-   Address
-   Timezone
-   Currency
-   Language
-   Date format

------------------------------------------------------------------------

# 3. Team Settings

Team settings manage the users that belong to the organization.

## Features

-   Invite members
-   Remove members
-   Change roles
-   View member activity

Future improvements may include:

-   team permissions
-   access logs
-   security policies

------------------------------------------------------------------------

# 4. Tasks Settings

Controls how the **Task module** behaves.

## Settings

-   Enable/disable task module
-   Default stage configuration
-   Maximum number of stages
-   Task assignment behavior

Example:

    Default Stage: "To Do"
    Stage deletion rules
    Task ownership requirements

------------------------------------------------------------------------

# 5. Estimate Settings

Controls behavior of estimates.

## Settings

-   Enable public approval links
-   Require rejection reason
-   Default expiration period
-   Estimate numbering prefix
-   Automatic invoice generation after approval
-   Allow estimate attachments

Example:

    Prefix: EST-
    Expiration: 30 days
    Auto-generate invoice on approval: true

------------------------------------------------------------------------

# 6. Invoice Settings

Controls invoice behavior.

## Settings

-   Invoice numbering prefix
-   Default due date
-   Enable invoice attachments
-   Payment instructions
-   Enable public invoice links

Example:

    Prefix: INV-
    Due date: 7 days
    Allow attachments: true

------------------------------------------------------------------------

# 7. Document Settings

Controls file attachments across documents.

## Settings

-   Enable attachments on estimates
-   Enable attachments on invoices
-   Maximum file size
-   Allowed file types
-   Allow client downloads

Example:

    Max file size: 25MB
    Allowed types: pdf, png, jpg, docx

------------------------------------------------------------------------

# 8. Workflow Automations

Defines automatic actions triggered by system events.

## Example Automations

    invoice_sent → create_task
    invoice_paid → create_task
    invoice_overdue → create_task (optional)

Each automation rule contains:

-   **Enabled** (on/off — inactive means “no automation” for that rule)
-   **Document type** (e.g. estimate, invoice)
-   **Trigger status** (which state transition fires the rule; user-selectable in UI)
-   Action type (e.g. `create_task`)
-   Task title template
-   Assignment strategy
-   Target stage
-   Due date offset

**Product default:** estimate approval **does not** create tasks; do not present `estimate_approved → create_task` as the default preset unless product policy changes.

------------------------------------------------------------------------

# 9. Public Links

Controls public access to documents.

## Settings

-   Enable public estimate links
-   Enable public invoice links
-   Require rejection reason
-   Link expiration
-   Allow client downloads

Example:

    Estimate link expiration: 30 days
    Invoice link expiration: unlimited

------------------------------------------------------------------------

# 10. Billing Settings

Handles SaaS billing configuration.

Future capabilities include:

-   subscription plan
-   billing history
-   payment methods
-   usage limits

------------------------------------------------------------------------

# Permissions

Most settings should only be editable by:

    owner
    admin

Regular members should not be able to change organization-level
configuration.

------------------------------------------------------------------------

# Database Architecture

## Table: organization_preferences

Stores per-organization display and behavior preferences. Created lazily
on first save (upsert pattern — no row exists until owner changes settings).

  Field                       Type      Default              Description
  --------------------------- --------- -------------------- -----------------------------------
  id                          text      uuidv7               primary key
  organization_id             text      —                    FK → organizations (cascade delete), unique
  default_currency_id         text      null                 FK → currencies (set null)
  language                    text      'en'                 UI language (only 'en' currently)
  timezone                    text      'UTC'                IANA timezone identifier
  date_format                 text      'DD/MM/YYYY'         One of 8 supported formats (see below). Applied across the entire system — tables, documents, charts, and reports.
  financial_year_start        text      'january-december'   One of 6 supported values (see below)
  public_links_expire_enabled boolean   false                Auto-expire public document links
  public_links_expire_days    integer   7                    Days until link expires (1–365)
  discount_per_item           boolean   false                Allow per-line discounts on documents
  created_at                  timestamp now()                —
  updated_at                  timestamp now()                —

### Supported date_format values

  Value          Example display
  -------------- ---------------
  YYYY_MMM_DD    2026 Mar 22
  DD_MMM_YYYY    22 Mar 2026
  DD/MM/YYYY     22/03/2026
  DD.MM.YYYY     22.03.2026
  DD-MM-YYYY     22-03-2026
  MM/DD/YYYY     03/22/2026
  YYYY/MM/DD     2026/03/22
  YYYY-MM-DD     2026-03-22

### Supported financial_year_start values

    january-december    (1–12)
    february-january    (2–1)
    march-february      (3–2)
    april-march         (4–3)
    may-april           (5–4)
    june-may            (6–5)
    july-june           (7–6)
    august-july         (8–7)
    september-august    (9–8)
    october-september   (10–9)
    november-october    (11–10)
    december-november   (12–11)

## Table: organization_notification_settings

Notification delivery preferences. See
[`notification-settings-architecture.md`](./notification-settings-architecture.md)
for the full schema and procedure reference.

| Column | Default | Description |
|---|---|---|
| `notify_email` | null | Destination — null falls back to owner email |
| `invoice_viewed` | false | Notify on public invoice link opened |
| `estimate_viewed` | false | Notify on public estimate link opened |

## Table: organization_subscriptions

Stripe billing state. Managed via webhook handler and upgrade flow.

## Table: organizations (danger zone)

Deleting an organization cascades to all child records.
The owner must type the literal string `confirm` to trigger deletion.
After deletion the user is redirected to `/app/workspace`.

------------------------------------------------------------------------

# Why This Architecture Matters

Centralizing configuration inside a dedicated **Settings Module**
provides:

-   a clear product structure
-   easier feature toggling
-   safer permission management
-   scalability as new modules are added

------------------------------------------------------------------------

# Future Expansion

The settings module can later support:

-   feature flags
-   advanced workflow builders
-   custom branding
-   API keys
-   integrations
-   webhook configuration

------------------------------------------------------------------------

# Summary

The **Settings Module** is the central control panel for configuring
Orgaflow.

By separating:

-   user settings
-   organization settings
-   module configuration

the system remains modular, scalable, and easy to extend as the SaaS
evolves.

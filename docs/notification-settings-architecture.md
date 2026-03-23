# notification-settings-architecture.md

## Orgaflow — Notification Settings Architecture

---

## Overview

The **Notification Settings** module controls which email notifications the
organization owner receives when customers interact with shared documents.

Settings live in **Settings → Notifications** (owner-only) and are stored
in a dedicated table — separate from `organization_preferences` — because
notifications are a distinct domain that will grow independently.

---

## Database

### Table: `organization_notification_settings`

One row per organization. Created inside the same transaction as the
organization, member, preferences, and subscription rows — so the row always
exists and no null handling is needed in consumers.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | text | uuidv7 | Primary key |
| `organization_id` | text | — | FK → `organizations` (cascade delete), unique |
| `notify_email` | text | null | Destination address. `null` = owner's account email |
| `invoice_viewed` | boolean | false | Notify when customer opens a public invoice link |
| `estimate_viewed` | boolean | false | Notify when customer opens a public estimate link |
| `created_at` | timestamp | now() | — |
| `updated_at` | timestamp | now() | — |

**Default values at org creation:**

```ts
{
  notifyEmail: null,       // falls back to owner email in the UI
  invoiceViewed: false,
  estimateViewed: false,
}
```

---

## tRPC procedures (`settings` router)

| Procedure | Type | Description |
|---|---|---|
| `settings.getNotificationSettings` | `ownerProcedure` query | Returns the row (or null for legacy orgs) |
| `settings.updateNotificationSettings` | `ownerProcedure` mutation | Upsert — creates row if missing, updates otherwise |

### Input schema — `updateNotificationSettings`

```ts
z.object({
  notifyEmail: z.email().nullable().optional(),
  invoiceViewed: z.boolean().optional(),
  estimateViewed: z.boolean().optional(),
})
```

---

## UI — Settings → Notifications

**Route:** `/app/settings/notifications`
**File:** `src/app/(private)/app/(home)/settings/notifications/page.tsx`

### Sections

**Send notifications to**
- Email input; placeholder = owner's account email; leave blank to use account email.

**Document interactions**
- `Invoice viewed` — toggle (default off). Triggered when customer opens a public invoice link.
- `Estimate viewed` — toggle (default off). Triggered when customer opens a public estimate link.

---

## How notifications are sent

When a customer opens a public document link the system will:

1. Check `organization_notification_settings.invoice_viewed` (or `estimate_viewed`)
2. If enabled, resolve the destination:
   - `notify_email` if set
   - otherwise the owner's email from `users`
3. Send the email via the transactional email provider

> **Note:** Email sending is not yet implemented. The settings are in place
> so the feature can be wired up without schema changes.

---

## Future notification types

The table can grow with new boolean columns as new events are introduced:

| Planned column | Trigger |
|---|---|
| `estimate_approved` | Customer approves an estimate |
| `estimate_rejected` | Customer rejects an estimate |
| `invoice_paid` | Invoice marked as paid |
| `invoice_overdue` | Invoice passes due date |
| `payment_received` | Online payment recorded |

Each new column follows the same pattern: default `false`, toggle in UI,
checked before sending.

---

## Org creation

`organizationNotificationSettings` is inserted inside the
`createOrganization` transaction in
`src/server/trpc/routers/workspace.ts`, alongside `organizationPreferences`
and `organizationSubscriptions`. This guarantees the row is always present.

# Orgaflow — Email Strategy

> Last updated: 2026-04-27

---

## Provider

**Resend** — single provider for all email types (transactional and marketing).

- Transactional emails → Resend API
- Broadcasts (changelog, product updates) → Resend Broadcasts + Audiences

**Sender:** `hello@orgaflow.dev`  
**Language:** English (always)  
**Tone:** Casual and friendly — clear, direct, human. Think Notion, Linear, Vercel.

---

## Audiences

Three audiences managed in Resend:

| Audience | Who | When synced |
|----------|-----|-------------|
| `all-users` | Every user who creates an account | On registration |
| `active-orgs` | Org owners with activity in the last 60 days | Daily cron |
| `beta-testers` | Users who opt into early access | Manual / in-app toggle |

---

## 1. Transactional Emails

Triggered by user actions or scheduled jobs. Cannot be opted out of (except tips/onboarding).

### Welcome

**Trigger:** User registers  
**Audience:** —  
**Opt-out:** No

A warm, simple welcome. No verification link — just a "glad you're here" message with a single CTA to get started.

```
Subject: Welcome to Orgaflow
CTA: Go to your dashboard
```

---

### Onboarding Sequence

Opt-outable. Sent only if the user has not completed the relevant action yet.

| Email | Trigger | CTA |
|-------|---------|-----|
| **Getting started** | D+1 after registration | Create your first organization |
| **Hidden gems** | D+3 after registration | Try recurring invoices or estimates |

The D+3 email highlights less obvious features (recurring invoices, estimates, expense tracking) — things users often miss on their first week.

---

### Invite Flow

| Email | Trigger | Recipient |
|-------|---------|-----------|
| **You're invited** | Org member invited | Invited person |
| **New member joined** | Invite accepted | Org owner |

---

### Invoice & Payment

| Email | Trigger | Notes |
|-------|---------|-------|
| **Invoice overdue — alert** | Due date reached | First notice |
| **Invoice overdue — reminder** | D+3 after due date | Follow-up |
| **Invoice overdue — final** | D+7 after due date | Last call |
| **Payment received** | Payment webhook | Confirmation to org owner |
| **Payment failed** | Failed payment webhook | With link to update billing |

---

## 2. Product Email (Changelog & Roadmap)

**Type:** Resend Broadcast  
**Audience:** `active-orgs`  
**Cadence:** When there's enough content — no fixed schedule  
**Opt-out:** Yes

### How it works

Semi-automatic pipeline:

1. `CHANGELOG.md` accumulates changes during development
2. When ready to send, a script reads the latest unreleased entries and drafts the email content
3. The draft is reviewed and sent manually via the Resend Broadcasts dashboard

### Email structure

```
Subject: What's new in Orgaflow — [Month Year]

─────────────────────────────
  What's new
  → Feature X — short description
  → Feature Y — short description

  Improvements
  → Smaller improvement A
  → Smaller improvement B

  Bug fixes
  → Notable fix

  Coming soon
  → One or two things in progress
─────────────────────────────
```

Only sections with actual content are included — no empty sections, no filler.

---

## 3. Email Preferences (Opt-out)

Managed in the app's Settings page under a dedicated **Email preferences** section.

| Preference | Default | Can disable |
|-----------|---------|-------------|
| Product updates & changelog | On | Yes |
| Tips & onboarding sequence | On | Yes |
| Transactional (invoices, payments) | On | No |

Preferences are stored in the database and synced to the Resend Audience contact on change (setting `unsubscribed: true` for opted-out categories).

Every marketing/non-transactional email includes an **Unsubscribe** link in the footer that respects these preferences.

---

## Implementation Order

1. **Resend Audiences** — create the three audiences, sync contacts on registration
2. **Welcome email** — first transactional, highest impact
3. **Onboarding sequence** — D+1 and D+3 via cron, with completion checks
4. **Email preferences UI** — required before any broadcast goes out
5. **Standardize existing templates** — invites, overdue sequence, payment emails
6. **Changelog pipeline** — script to draft broadcast from `CHANGELOG.md`

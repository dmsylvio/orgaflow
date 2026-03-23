
# Orgaflow

Orgaflow is a **multi-tenant SaaS platform for managing the complete client workflow**, from the first estimate to payment and execution.

The platform helps businesses manage:

- customers
- estimates
- invoices
- payments
- expenses
- tasks
- workflow automations

Instead of using multiple disconnected tools, Orgaflow centralizes the entire process in a single system.

---

# Core Workflow

Orgaflow is built around a simple but powerful business workflow:

Customer
→ Estimate
→ Client Approval
→ Invoice
→ Payment
→ Task / Work Execution

This structure connects sales, billing, and operations into a single flow.

---

# Main Features

## Customers
Centralized customer database with:

- contact information
- history of estimates and invoices
- linked documents

---

## Items
Reusable products or services used to build estimates and invoices quickly.

---

## Estimates

Create professional estimates that can be shared with clients.

Features:

- line items
- taxes and totals
- expiration dates
- client messages
- attachments
- PDF export

Clients can open a **public estimate page** and:

- review the estimate
- download files
- approve the estimate
- reject the estimate with a reason

---

## Invoices

Invoices can be created manually or generated from estimates.

Features include:

- itemized billing
- PDF export
- public invoice pages
- payment tracking

---

## Payments

Track invoice payments or collect them through online payment providers.

The system records:

- payment amount
- payment date
- payment status

---

## Expenses

Record business expenses to track operational costs and profitability.

---

## Tasks (Kanban)

Orgaflow includes a task board system to manage work after a deal is approved.

Capabilities include:

- kanban stages
- task ownership
- workflow visibility

Tasks can be created automatically from system events.

---

## Workflow Automations

Automations connect sales events with operational work.

Examples:

estimate approved → create task
invoice paid → create task

---

## Attachments

Documents such as:

- contracts
- mockups
- reference files

can be attached to estimates and invoices.

---

## Public Client Pages

Clients can access secure public pages to:

- review estimates
- approve or reject proposals
- view invoices
- download documents

---

# Multi‑Tenant Architecture

Orgaflow is designed as a **multi‑tenant SaaS system**.

Each organization has its own workspace with:

- users
- customers
- documents
- settings
- workflow rules

---

# Settings System

A centralized settings module allows organizations to configure:

- branding
- workflow preferences
- document behavior
- payment integrations
- automation rules

Users also have personal account settings.

---

# Pricing Model

Orgaflow uses a **three‑tier pricing structure**:

Orgaflow Starter
Orgaflow Growth
Orgaflow Scale

The Orgaflow Starter plan allows users to experience the platform with usage limits.
Paid plans (Orgaflow Growth and Orgaflow Scale) unlock advanced capabilities such as:

- online payments
- workflow automations
- larger teams
- expanded limits

Full pricing details are documented under [`docs/`](./docs/).

---

# Documentation

The [`docs/`](./docs/) folder contains **English** architecture and strategy guides. Start from **[`docs/README.md`](./docs/README.md)** for a full index.

Topics include: implementation strategy, IAM, server/UI architecture, domains & features, Stripe Connect payments, pricing, lifecycle, public links, attachments, domain events, workflow automations, Kanban, and settings.

---

# Ideal Use Cases

Orgaflow works best for businesses that follow a quote‑to‑delivery workflow.

Examples:

- print shops
- custom apparel companies
- event decorators
- marketing agencies
- design studios
- local service businesses

---

# Repository Structure

```
README.md
docs/README.md          # index of all guides (English)

docs/
 ├ iam-architecture-technical.md
 ├ orgaflow-implementation-strategy.md
 ├ orgaflow-server-architecture.md
 ├ orgaflow-domains-iam-features-architecture.md
 ├ orgaflow-ui-architecture.md
 ├ orgaflow-payments-stripe-connect-architecture.md
 ├ orgaflow-docs-architecture.md
 ├ … (see docs/README.md)
```

---

# Vision

Orgaflow aims to become a **complete client workflow platform for small and medium businesses**, combining:

- quoting
- billing
- payments
- workflow management
- operational execution

in a single integrated system.

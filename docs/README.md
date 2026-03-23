# Orgaflow documentation

All documents in this folder are **English**. They describe product architecture, IAM, pricing, implementation strategy, and module design.

## Quick links

| Document | Topic |
| -------- | ----- |
| [`iam-architecture-technical.md`](./iam-architecture-technical.md) | **Canonical IAM** — owner, roles, permissions, menus, tRPC |
| [`orgaflow-implementation-strategy.md`](./orgaflow-implementation-strategy.md) | Master implementation strategy vs repo reality |
| [`orgaflow-server-architecture.md`](./orgaflow-server-architecture.md) | `src/server` layout, DB imports, IAM, features, Kanban, payments |
| [`orgaflow-domains-iam-features-architecture.md`](./orgaflow-domains-iam-features-architecture.md) | Domains, IAM, features, quotas, menu, Kanban & payments |

## Product & GTM

| Document | Topic |
| -------- | ----- |
| [`orgaflow-pricing-strategy.md`](./orgaflow-pricing-strategy.md) | Decoy pricing, Starter / Growth / Scale |
| [`orgaflow-free-plan-limit-strategy.md`](./orgaflow-free-plan-limit-strategy.md) | Starter plan limits |
| [`orgaflow-30-day-commercialization-strategy.md`](./orgaflow-30-day-commercialization-strategy.md) | 30-day commercialization plan |

## Financial & payments

| Document | Topic |
| -------- | ----- |
| [`orgaflow-payments-stripe-connect-architecture.md`](./orgaflow-payments-stripe-connect-architecture.md) | Payments domain + **Stripe Connect** |

## Modules & UX

| Document | Topic |
| -------- | ----- |
| [`orgaflow-ui-architecture.md`](./orgaflow-ui-architecture.md) | UI layers, Tailwind CSS, shared vs domain components |
| [`settings-module-architecture.md`](./settings-module-architecture.md) | Settings module — preferences, danger zone |
| [`notification-settings-architecture.md`](./notification-settings-architecture.md) | Notification settings — table, procedures, UI |
| [`tasks-kanban-module.md`](./tasks-kanban-module.md) | Tasks / Kanban |
| [`workflow-automations-orgaflow.md`](./workflow-automations-orgaflow.md) | Workflow automations |

## Documents & lifecycle

| Document | Topic |
| -------- | ----- |
| [`estimate-invoice-lifecycle.md`](./estimate-invoice-lifecycle.md) | Estimate → invoice lifecycle |
| [`public-document-links-strategy.md`](./public-document-links-strategy.md) | Public client links |
| [`document-attachments-strategy.md`](./document-attachments-strategy.md) | Attachments on estimates/invoices |
| [`domain-events-architecture.md`](./domain-events-architecture.md) | Domain events |

## Meta

| Document | Topic |
| -------- | ----- |
| [`orgaflow-docs-architecture.md`](./orgaflow-docs-architecture.md) | How docs are organized / optional future layout |

## Deprecated / pointer

| Document | Note |
| -------- | ---- |
| [`orgaflow-iam-architecture-technical.md`](./orgaflow-iam-architecture-technical.md) | Redirects to **`iam-architecture-technical.md`** |

---

Start with **`orgaflow-implementation-strategy.md`** and **`iam-architecture-technical.md`**, then dive into domain docs as needed.

**UI stack:** **Tailwind CSS** + componentes em `src/components/ui/` (`docs/orgaflow-ui-architecture.md`).

# Orgaflow documentation layout

## Orgaflow Documentation Architecture

This document defines the **recommended documentation structure** for
the Orgaflow repository.

The goal is to keep the project **organized, scalable, and easy to
maintain** as the SaaS grows.

All core system features should have their own documentation file. **Current repo state:** `.md` files live in **`/docs`** at the repository root (flat list). This section describes **what exists today** and an **optional future layout** if you reorganize later.

------------------------------------------------------------------------

# Current layout (canonical for this repo)

    docs/
    ├── README.md                          # master index (start here)
    ├── iam-architecture-technical.md
    ├── orgaflow-implementation-strategy.md
    ├── orgaflow-server-architecture.md
    ├── orgaflow-domains-iam-features-architecture.md
    ├── orgaflow-ui-architecture.md
    ├── orgaflow-payments-stripe-connect-architecture.md
    ├── orgaflow-pricing-strategy.md
    ├── orgaflow-free-plan-limit-strategy.md
    ├── orgaflow-docs-architecture.md
    ├── orgaflow-30-day-commercialization-strategy.md
    ├── orgaflow-iam-architecture-technical.md   # pointer → iam-architecture-technical.md
    ├── domain-events-architecture.md
    ├── estimate-invoice-lifecycle.md
    ├── public-document-links-strategy.md
    ├── document-attachments-strategy.md
    ├── settings-module-architecture.md
    ├── tasks-kanban-module.md
    ├── workflow-automations-orgaflow.md
    └── … (additional guides as needed)

------------------------------------------------------------------------

# Optional future layout

If the number of documents grows, you may move to:

    docs/
    ├── README.md
    ├── architecture/
    ├── features/
    ├── financial/
    └── api/

Files above can move into subfolders **without changing their content**; update internal links only.

------------------------------------------------------------------------

# Core Documentation Files

Below is the purpose of each main documentation file.

------------------------------------------------------------------------

# Architecture

## domain-events-architecture.md

Explains how the system emits internal events such as:

-   `estimate_approved`
-   `invoice_paid`
-   `invoice_overdue`

These events are used to trigger:

-   workflow automations
-   notifications
-   task creation

This document defines the **event-driven architecture of Orgaflow**.

------------------------------------------------------------------------

## multi-tenant-architecture.md

Defines how Orgaflow supports multiple organizations.

Topics include:

-   organization isolation
-   data scoping
-   RBAC permissions
-   organization-level settings

------------------------------------------------------------------------

## security-model.md

Defines the security principles of the platform.

Includes:

-   public document tokens
-   signed file URLs
-   permission checks
-   data isolation

------------------------------------------------------------------------

# Features

## tasks-kanban.md

Defines the **Task Management system**.

Includes:

-   Kanban board structure
-   default stage behavior
-   stage permissions
-   task creation rules
-   workflow integration

------------------------------------------------------------------------

## workflow-automations.md

Defines how system events automatically generate tasks.

Examples:

-   `invoice_sent → create_task` (regra ativa + gatilho por estado)
-   `invoice_paid → create_task`

Includes:

-   automation rules
-   event triggers
-   task templates
-   assignment strategies

------------------------------------------------------------------------

## document-attachments.md

Defines how files can be attached to documents.

Supports:

-   estimates
-   invoices

Features include:

-   internal vs client-visible files
-   storage architecture
-   file security
-   UI behavior

------------------------------------------------------------------------

## public-document-links.md

Defines the system that allows clients to view documents without login.

Examples:

    orgaflow.dev/p/{token}

Supports:

-   viewing estimates
-   approving estimates
-   rejecting estimates
-   viewing invoices

Includes:

-   token security
-   public document rendering
-   tracking views

------------------------------------------------------------------------

# Financial System

## estimates-workflow.md

Defines the lifecycle of estimates.

Typical states:

    draft
    sent
    viewed
    approved
    rejected
    expired

Includes:

-   public approval flow
-   rejection reasons
-   conversion to invoices

------------------------------------------------------------------------

## invoices-system.md

Defines how invoices operate in the system.

States:

    draft
    sent
    viewed
    paid
    overdue
    void

Includes:

-   payment handling
-   invoice links
-   automation triggers

------------------------------------------------------------------------

## estimate-invoice-lifecycle.md

Explains the relationship between estimates and invoices.

Example flow:

    estimate created
    → estimate sent
    → client approves
    → invoice generated
    → client pays
    → work begins

------------------------------------------------------------------------

# API Documentation

## public-document-api.md

Defines endpoints used for public document interactions.

Examples:

    GET /p/:token
    POST /p/:token/approve
    POST /p/:token/reject

------------------------------------------------------------------------

## task-api.md

Defines the task system endpoints.

Examples:

    POST /tasks
    PATCH /tasks/:id
    PATCH /tasks/:id/move

------------------------------------------------------------------------

## automation-api.md

Defines automation configuration endpoints.

Examples:

    POST /automation-rules
    PATCH /automation-rules/:id
    DELETE /automation-rules/:id

------------------------------------------------------------------------

# Why This Structure Matters

As Orgaflow grows, maintaining clear documentation helps:

-   onboard developers faster
-   prevent architectural drift
-   keep features consistent
-   support scaling of the SaaS

A structured documentation system becomes the **technical backbone of
the project**.

------------------------------------------------------------------------

# Recommended First Docs To Write

If starting from scratch, prioritize:

1.  tasks-kanban.md
2.  workflow-automations.md
3.  public-document-links.md
4.  document-attachments.md
5.  estimate-invoice-lifecycle.md

These define the **core workflow of the platform**.

------------------------------------------------------------------------

# Summary

The Orgaflow documentation system should be:

-   modular
-   feature-based
-   architecture-oriented
-   easy to navigate

Using this structure ensures the project remains **maintainable and
scalable as it evolves into a full SaaS platform**.

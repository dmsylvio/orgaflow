# estimate-invoice-lifecycle.md

## Estimate → Invoice → Work Execution Lifecycle

## Overview

This document defines the lifecycle and relationship between
**Estimates** and **Invoices** in Orgaflow.

The purpose is to standardize the commercial workflow used by most
businesses:

Estimate → Client approval → Invoice → Payment → Work execution.

The lifecycle must remain **flexible**, because different organizations
start work at different stages.

------------------------------------------------------------------------

# Core Principle

Orgaflow should **not enforce a rigid workflow**.

Instead, the system should support multiple business flows, such as:

1.  Work starts after **estimate approval**
2.  Work starts after **invoice payment**
3.  Work starts after **invoice sent**

Automations and tasks will allow organizations to customize the
workflow.

------------------------------------------------------------------------

# Estimate Lifecycle

Estimates represent a proposal sent to a client before work begins.

## Estimate Status Flow

    draft
    → sent
    → viewed
    → approved
    → rejected
    → expired

### draft

Estimate is being created internally.

### sent

Estimate has been sent to the client.

### viewed

Client opened the public estimate link.

### approved

Client approved the estimate.

### rejected

Client rejected the estimate and may provide a reason.

### expired

Estimate validity period expired.

------------------------------------------------------------------------

# Client Interaction

Clients interact with estimates through **public document links**.

Example:

    orgaflow.dev/p/{token}

Clients can:

-   view estimate
-   review items
-   download attachments
-   approve
-   reject with reason

------------------------------------------------------------------------

# Invoice Creation

Invoices are typically created when an estimate is approved.

Two possible approaches:

## Manual Invoice Creation

User manually converts estimate to invoice.

    estimate approved
    → user clicks "Generate Invoice"

## Automatic Invoice Creation

The system automatically generates an invoice.

    estimate approved
    → system creates invoice

This behavior may be controlled by automation rules.

------------------------------------------------------------------------

# Invoice Lifecycle

Invoices represent payment requests.

## Invoice Status Flow

    draft
    → pending
    → sent
    → viewed
    → paid
    → overdue
    → void

### draft

Invoice is being prepared internally.

### pending

Invoice exists as a real lifecycle state (e.g. generated from an approved estimate, queued for review, or awaiting send). Use this state in UI, reporting, and **optional** automation triggers — it is not a pseudo-state.

### sent

Invoice was sent to the client.

### viewed

Client opened the invoice link.

### paid

Payment was successfully received.

### overdue

Payment due date passed.

### void

Invoice cancelled or invalid.

------------------------------------------------------------------------

# Example Workflows

## Workflow A --- Work starts after estimate approval

    estimate sent
    → client approves
    → invoice generated (may pass through pending)
    → (optional) task via manual creation or **automation** on invoice status — **not** from estimate approval by default
    → client pays later

Common in service businesses.

------------------------------------------------------------------------

## Workflow B --- Work starts after payment

    estimate approved
    → invoice generated
    → client pays
    → (optional) task via manual creation or **automation** (e.g. trigger on `invoice` → `PAID`)

Common in manufacturing or product-based businesses.

**Product rule:** estimate approval **does not** automatically create tasks; automations (Scale) use **configurable document + status** triggers in Settings.

------------------------------------------------------------------------

# Automation Integration

The lifecycle integrates with **Workflow Automations**.

Examples (when automations are **enabled** for the org/rule):

    invoice_paid → create_task
    invoice_sent → create_task

Triggers are selected per rule (document type + status). **No** default `estimate_approved → create_task` in core product behavior.

------------------------------------------------------------------------

# Attachments Integration

Both estimates and invoices may contain attachments.

Examples:

-   design mockups
-   contracts
-   technical specifications
-   proof documents

Attachments may be:

-   internal
-   client visible

------------------------------------------------------------------------

# Summary

The Estimate → Invoice lifecycle supports the typical commercial flow
of:

    proposal → approval → payment → execution

Orgaflow must support flexible workflows while maintaining clear state
transitions for estimates and invoices.

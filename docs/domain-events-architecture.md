# domain-events-architecture.md

## Orgaflow Domain Events Architecture

## Overview

This document defines the **Domain Events architecture** used in
Orgaflow.

Domain events represent important actions that occur inside the system
and can trigger additional behavior such as:

-   workflow automations
-   notifications
-   task creation
-   analytics
-   integrations

Using domain events keeps the system **modular, scalable, and easier to
maintain**.

------------------------------------------------------------------------

# What is a Domain Event

A domain event represents something meaningful that happened inside the
system.

Example:

    estimate_approved

This means a client approved an estimate.

Instead of embedding logic everywhere, the system emits an event and
other modules can react to it.

------------------------------------------------------------------------

# Event Flow

Example flow:

    Invoice marked paid
    → system updates invoice.status
    → system emits event: invoice_paid
    → automation engine receives event (if module + rule enabled)
    → matching rule creates task

This approach decouples business logic. **Estimate approval does not imply task creation** in the default product; use invoice (or other configured) status triggers for `create_task` automations.

------------------------------------------------------------------------

# Core Domain Events

The following events should be part of the initial Orgaflow system.

## Naming conventions

All names below are **past-tense / completed fact** snake_case strings used in code, logs, timeline, and automation matching.

- **Scope:** organization-scoped business facts only (no cross-tenant platform events).
- **Stability:** treat renames as breaking for automations and integrations; prefer additive new events.
- **Voided invoices:** use **`invoice_voided`** only (do not use `invoice_void` as an event name).

## Estimate Events

    estimate_created
    estimate_sent
    estimate_viewed
    estimate_approved
    estimate_rejected
    estimate_expired

------------------------------------------------------------------------

## Invoice Events

    invoice_created
    invoice_sent
    invoice_viewed
    invoice_pending
    invoice_paid
    invoice_overdue
    invoice_voided

------------------------------------------------------------------------

## Task Events

    task_created
    task_updated
    task_completed
    task_deleted

------------------------------------------------------------------------

## File Events

    file_uploaded
    file_deleted

------------------------------------------------------------------------

## Automation Events

    automation_rule_created
    automation_rule_updated
    automation_rule_deleted

------------------------------------------------------------------------

# Event Payload Example

Example payload for an event.

    {
      event: "estimate_approved",
      organization_id: "org_123",
      estimate_id: "est_456",
      customer_id: "cust_789",
      triggered_at: "timestamp"
    }

Payloads allow other services to process the event.

------------------------------------------------------------------------

# Event Consumers

Different parts of the system can react to events.

Examples:

## Workflow Automations

    invoice_sent → create_task (when rule enabled + trigger configured)
    invoice_paid → create_task

## Notifications

    estimate_viewed → notify sales team
    invoice_paid → notify finance

## Analytics

    estimate_approved → track conversion
    invoice_paid → track revenue

------------------------------------------------------------------------

# Benefits of Domain Events

Using domain events provides:

-   decoupled architecture
-   easier feature expansion
-   centralized event tracking
-   support for integrations and automation

This approach is widely used in modern SaaS platforms.

------------------------------------------------------------------------

# Future Expansion

Domain events allow future integrations such as:

-   webhooks
-   external integrations
-   reporting systems
-   workflow builders

Example:

    invoice_paid → send webhook

------------------------------------------------------------------------

# Summary

Domain Events are the backbone of a scalable architecture.

They allow Orgaflow to grow while keeping the codebase clean and modular
by separating **what happened** from **what should happen next**.

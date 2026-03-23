# Workflow Automations --- Task Generation from Estimates and Invoices

## Overview

This document defines the strategy for implementing **Workflow
Automations** in Orgaflow.\
The goal is to allow organizations to automatically generate **tasks**
based on specific **events** that occur within the system, particularly
related to **estimates** and **invoices**.

This feature enables businesses to align Orgaflow with their real
operational workflow without forcing a single rigid process.

------------------------------------------------------------------------

# Goals

The Workflow Automations system aims to:

-   Allow organizations to automate operational steps
-   Support different business workflows
-   Reduce manual work
-   Improve operational coordination
-   Keep the system flexible and scalable

------------------------------------------------------------------------

# Real-World Example

Consider a company that sells **custom printed t‑shirts**.

## Step 1 --- Create Estimate

The company sends an estimate to the client.

estimate.status = sent

The client receives a **public link** to view the estimate.

------------------------------------------------------------------------

## Step 2 --- Client Approves Estimate

If the client approves:

estimate.status = approved

At this moment, the business may:

-   generate an invoice
-   start production
-   assign work to a production team

Different companies handle this differently.

------------------------------------------------------------------------

# Possible Workflows

## Workflow A --- Production after Estimate Approval

Some businesses start work immediately after the estimate is approved.

estimate approved → generate invoice → (optional) create task when an **enabled** automation fires on a chosen **invoice status** → client pays later

------------------------------------------------------------------------

## Workflow B --- Production after Invoice Payment

Other businesses require payment before starting work.

estimate approved → generate invoice → client pays → create task when rule triggers on **invoice paid** (or other configured status)

------------------------------------------------------------------------

# Key Design Principle

Orgaflow should **not enforce a single workflow**.

Instead, the system should support **event‑based automations** where the
organization decides when tasks are created.

------------------------------------------------------------------------

# Event-Based Automation Model

Workflow automations are based on two components:

## Event (Trigger)

An event is something that happens in the system.

Examples (event names for logging / timeline; **triggers** in UI are document type + **status**):

estimate_rejected\
invoice_sent\
invoice_paid\
invoice_overdue\
invoice_pending (if used)

**Note:** `estimate_approved` may still emit a domain event for analytics and timeline, but it is **not** the default trigger for `create_task` in the product — approving an estimate does not auto-create tasks unless product policy adds an explicit opt-in rule later.

------------------------------------------------------------------------

## Action

An action is what the system executes automatically when the event
occurs.

Initial action supported:

create_task

Future actions may include:

send_internal_notification\
send_email\
update_customer_status\
generate_invoice

------------------------------------------------------------------------

# Initial Supported Automations

For the first version, the system should support at least:

invoice_paid → create_task\
invoice_sent → create_task (optional second preset)

Each rule must include:

- **enabled** (boolean) — “no automation” means disabled or module off
- **resource** (estimate vs invoice) + **trigger status** (which state fires the action)

**Estimate approval does not create tasks** in the default product behavior.

------------------------------------------------------------------------

# Settings Interface

Location:

Settings → Workflow Automations

Example configuration:

## Automation Rule

-   **Rule enabled:** on / off (off = no runs; “no automation”)
-   **Document:** Invoice (example)
-   **Trigger status:** Paid (when `invoice.status` becomes `PAID`)

Action:

Create Task

Task configuration:

-   Task title template
-   Assigned user
-   Target stage
-   Due date rule

------------------------------------------------------------------------

# Example Configuration

### Automation 1

Trigger:

Invoice Sent

Create Task:

Title:\
Prepare work for {{customer.name}} — invoice {{invoice.number}}

Assign to:\
Production Manager

Stage:\
To Do

Due:\
Today

------------------------------------------------------------------------

### Automation 2

Trigger:

Invoice Paid

Create Task:

Title:\
Start production for invoice {{invoice.number}}

Assign to:\
Operations Team

Stage:\
Production

Due:\
Today

------------------------------------------------------------------------

# Backend Workflow

When a document status changes (example):

invoice.status → paid

The system emits an internal event (e.g. `invoice_paid`) and the automation engine then:

1.  Loads rules for the organization
2.  Keeps only **enabled** rules
3.  Matches **resource type + trigger status**
4.  Executes the action (e.g. `create_task`) once per rule (with idempotency as needed)

Example:

invoice paid\
→ enabled rule: invoice + PAID → create_task\
→ task created

Approving an estimate may still emit `estimate_approved` for timeline/analytics, but **does not** by itself create tasks.

------------------------------------------------------------------------

# Automatically Generated Task

Example generated task:

Title:\
Produce order for John Doe

Source:\
invoice_paid

Reference:\
invoice_id

To track origin, tasks should store:

source_type = automation\
source_event = estimate_approved\
source_id = estimate_id

------------------------------------------------------------------------

# Suggested Database Structure

## Table: automation_rules

id\
organization_id\
is_enabled\
trigger_event\
action_type\
task_stage_id\
task_title_template\
task_description_template\
assign_strategy\
assigned_user_id\
due_offset_days\
created_at\
updated_at

------------------------------------------------------------------------

# Assignment Strategies

Tasks created automatically may be assigned based on:

document_owner\
organization_owner\
specific_user

If specific_user is used:

assigned_user_id

------------------------------------------------------------------------

# Task Templates

Templates allow dynamic content using placeholders.

Example:

Follow up on approved estimate {{estimate.number}}

Another example:

Start work for invoice {{invoice.number}} for {{customer.name}}

------------------------------------------------------------------------

# Automation Limits

To prevent excessive complexity:

-   limit to **10 automation rules per organization**
-   only **owner/admin** can create automations

------------------------------------------------------------------------

# System Benefits

Workflow Automations allow Orgaflow to support many industries:

-   custom manufacturing
-   event planning
-   printing services
-   marketing agencies
-   service providers
-   contractors

Each company can define when work begins.

------------------------------------------------------------------------

# Future Expansion

This architecture allows future features such as:

multiple actions per event\
conditional automations\
notifications\
document workflows\
inventory triggers

But the first version should remain simple.

------------------------------------------------------------------------

# Recommended Initial Scope

Supported triggers:

estimate_approved\
invoice_paid

Supported action:

create_task

Configuration:

-   task title
-   assigned user
-   stage
-   due date

------------------------------------------------------------------------

# Summary

Workflow Automations allow organizations to define **when operational
tasks should be created automatically**.

Instead of enforcing a rigid workflow, Orgaflow enables flexible
automation based on events such as:

estimate approval\
invoice payment

This design keeps the system simple while enabling powerful real‑world
workflows.

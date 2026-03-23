# Tasks Module — Lightweight Kanban

## Functional and Technical Specification

## 1. Goal

Add a lightweight **Kanban task** module so each organization can manage internal work visually and simply.

This module is **not** a full project-management suite; it is a **basic internal workflow** for tracking tasks.

------------------------------------------------------------------------

# 2. Module Scope

The module supports:

- creating tasks
- organizing tasks in columns (stages)
- moving tasks between columns
- creating new columns (owner/admin)
- renaming columns
- custom column ordering

Important limits:

- **one board per organization**
- no subtasks
- no comments
- no attachments on the task itself (attachments live on documents when available)
- **no automation engine inside the Kanban** — business automations are a separate module (Orgaflow Scale), with on/off rules and status-based triggers in Settings
- no multiple assignees

Goal: **stay simple and avoid unbounded scope.**

------------------------------------------------------------------------

# 3. Kanban Concept

Each organization has a **single board** made of **stages (columns)**.

Example:

In progress | Waiting on client | Done

Each **task** belongs to one stage.

Moving a task means **changing `stage_id`**.

------------------------------------------------------------------------

# 4. Default Stage

Every organization starts with **one mandatory first column**.

### Behavior

- created automatically
- fixed position
- cannot be deleted
- cannot be reordered away from its slot
- can be renamed

### Default name

To do

The owner may rename it to e.g.:

- Inbox
- New orders
- Intake
- Leads

Structurally it remains the default entry column.

------------------------------------------------------------------------

# 5. Default Stage Rules

| Rule        | Behavior   |
| ----------- | ---------- |
| rename      | allowed    |
| delete      | forbidden  |
| reorder     | forbidden  |
| move tasks  | allowed    |
| change slug | allowed    |

This stage always stays at **position 0**.

------------------------------------------------------------------------

# 6. Custom Stages

Owner/admin can create additional stages.

### Who can manage stages

Users who are owner or admin may:

- create a stage
- rename a stage
- reorder stages
- delete a stage

------------------------------------------------------------------------

# 7. Deleting a Stage

A custom stage may be deleted only if:

- it has no tasks, or
- tasks are moved to another stage first

------------------------------------------------------------------------

# 8. Stage Limit

For UX, **recommended maximum: 10 stages**.

------------------------------------------------------------------------

# 9. Database Schema

## Table: `task_stages`

| Field             | Type      | Description              |
| ----------------- | --------- | ------------------------ |
| id                | uuid      | primary key              |
| organization_id   | uuid      | organization             |
| name              | text      | display name             |
| slug              | text      | stable slug              |
| position          | integer   | board order              |
| is_system         | boolean   | system-managed stage     |
| system_key        | text      | internal key             |
| created_by        | uuid      | creator user             |
| created_at        | timestamp | created                  |
| updated_at        | timestamp | updated                  |

------------------------------------------------------------------------

## Default stage seed

Example initial row:

- name: `To do`
- slug: `to-do`
- position: `0`
- is_system: `true`
- system_key: `default_entry`

------------------------------------------------------------------------

# 10. Tasks Table

## `tasks`

| Field             | Type      | Description     |
| ----------------- | --------- | --------------- |
| id                | uuid      | primary key     |
| organization_id   | uuid      | organization    |
| title             | text      | title           |
| description       | text      | description     |
| owner_id          | uuid      | assignee        |
| stage_id          | uuid      | current column  |
| priority          | enum      | priority        |
| due_date          | timestamp | optional due    |
| customer_id       | uuid      | optional        |
| invoice_id        | uuid      | optional        |
| created_at        | timestamp | created         |
| updated_at        | timestamp | updated         |

------------------------------------------------------------------------

# 11. Priority Enum

- low
- medium
- high

------------------------------------------------------------------------

# 12. Organization Bootstrap

When a new organization is created:

1. Create the default stage (`To do`, position `0`, `is_system`, `system_key = default_entry`).
2. Tasks created without an explicit stage should land in that stage.

------------------------------------------------------------------------

# 13. Backend Rules

Never use the stage **display name** for business logic.

### Wrong

`if (stage.name === "To do")`

### Correct

`if (stage.system_key === "default_entry")`

------------------------------------------------------------------------

# 14. API / Procedures

## Stages

- Create stage — `POST /task-stages`
- Rename — `PATCH /task-stages/:id`
- Reorder — `PATCH /task-stages/reorder`
- Delete — `DELETE /task-stages/:id`

Validations:

- cannot delete `is_system = true`
- cannot reorder away/move `is_system = true` incorrectly (product rules)

------------------------------------------------------------------------

## Tasks

- Create — `POST /tasks`
- Update — `PATCH /tasks/:id`
- Move — `PATCH /tasks/:id/move` with `{ stage_id }`

------------------------------------------------------------------------

# 15. UI Sketch

Each column is a stage; cards are tasks. Keep invalid actions hidden (e.g. no delete/move on the system default column).

------------------------------------------------------------------------

# 16. Column Actions

### Default stage

Allowed: rename.  
Blocked: delete, change position.

### Custom stage

Allowed: rename, reorder, delete (if empty or tasks moved).

------------------------------------------------------------------------

# 17. Recommended UX

Do not surface invalid actions (e.g. default stage: no delete, no move-left/right).

------------------------------------------------------------------------

# 18. Permissions (RBAC)

Suggested keys:

- `task:create`, `task:update`, `task:delete`, `task:view`
- `task_stage:create`, `task_stage:update`, `task_stage:delete`, `task_stage:reorder`

------------------------------------------------------------------------

# 19. Explicitly Out of Scope (v1)

Not included initially:

- subtasks, comments, attachments on tasks, activity log, notifications
- multiple boards, templates
- **in-board automations** (use the **Workflow Automations** module instead)

May be reconsidered later.

------------------------------------------------------------------------

# 20. Benefits

- better internal organization for customers
- higher retention
- natural bridge to CRM and billing flows
- longer time-on-platform

------------------------------------------------------------------------

# 21. Guiding Principle

Keep the module **simple and focused on basic workflow**. It must **not** grow into a full project-management system.

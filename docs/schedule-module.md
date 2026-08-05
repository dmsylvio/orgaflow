# Schedule module

Calendar and recurring service planning, with automatic invoice generation.
Available on **every plan, including Starter** — there is no `requirePlan` guard
and no feature flag on this module.

Menu entry sits right after **Tasks** (`src/server/iam/menu.ts`, group 1).

---

## 1. Why it exists

Service businesses (cleaning, maintenance, landscaping) plan the work in a
calendar and bill from what was actually delivered. Before this module the
product could only bill on a fixed clock (`recurring_invoice_templates`), which
has no idea whether the service happened.

The Schedule module closes that loop: the calendar is the source of truth for
what was delivered, and invoices are derived from it.

---

## 2. Data model

Two tables. Every occurrence is **materialized as its own row** rather than
computed on the fly, because each one carries state that a bare recurrence rule
cannot hold: was it completed, was it cancelled, which invoice covered it.

### `schedule_series`

The recurrence rule for a repeating appointment. Only exists for repeating
entries.

| Field group | Columns |
| --- | --- |
| Recurrence | `frequency` (daily/weekly/biweekly/monthly), `weekdays` (int array, 0 = Sunday), `month_day` |
| Window | `start_date`, `end_date`, `max_occurrences`, `generated_count` |
| Time | `start_time`, `end_time` (wall clock strings), `all_day`, `timezone` |
| Billing | `billing_mode`, `billing_trigger`, `billing_period`, `item_id`, `quantity`, `unit_price`, `due_days_offset` |
| Bookkeeping | `materialized_until`, `status` |

`timezone` is a **snapshot of the org timezone** taken at creation. Changing
the workspace timezone later must not silently move appointments that were
already agreed with a client.

### `appointments`

One calendar occurrence. `series_id IS NULL` means a one-off entry.

Pricing (`item_name`, `quantity`, `unit_price`, `total`) is **frozen per
occurrence**. Repricing the catalog never rewrites what was agreed for work
that already happened — the same rule estimates and invoices already follow.

Key columns beyond the obvious ones:

- `detached_from_series` — set when a single occurrence is edited on its own,
  so future series edits leave it alone.
- `invoice_id` / `invoiced_at` — the generated invoice.
- `billing_blocked_reason` / `billing_blocked_at` — see §5.

A unique index on `(series_id, starts_at)` makes materialization idempotent.
Postgres treats nulls as distinct, so one-off appointments are unaffected.

---

## 3. Recurrence

`src/server/services/schedule/expand-occurrences.ts` turns a rule into concrete
occurrences. It is deliberately free of `server-only` and of any DB import so it
stays directly testable.

**Timezone handling is the subtle part.** Calendar days are iterated as UTC
midnights used purely as day identifiers; only the final wall-clock time is
converted to an instant via `fromZonedTime` with the series timezone. This
means a 09:00 cleaning stays at 09:00 across a DST change, while the stored UTC
instant shifts by an hour — which is the correct behaviour.

> **Trap:** do not use date-fns helpers such as `getDaysInMonth` on these
> UTC-midnight dates. They resolve in the server's local time and will report
> the wrong month west of Greenwich. `daysInUtcMonth` exists for that reason.
> This produced a real bug during development: monthly-on-the-31st skipped
> February entirely and landed on the 28th of March.

Monthly rules clamp to the last valid day, so "the 31st" fires on Feb 28,
Apr 30, and so on.

---

## 4. Billing

Two independent axes, which is what makes the module useful.

### Mode — how many invoices

| Mode | Behaviour |
| --- | --- |
| `none` | Never billed; a plain calendar entry |
| `per_appointment` | One invoice per occurrence |
| `consolidated` | One invoice per billing period, one line per occurrence |

Consolidated is how most recurring-service companies actually bill: cleaning
three times a week, invoiced once a month. **The service cadence and the
billing cadence are separate fields** (`frequency` vs `billing_period`).

### Trigger — when it fires

| Trigger | Fires |
| --- | --- |
| `manual` | Never automatically; only the "Generate invoice" button |
| `on_completion` | When marked completed — **the default** |
| `period_end` | Consolidated only: when the period closes |
| `on_schedule` | **Retired.** Not selectable; see below |

`on_completion` is the default on purpose: invoicing work that was not
delivered creates disputes.

### Why `on_schedule` was pulled

It returned `true` unconditionally, with no date check, so the hourly job
invoiced every occurrence the moment it was materialized. A weekly series
therefore produced roughly thirteen invoices in a single pass — the whole
90-day horizon — each dated the day the job ran rather than the visit date, and
on Starter that consumed a quarter of the 50-invoice allowance immediately.
Deleting those future visits then left the invoices behind, charging the
customer for work that would never happen.

The value stays in the `schedule_billing_trigger` enum so existing rows remain
readable, but it is absent from `SELECTABLE_BILLING_TRIGGERS`, so the input
schema rejects it and the picker never shows it. `triggerFired` now treats it
exactly like `on_completion`, and the edit dialog coerces any stored value that
is no longer selectable. Reinstating it means giving it a real condition — for
example firing only once the visit is within a few days.

When a user marks an appointment completed, the router bills it inline
(`billAppointmentById`) so the invoice appears immediately instead of waiting
for the next cron pass.

Invoices get a due date from **Settings → Preferences → Schedule billing**
(`schedule_payment_term_days`, default **7**). Series may override that with
their own `due_days_offset`. When **Send schedule invoices automatically** is
on (default), the invoice is emailed and flipped to `SENT` if the customer has
an email on file; otherwise it stays `DRAFT` for manual send — same pattern as
recurring invoices. Automations run against the final status.

---

## 5. Plan limits — the important edge case

Starter allows **50 invoices**. A cleaning company on Starter using
`per_appointment` billing reaches that in under two months.

`createInvoiceFromLines` therefore **returns** the rejection instead of
throwing. The scheduler records `billing_blocked_reason` on the affected
appointments and moves on to the next org. Nothing is lost: after an upgrade
the appointments are still there, un-invoiced, and can be billed.

`schedule.listBillingIssues` exposes these for the UI.

---

## 6. Background job

Registered in `src/instrumentation.ts` at `30 * * * *` (hourly, offset from the
recurring-invoice job at `0 * * * *`).

`processSchedule()` does two passes:

1. **Materialize** — extends every active series to a rolling 90-day horizon.
   Runs first so appointments created in this pass can be billed in the same run.
2. **Bill** — per-appointment billing, then consolidated period closing.

Each pass is wrapped independently: a failure in one org's billing never stops
materialization for everyone else.

> Same caveat as the other cron jobs: `node-cron` runs **per instance**. On
> multiple instances the job runs multiple times. Materialization is safe
> because of the unique index; billing is guarded by the `invoice_id IS NULL`
> filter but is not transactionally locked. Move to a single-runner scheduler
> before scaling horizontally.

---

## 7. Permissions

New group `schedule` in `src/server/iam/permissions.ts`:

| Key | Notes |
| --- | --- |
| `schedule:view` | Opens the calendar |
| `schedule:view-prices` | Reveals the billable amount; `listRange` nulls `total` without it |
| `schedule:create` / `schedule:edit` / `schedule:delete` | CRUD |
| `schedule:bill` | Manual invoice generation; depends on `invoice:create` |

Automatic billing intentionally does **not** require `schedule:bill` — it is a
background action, not a user action. The permission gates the manual button
and billing configuration.

---

## 8. Files

| Path | Role |
| --- | --- |
| `src/server/db/schemas/schedule-series.ts`, `appointments.ts` | Tables |
| `src/server/services/schedule/expand-occurrences.ts` | Pure recurrence math |
| `src/server/services/schedule/materialize-appointments.ts` | Rolling-window generation |
| `src/server/services/schedule/bill-appointments.ts` | Both billing modes |
| `src/server/services/schedule/process-schedule.ts` | Cron entry point |
| `src/server/services/invoices/create-invoice-from-lines.ts` | Shared invoice creation |
| `src/server/trpc/routers/schedule.ts` | API |
| `src/schemas/schedule.ts` | Zod schemas + UI labels |
| `src/app/(private)/app/(home)/schedule/` | Month grid, dialogs |

---

## 9. Editing and deleting

Both actions take a **scope** when the occurrence belongs to a series:

| Scope | Effect |
| --- | --- |
| `one` | Touches only that occurrence. Editing sets `detached_from_series`, so later series-wide edits skip it |
| `future` | Applies from that occurrence onwards |

`deleteAppointment` with `future` also closes the series (`status = completed`
plus `end_date` set to the day before the cutoff). Without that the hourly
materializer would simply recreate everything that was just deleted.

**Invoices are never deleted.** Dropping a schedule entry must not erase what was
already billed, so `deleteAppointment` no longer refuses invoiced rows — it
removes the appointment and leaves the invoice standing. `updateAppointment`
still refuses to edit a single invoiced occurrence (the billed figures would stop
matching), and in `future` scope it skips invoiced rows and reports how many via
`skippedInvoiced`.

### The `on_schedule` trap

`on_schedule` fires as soon as an occurrence exists, so a series billed that way
already has invoices for occurrences up to 90 days out. Deleting "this and all
future" therefore strands invoices for visits that will never happen — the
customer is still charged.

Nothing in the data model can decide that for the user: voiding the invoice may
be right (visit cancelled) or wrong (deposit already taken). So `previewDelete`
counts how many of the affected occurrences carry an invoice and the confirmation
states it plainly, pointing at Invoices to void them. Deleting stays possible;
doing it blindly does not.

---

## 10. Conflict detection

`checkConflicts` returns appointments overlapping the slot being edited. It is
**advisory only**: with no staff assignment in the model, two crews working the
same hour for different customers is legitimate, so blocking would be wrong. The
dialog warns on the first save attempt and lets the second one through.

For a repeating slot the first `CONFLICT_PROBE_OCCURRENCES` occurrences are
expanded and probed, not the whole series — a weekly clash repeats identically,
so a sample is enough to surface it.

---

## 11. Known gaps

- Only **month view** ships. Week and agenda/list views are not implemented.
- The **recurrence pattern** itself cannot be edited after creation. Editing an
  occurrence with `future` scope rewrites content and times across the series but
  leaves frequency and weekdays alone; changing those means deleting and
  recreating.
- One catalog item per appointment. Multi-line appointments would need an
  `appointment_items` table; nothing in the current model blocks that.
- **Staff assignment** is not exposed. `assigned_user_id` exists on both tables
  and is propagated from series to occurrence, but no UI writes it — the field
  was removed from the form. Surfacing it later needs no migration.
- Taxes and discounts are not applied to generated invoices (subtotal = total).
- `process-recurring-invoices.ts` still has its own copy of the invoice-creation
  logic. It should move to `createInvoiceFromLines`, but that is a live billing
  path with no test coverage, so it was left alone deliberately.
- No customer-facing self-booking. "Schedule" was chosen over "Bookings" partly
  to keep that name free.

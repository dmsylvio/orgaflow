"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import { AlertTriangle, CalendarDays, Repeat } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomerPicker } from "@/components/ui/customer-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ItemPicker } from "@/components/ui/item-picker";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  BILLING_PERIOD_LABELS,
  BILLING_PERIODS,
  BILLING_TRIGGER_LABELS,
  SCHEDULE_FREQUENCIES,
  SCHEDULE_FREQUENCY_LABELS,
  SELECTABLE_BILLING_TRIGGERS,
} from "@/schemas/schedule";
import { useTRPC } from "@/trpc/client";

export function AppointmentDialog({
  open,
  onOpenChange,
  initialDate,
  appointmentId = null,
  timezone,
  onSaved,
}: AppointmentDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = appointmentId !== null;

  const [form, setForm] = useState<FormState>(() => emptyForm(initialDate));
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictsAcknowledged, setConflictsAcknowledged] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  const { data: existing, isPending: loadingExisting } = useQuery({
    ...trpc.schedule.getById.queryOptions({ id: appointmentId ?? "" }),
    enabled: open && isEditing,
  });

  // Same query the item picker uses, so this is served from cache.
  const { data: catalogItems = [] } = useQuery(trpc.items.list.queryOptions());

  // Creating: reopening on a different day starts from that day.
  useEffect(() => {
    if (!open || isEditing) return;
    setForm(emptyForm(initialDate));
    setConflicts([]);
    setConflictsAcknowledged(false);
  }, [open, isEditing, initialDate]);

  // Editing: hydrate once the row arrives.
  useEffect(() => {
    if (!open || !existing) return;
    setForm(formFromAppointment(existing, timezone));
    setConflicts([]);
    setConflictsAcknowledged(false);
  }, [open, existing, timezone]);

  function resetConflictState() {
    setConflicts([]);
    setConflictsAcknowledged(false);
  }

  const createAppointment = useMutation(
    trpc.schedule.createAppointment.mutationOptions({
      onSuccess: () => {
        toast.success("Appointment scheduled.");
        invalidate();
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const createSeries = useMutation(
    trpc.schedule.createSeries.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          `Series created with ${result.occurrencesCreated} appointments.`,
        );
        invalidate();
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.listSeries.queryKey(),
        });
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateAppointment = useMutation(
    trpc.schedule.updateAppointment.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          result.updated > 1
            ? `${result.updated} appointments updated.`
            : "Appointment updated.",
        );
        if (result.skippedInvoiced > 0) {
          toast.info(
            `${result.skippedInvoiced} already invoiced and left unchanged.`,
          );
        }
        invalidate();
        onSaved?.();
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: trpc.schedule.listRange.queryKey(),
    });
  }

  const isSaving =
    createAppointment.isPending ||
    createSeries.isPending ||
    updateAppointment.isPending;
  const isBusy = isSaving || checkingConflicts;
  const needsWeekdays =
    form.repeats &&
    (form.frequency === "weekly" || form.frequency === "biweekly");
  const isBillable = form.billingMode !== "none";
  const belongsToSeries = isEditing && Boolean(existing?.seriesId);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    // A different slot invalidates whatever was warned about before.
    if (TIMING_FIELDS.has(key)) resetConflictState();
  }

  /**
   * Picking a service pulls its catalog price in. It stays editable so a one-off
   * adjustment does not require changing the catalog.
   */
  function selectItem(itemId: string) {
    const item = catalogItems.find((candidate) => candidate.id === itemId);

    setForm((current) => ({
      ...current,
      itemId,
      unitPrice: item ? trimDecimal(item.price) : current.unitPrice,
    }));
  }

  function setBillingMode(mode: FormState["billingMode"]) {
    setForm((current) => ({
      ...current,
      billingMode: mode,
      // Consolidated cannot use the one-off triggers, and vice versa.
      billingTrigger: mode === "consolidated" ? "period_end" : "on_completion",
    }));
  }

  function toggleWeekday(day: number) {
    setForm((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((d) => d !== day)
        : [...current.weekdays, day].sort((a, b) => a - b),
    }));
    resetConflictState();
  }

  function setRepeats(repeats: boolean) {
    setForm((current) => ({
      ...current,
      repeats,
      // Consolidated billing only exists for series.
      billingMode:
        !repeats && current.billingMode === "consolidated"
          ? "per_appointment"
          : current.billingMode,
      billingTrigger:
        !repeats && current.billingTrigger === "period_end"
          ? "on_completion"
          : current.billingTrigger,
    }));
    resetConflictState();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Give the appointment a title.");
      return;
    }
    if (isBillable && !form.customerId) {
      toast.error("Pick a customer to bill this appointment.");
      return;
    }
    // Only enforced while creating: an existing series carries its own pattern.
    if (!isEditing && needsWeekdays && form.weekdays.length === 0) {
      toast.error("Pick at least one weekday.");
      return;
    }

    // First attempt only warns; a second click goes through regardless.
    if (!conflictsAcknowledged) {
      setCheckingConflicts(true);
      try {
        const found = await queryClient.fetchQuery(
          trpc.schedule.checkConflicts.queryOptions({
            date: form.date,
            allDay: form.allDay,
            startTime: form.allDay ? null : form.startTime,
            endTime: form.allDay ? null : form.endTime,
            // Editing a single occurrence only clashes on its own date; a
            // series-wide edit has to probe the whole pattern.
            repeats: isEditing
              ? belongsToSeries && form.scope === "future"
              : form.repeats,
            frequency: form.repeats ? form.frequency : null,
            weekdays: needsWeekdays ? form.weekdays : null,
            endDate: form.endDate || null,
            excludeAppointmentId: appointmentId,
            excludeSeriesId: existing?.seriesId ?? null,
          }),
        );

        if (found.length > 0) {
          setConflicts(found);
          setConflictsAcknowledged(true);
          return;
        }
      } catch {
        // A failed probe must never stop someone from scheduling.
      } finally {
        setCheckingConflicts(false);
      }
    }

    const shared = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      customerId: form.customerId || null,
      allDay: form.allDay,
      startTime: form.allDay ? null : form.startTime,
      endTime: form.allDay ? null : form.endTime,
      billingMode: form.billingMode,
      billingTrigger: form.billingTrigger,
      itemId: isBillable ? form.itemId || null : null,
      quantity: form.quantity || "1",
      unitPrice: form.unitPrice || "0",
    };

    if (isEditing && appointmentId) {
      updateAppointment.mutate({
        ...shared,
        id: appointmentId,
        date: form.date,
        scope: belongsToSeries ? form.scope : "one",
      });
      return;
    }

    if (!form.repeats) {
      createAppointment.mutate({ ...shared, date: form.date });
      return;
    }

    createSeries.mutate({
      ...shared,
      frequency: form.frequency,
      weekdays: needsWeekdays ? form.weekdays : null,
      monthDay:
        form.frequency === "monthly" ? Number(form.date.slice(8, 10)) : null,
      startDate: form.date,
      endDate: form.endDate || null,
      maxOccurrences: null,
      billingPeriod:
        form.billingMode === "consolidated" ? form.billingPeriod : null,
      dueDaysOffset: form.dueDaysOffset ? Number(form.dueDaysOffset) : null,
    });
  }

  const submitLabel =
    conflicts.length > 0
      ? "Schedule anyway"
      : isEditing
        ? belongsToSeries && form.scope === "future"
          ? "Save all"
          : "Save"
        : form.repeats
          ? "Create series"
          : "Schedule";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl">
              {isEditing ? "Edit appointment" : "New appointment"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Change this visit, or apply the change to every future one."
                : "Book a visit and decide how it should turn into an invoice."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="min-h-0 flex-1 overflow-y-auto">
            {isEditing && loadingExisting ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="h-5 w-5 text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-7">
                {belongsToSeries ? (
                  <Section label="Apply changes to">
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                      <SegmentButton
                        active={form.scope === "one"}
                        onClick={() => update("scope", "one")}
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Only this one"
                      />
                      <SegmentButton
                        active={form.scope === "future"}
                        onClick={() => update("scope", "future")}
                        icon={<Repeat className="h-4 w-4" />}
                        label="This and future"
                      />
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {form.scope === "one"
                        ? "This visit is detached from the series and later edits to the series will leave it alone."
                        : "Every later visit in this series is updated. Visits already invoiced keep their billed values."}
                    </p>
                  </Section>
                ) : null}

                {conflicts.length > 0 ? (
                  <ConflictWarning
                    conflicts={conflicts}
                    timezone={timezone}
                    repeats={form.repeats}
                  />
                ) : null}

                <div className="grid gap-x-10 gap-y-7 lg:grid-cols-2">
                  {/* ---- Left column: what and when ---- */}
                  <div className="space-y-7">
                    <div className="space-y-2">
                      <Label htmlFor="appointment-title">Title</Label>
                      <Input
                        id="appointment-title"
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="Standard cleaning"
                        required
                      />
                    </div>

                    <Section label="When">
                      {isEditing ? null : (
                        <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                          <SegmentButton
                            active={!form.repeats}
                            onClick={() => setRepeats(false)}
                            icon={<CalendarDays className="h-4 w-4" />}
                            label="One time"
                          />
                          <SegmentButton
                            active={form.repeats}
                            onClick={() => setRepeats(true)}
                            icon={<Repeat className="h-4 w-4" />}
                            label="Repeats"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="appointment-date">
                            {form.repeats && !isEditing ? "Starts" : "Date"}
                          </Label>
                          <Input
                            id="appointment-date"
                            type="date"
                            value={form.date}
                            onChange={(e) => update("date", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="appointment-start">Start</Label>
                          <Input
                            id="appointment-start"
                            type="time"
                            value={form.startTime}
                            onChange={(e) =>
                              update("startTime", e.target.value)
                            }
                            disabled={form.allDay}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="appointment-end">End</Label>
                          <Input
                            id="appointment-end"
                            type="time"
                            value={form.endTime}
                            onChange={(e) => update("endTime", e.target.value)}
                            disabled={form.allDay}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5">
                        <Label
                          htmlFor="appointment-all-day"
                          className="font-normal text-muted-foreground"
                        >
                          All day
                        </Label>
                        <Switch
                          id="appointment-all-day"
                          checked={form.allDay}
                          onCheckedChange={(checked) =>
                            update("allDay", checked)
                          }
                        />
                      </div>

                      {isEditing && belongsToSeries ? (
                        <div className="space-y-3 border-t border-border pt-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                              <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                              {describeFrequency(form)}
                            </span>
                            {form.endDate ? (
                              <span className="text-xs text-muted-foreground">
                                until {form.endDate}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {WEEKDAYS.map((weekday) => {
                              const selected = form.weekdays.includes(
                                weekday.value,
                              );
                              return (
                                <span
                                  key={weekday.value}
                                  className={cn(
                                    "flex h-9 w-11 items-center justify-center rounded-lg text-xs font-semibold uppercase tracking-wide",
                                    selected
                                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                      : "bg-secondary/50 text-muted-foreground/50",
                                  )}
                                >
                                  {weekday.short}
                                </span>
                              );
                            })}
                          </div>

                          <p className="text-xs leading-relaxed text-muted-foreground">
                            The repeat pattern cannot be changed here. To move
                            the visits to other weekdays, delete the future ones
                            and create a new series.
                          </p>
                        </div>
                      ) : null}

                      {form.repeats && !isEditing ? (
                        <div className="space-y-4 border-t border-border pt-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="appointment-frequency">
                                How often
                              </Label>
                              <NativeSelect
                                id="appointment-frequency"
                                value={form.frequency}
                                onChange={(e) =>
                                  update(
                                    "frequency",
                                    e.target.value as FormState["frequency"],
                                  )
                                }
                              >
                                {SCHEDULE_FREQUENCIES.map((frequency) => (
                                  <option key={frequency} value={frequency}>
                                    {SCHEDULE_FREQUENCY_LABELS[frequency]}
                                  </option>
                                ))}
                              </NativeSelect>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="appointment-end-date">
                                Until{" "}
                                <span className="text-muted-foreground">
                                  (optional)
                                </span>
                              </Label>
                              <Input
                                id="appointment-end-date"
                                type="date"
                                value={form.endDate}
                                onChange={(e) =>
                                  update("endDate", e.target.value)
                                }
                              />
                            </div>
                          </div>

                          {needsWeekdays ? (
                            <fieldset>
                              <legend className="mb-2 text-sm font-medium">
                                Repeat on
                              </legend>
                              <div className="flex flex-wrap gap-1.5">
                                {WEEKDAYS.map((weekday) => {
                                  const selected = form.weekdays.includes(
                                    weekday.value,
                                  );
                                  return (
                                    <button
                                      key={weekday.value}
                                      type="button"
                                      aria-pressed={selected}
                                      onClick={() =>
                                        toggleWeekday(weekday.value)
                                      }
                                      className={cn(
                                        "h-9 w-11 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        selected
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                                      )}
                                    >
                                      {weekday.short}
                                    </button>
                                  );
                                })}
                              </div>
                            </fieldset>
                          ) : null}
                        </div>
                      ) : null}
                    </Section>

                    <Section label="Who & where">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="appointment-customer">
                            Customer{" "}
                            {!isBillable ? (
                              <span className="text-muted-foreground">
                                (optional)
                              </span>
                            ) : null}
                          </Label>
                          <CustomerPicker
                            id="appointment-customer"
                            value={form.customerId}
                            onValueChange={(id) => update("customerId", id)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="appointment-location">Location</Label>
                          <Input
                            id="appointment-location"
                            value={form.location}
                            onChange={(e) => update("location", e.target.value)}
                            placeholder="123 Main St, Apt 4"
                          />
                        </div>
                      </div>
                    </Section>
                  </div>

                  {/* ---- Right column: money and notes ---- */}
                  <div className="space-y-7">
                    <Section label="Invoicing">
                      <div className="space-y-2">
                        <BillingCard
                          name="billing-mode"
                          checked={form.billingMode === "none"}
                          onSelect={() => setBillingMode("none")}
                          title="No invoice"
                          hint="Just a calendar entry"
                        />
                        <BillingCard
                          name="billing-mode"
                          checked={form.billingMode === "per_appointment"}
                          onSelect={() => setBillingMode("per_appointment")}
                          title="Per visit"
                          hint="One invoice every time it happens"
                        />
                        {form.repeats ? (
                          <BillingCard
                            name="billing-mode"
                            checked={form.billingMode === "consolidated"}
                            onSelect={() => setBillingMode("consolidated")}
                            title="Per period"
                            hint="All visits grouped on one invoice"
                          />
                        ) : null}
                      </div>

                      {isBillable ? (
                        <div className="space-y-4 rounded-xl bg-secondary/40 p-4">
                          <div className="space-y-2">
                            <Label htmlFor="appointment-item">Service</Label>
                            <ItemPicker
                              id="appointment-item"
                              value={form.itemId}
                              onValueChange={selectItem}
                              placeholder="Select a service"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="appointment-quantity">
                                Quantity
                              </Label>
                              <Input
                                id="appointment-quantity"
                                inputMode="decimal"
                                value={form.quantity}
                                onChange={(e) =>
                                  update("quantity", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="appointment-price">Price</Label>
                              <Input
                                id="appointment-price"
                                inputMode="decimal"
                                value={form.unitPrice}
                                onChange={(e) =>
                                  update("unitPrice", e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="appointment-trigger">
                                Invoice when
                              </Label>
                              <NativeSelect
                                id="appointment-trigger"
                                value={form.billingTrigger}
                                onChange={(e) =>
                                  update(
                                    "billingTrigger",
                                    e.target
                                      .value as FormState["billingTrigger"],
                                  )
                                }
                              >
                                {availableTriggers(form.billingMode).map(
                                  (trigger) => (
                                    <option key={trigger} value={trigger}>
                                      {BILLING_TRIGGER_LABELS[trigger]}
                                    </option>
                                  ),
                                )}
                              </NativeSelect>
                            </div>

                            {form.billingMode === "consolidated" ? (
                              <div className="space-y-2">
                                <Label htmlFor="appointment-period">
                                  Period
                                </Label>
                                <NativeSelect
                                  id="appointment-period"
                                  value={form.billingPeriod}
                                  onChange={(e) =>
                                    update(
                                      "billingPeriod",
                                      e.target
                                        .value as FormState["billingPeriod"],
                                    )
                                  }
                                >
                                  {BILLING_PERIODS.map((period) => (
                                    <option key={period} value={period}>
                                      {BILLING_PERIOD_LABELS[period]}
                                    </option>
                                  ))}
                                </NativeSelect>
                              </div>
                            ) : null}
                          </div>

                          {form.billingMode === "consolidated" ? (
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              Every visit in the period lands on a single
                              invoice, one line each. It is issued once the
                              period closes.
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </Section>

                    <Section label="Notes">
                      <Textarea
                        id="appointment-notes"
                        aria-label="Notes"
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        rows={4}
                        placeholder="Gate code, supplies to bring, parking…"
                      />
                    </Section>
                  </div>
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConflictWarning({
  conflicts,
  timezone,
  repeats,
}: ConflictWarningProps) {
  return (
    <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <div className="flex gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-amber-900">
            {conflicts.length === 1
              ? "This slot overlaps another appointment"
              : `This slot overlaps ${conflicts.length} appointments`}
          </p>
          <ul className="space-y-1 text-sm text-amber-900/80">
            {conflicts.map((conflict) => (
              <li key={conflict.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium tabular-nums">
                  {formatInTimeZone(conflict.startsAt, timezone, "d MMM")}
                  {conflict.allDay
                    ? " · All day"
                    : ` · ${formatInTimeZone(conflict.startsAt, timezone, "HH:mm")}–${formatInTimeZone(conflict.endsAt, timezone, "HH:mm")}`}
                </span>
                <span className="truncate">
                  {conflict.customerName ?? conflict.title}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-amber-900/70">
            {repeats
              ? "Only the first few repeats were checked. Continue if another team covers these."
              : "Continue if another team covers this slot."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </h3>
      {children}
    </section>
  );
}

function SegmentButton({ active, onClick, icon, label }: SegmentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function BillingCard({
  name,
  checked,
  onSelect,
  title,
  hint,
}: BillingCardProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-baseline gap-2 rounded-xl px-3.5 py-2.5 ring-1 transition-all",
        checked
          ? "bg-primary/5 ring-2 ring-primary"
          : "bg-card ring-border hover:bg-secondary/50",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </label>
  );
}

function availableTriggers(
  billingMode: FormState["billingMode"],
): FormState["billingTrigger"][] {
  if (billingMode === "consolidated") {
    return ["period_end", "on_completion"];
  }
  return ["on_completion", "manual"];
}

/** Rows saved with a trigger that is no longer offered fall back to a valid one. */
function coerceTrigger(value: string): FormState["billingTrigger"] {
  return SELECTABLE_BILLING_TRIGGERS.includes(
    value as FormState["billingTrigger"],
  )
    ? (value as FormState["billingTrigger"])
    : "on_completion";
}

function emptyForm(date: string): FormState {
  return {
    title: "",
    description: "",
    location: "",
    customerId: "",
    date,
    allDay: false,
    startTime: "09:00",
    endTime: "11:00",
    repeats: false,
    frequency: "weekly",
    weekdays: [],
    endDate: "",
    billingMode: "none",
    billingTrigger: "on_completion",
    billingPeriod: "monthly",
    itemId: "",
    quantity: "1",
    unitPrice: "0",
    dueDaysOffset: "",
    scope: "one",
  };
}

function formFromAppointment(
  appointment: EditableAppointment,
  timezone: string,
): FormState {
  return {
    ...emptyForm(
      formatInTimeZone(appointment.startsAt, timezone, "yyyy-MM-dd"),
    ),
    title: appointment.title,
    description: appointment.description ?? "",
    location: appointment.location ?? "",
    customerId: appointment.customerId ?? "",
    allDay: appointment.allDay,
    startTime: formatInTimeZone(appointment.startsAt, timezone, "HH:mm"),
    endTime: formatInTimeZone(appointment.endsAt, timezone, "HH:mm"),
    // Carried over from the series so the recurrence stays visible while editing.
    repeats: appointment.seriesId !== null,
    frequency:
      (appointment.seriesFrequency as FormState["frequency"]) ?? "weekly",
    weekdays: appointment.seriesWeekdays ?? [],
    endDate: appointment.seriesEndDate ?? "",
    billingMode: appointment.billingMode as FormState["billingMode"],
    billingTrigger: coerceTrigger(appointment.billingTrigger),
    billingPeriod:
      (appointment.seriesBillingPeriod as FormState["billingPeriod"]) ??
      "monthly",
    itemId: appointment.itemId ?? "",
    quantity: trimDecimal(appointment.quantity),
    unitPrice: trimDecimal(appointment.unitPrice),
    scope: "one",
  };
}

function describeFrequency(form: FormState): string {
  const frequency = SCHEDULE_FREQUENCY_LABELS[form.frequency];
  if (form.weekdays.length === 0) return frequency;

  const days = form.weekdays
    .map((value) => WEEKDAYS.find((day) => day.value === value)?.short)
    .filter(Boolean)
    .join(", ");

  return `${frequency} · ${days}`;
}

/** `1.000` reads better as `1` in a text field. */
function trimDecimal(value: string | null): string {
  if (!value) return "0";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : value;
}

/** Changing any of these makes a previous conflict check meaningless. */
const TIMING_FIELDS = new Set<keyof FormState>([
  "date",
  "startTime",
  "endTime",
  "allDay",
  "endDate",
  "frequency",
]);

const WEEKDAYS = [
  { value: 0, short: "Sun" },
  { value: 1, short: "Mon" },
  { value: 2, short: "Tue" },
  { value: 3, short: "Wed" },
  { value: 4, short: "Thu" },
  { value: 5, short: "Fri" },
  { value: 6, short: "Sat" },
] as const;

type FormState = {
  title: string;
  description: string;
  location: string;
  customerId: string;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  repeats: boolean;
  frequency: (typeof SCHEDULE_FREQUENCIES)[number];
  weekdays: number[];
  endDate: string;
  billingMode: "none" | "per_appointment" | "consolidated";
  billingTrigger: (typeof SELECTABLE_BILLING_TRIGGERS)[number];
  billingPeriod: (typeof BILLING_PERIODS)[number];
  itemId: string;
  quantity: string;
  unitPrice: string;
  dueDaysOffset: string;
  /** Only meaningful while editing an occurrence that belongs to a series. */
  scope: "one" | "future";
};

type EditableAppointment = {
  seriesId: string | null;
  customerId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  startsAt: Date;
  endsAt: Date;
  billingMode: string;
  billingTrigger: string;
  itemId: string | null;
  quantity: string;
  unitPrice: string;
  seriesFrequency: string | null;
  seriesWeekdays: number[] | null;
  seriesEndDate: string | null;
  seriesBillingPeriod: string | null;
};

type Conflict = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  customerName: string | null;
};

interface ConflictWarningProps {
  conflicts: Conflict[];
  timezone: string;
  repeats: boolean;
}

interface SectionProps {
  label: string;
  children: ReactNode;
}

interface SegmentButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

interface BillingCardProps {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `YYYY-MM-DD` the dialog opens on when creating. */
  initialDate: string;
  /** When set, the dialog edits this appointment instead of creating one. */
  appointmentId?: string | null;
  timezone: string;
  onSaved?: () => void;
}

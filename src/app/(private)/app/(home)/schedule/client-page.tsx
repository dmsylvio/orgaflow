"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Repeat,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import NextLink from "next/link";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS_LABELS } from "@/schemas/schedule";
import { useTRPC } from "@/trpc/client";
import { AppointmentDialog } from "./appointment-dialog";

export default function ScheduleClientPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: meta } = useQuery(trpc.schedule.getFormMeta.queryOptions());
  const timezone = meta?.timezone ?? "UTC";
  const currency = (meta?.defaultCurrency ?? null) as CurrencyFormat;

  const [cursor, setCursor] = useState<MonthCursor>(() =>
    currentMonth(timezone),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState(() => todayIn(timezone));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const grid = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const range = useMemo(() => {
    const first = grid[0] ?? todayIn(timezone);
    const last = grid[grid.length - 1] ?? first;
    return {
      from: fromZonedTime(`${first}T00:00:00`, timezone),
      to: fromZonedTime(`${addDays(last, 1)}T00:00:00`, timezone),
    };
  }, [grid, timezone]);

  const { data: appointments = [], isFetching } = useQuery(
    trpc.schedule.listRange.queryOptions({ from: range.from, to: range.to }),
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appointment of appointments) {
      const day = formatInTimeZone(
        appointment.startsAt,
        timezone,
        "yyyy-MM-dd",
      );
      const list = map.get(day) ?? [];
      list.push(appointment);
      map.set(day, list);
    }
    return map;
  }, [appointments, timezone]);

  // Only the days inside the visible month count towards the summary, so
  // padding days from adjacent months never inflate the numbers.
  const summary = useMemo(
    () => summarize(appointments, timezone, cursor),
    [appointments, timezone, cursor],
  );

  const selected = appointments.find((a) => a.id === selectedId) ?? null;
  const today = todayIn(timezone);

  function openCreate(day: string) {
    setCreateDate(day);
    setCreateOpen(true);
  }

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const next = new Date(Date.UTC(current.year, current.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  const monthLabel = formatInTimeZone(
    new Date(Date.UTC(cursor.year, cursor.month, 1, 12)),
    "UTC",
    "MMMM",
  );

  return (
    <PageShell
      title="Schedule"
      description="Plan appointments and let Orgaflow raise the invoices that follow."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile label="Scheduled" value={String(summary.scheduled)} />
            <SummaryTile label="Completed" value={String(summary.completed)} />
            <SummaryTile
              label="Invoiced"
              value={
                summary.hasPrices
                  ? formatCurrencyDisplay(summary.invoiced, currency)
                  : "—"
              }
            />
            <SummaryTile
              label="Awaiting invoice"
              value={
                summary.hasPrices
                  ? formatCurrencyDisplay(summary.pending, currency)
                  : "—"
              }
              accent={summary.hasPrices && Number(summary.pending) > 0}
            />
          </div>

          <Button type="button" onClick={() => openCreate(today)}>
            <Plus className="h-4 w-4" />
            New appointment
          </Button>
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {monthLabel}
              </h2>
              <span className="text-xl font-light tabular-nums text-muted-foreground">
                {cursor.year}
              </span>
              {isFetching ? (
                <Spinner className="h-3.5 w-3.5 text-muted-foreground" />
              ) : null}
            </div>

            <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCursor(currentMonth(timezone))}
                className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
            <div className="grid grid-cols-7">
              {WEEKDAY_HEADERS.map((label) => (
                <div
                  key={label}
                  className="border-b border-border bg-card px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-border">
              {grid.map((day) => {
                const dayAppointments = byDay.get(day) ?? [];
                const isCurrentMonth =
                  Number(day.slice(5, 7)) === cursor.month + 1;
                const isToday = day === today;

                return (
                  <div
                    key={day}
                    className="group relative flex min-h-36 flex-col bg-card p-2.5 transition-colors"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums",
                          isToday && "bg-primary text-primary-foreground",
                          !isToday && isCurrentMonth && "text-foreground",
                          !isToday &&
                            !isCurrentMonth &&
                            "text-muted-foreground/60",
                        )}
                      >
                        {Number(day.slice(8, 10))}
                      </span>

                      <button
                        type="button"
                        onClick={() => openCreate(day)}
                        aria-label={`Add appointment on ${day}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-primary hover:text-primary-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <ul className="flex flex-col gap-1.5">
                      {dayAppointments.slice(0, 3).map((appointment) => (
                        <li key={appointment.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(appointment.id)}
                            className={cn(
                              "flex w-full items-start gap-1.5 rounded-md border-l-2 py-1.5 pl-2 pr-1.5 text-left transition-colors",
                              statusAccent(appointment.status),
                            )}
                          >
                            {!appointment.allDay ? (
                              <span className="shrink-0 pt-px text-[10px] font-semibold tabular-nums opacity-70">
                                {formatInTimeZone(
                                  appointment.startsAt,
                                  timezone,
                                  "HH:mm",
                                )}
                              </span>
                            ) : null}
                            <span className="truncate text-[11px] font-medium leading-4">
                              {appointment.customerName}
                            </span>
                          </button>
                        </li>
                      ))}

                      {dayAppointments.length > 3 ? (
                        <li>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedId(dayAppointments[3]?.id ?? null)
                            }
                            className="w-full rounded-md px-2 py-1 text-left text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            +{dayAppointments.length - 3} more
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {appointments.length === 0 && !isFetching ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
              <CalendarPlus className="h-8 w-8 text-muted-foreground/60" />
              <div>
                <p className="text-sm font-medium">
                  Nothing scheduled this month
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a visit and choose whether it should invoice itself.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openCreate(today)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New appointment
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <AppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialDate={createDate}
        timezone={timezone}
      />

      <AppointmentDialog
        open={editingId !== null}
        onOpenChange={(open) => !open && setEditingId(null)}
        initialDate={createDate}
        appointmentId={editingId}
        timezone={timezone}
        onSaved={() => setSelectedId(null)}
      />

      <AppointmentDetailDialog
        appointment={selected}
        timezone={timezone}
        currency={currency}
        onClose={() => setSelectedId(null)}
        onEdit={() => setEditingId(selectedId)}
        onChanged={() => {
          void queryClient.invalidateQueries({
            queryKey: trpc.schedule.listRange.queryKey(),
          });
        }}
      />
    </PageShell>
  );
}

function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="w-full min-w-0 p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="mb-8" />
      {children}
    </div>
  );
}

function SummaryTile({ label, value, accent }: SummaryTileProps) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function AppointmentDetailDialog({
  appointment,
  timezone,
  currency,
  onClose,
  onEdit,
  onChanged,
}: AppointmentDetailDialogProps) {
  const trpc = useTRPC();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteScope, setDeleteScope] = useState<DeleteScope>("one");

  const setStatus = useMutation(
    trpc.schedule.setStatus.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          result.billing
            ? "Marked completed and invoiced."
            : "Appointment updated.",
        );
        onChanged();
        onClose();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const billNow = useMutation(
    trpc.schedule.billNow.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          result.alreadyBilled
            ? "This appointment already has an invoice."
            : "Invoice created.",
        );
        onChanged();
        onClose();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const remove = useMutation(
    trpc.schedule.deleteAppointment.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          result.deleted > 1
            ? `${result.deleted} appointments deleted.`
            : "Appointment deleted.",
        );
        setConfirmingDelete(false);
        onChanged();
        onClose();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const isRecurring = Boolean(appointment?.seriesId);

  // Loaded only while confirming, so the dialog can state exactly what goes.
  const { data: preview } = useQuery({
    ...trpc.schedule.previewDelete.queryOptions({
      id: appointment?.id ?? "",
      scope: isRecurring ? deleteScope : "one",
    }),
    enabled: confirmingDelete && appointment !== null,
  });

  if (!appointment) return null;

  const completed = appointment.status === "completed";
  const canBill = !appointment.invoiceId && appointment.billingMode !== "none";

  const isBusy = setStatus.isPending || billNow.isPending || remove.isPending;
  const statusLabel =
    APPOINTMENT_STATUS_LABELS[
      appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS
    ] ?? appointment.status;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                statusPill(appointment.status),
              )}
            >
              {statusLabel}
            </span>
            {appointment.seriesId ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Repeat className="h-3 w-3" />
                Recurring
              </span>
            ) : null}
          </div>

          <DialogTitle className="mt-3 text-xl">
            {appointment.title}
          </DialogTitle>

          <DialogDescription className="mt-1">
            {appointment.allDay
              ? `${formatInTimeZone(appointment.startsAt, timezone, "EEEE, d MMMM yyyy")} · All day`
              : `${formatInTimeZone(appointment.startsAt, timezone, "EEEE, d MMMM yyyy")} · ${formatInTimeZone(appointment.startsAt, timezone, "HH:mm")}–${formatInTimeZone(appointment.endsAt, timezone, "HH:mm")}`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          <dl className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-border">
            {appointment.customerName ? (
              <DetailRow
                icon={<User className="h-4 w-4" />}
                label="Customer"
                value={appointment.customerName}
              />
            ) : null}

            {appointment.location ? (
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={appointment.location}
              />
            ) : null}

            {appointment.total && appointment.billingMode !== "none" ? (
              <DetailRow
                icon={<Receipt className="h-4 w-4" />}
                label="Amount"
                value={formatCurrencyDisplay(appointment.total, currency)}
              />
            ) : null}

            {appointment.invoiceNumber ? (
              <DetailRow
                icon={<Receipt className="h-4 w-4" />}
                label="Invoice"
                value={
                  <NextLink
                    href={`/app/invoices/${appointment.invoiceId}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {appointment.invoiceNumber}
                  </NextLink>
                }
              />
            ) : null}
          </dl>

          {appointment.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {appointment.description}
            </p>
          ) : null}

          {appointment.billingBlockedReason ? (
            <div className="flex gap-2.5 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">
                {appointment.billingBlockedReason}
              </p>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="shrink-0 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                aria-label="More actions"
                className="mr-auto px-2 text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {canBill && !completed ? (
                <DropdownMenuItem
                  onSelect={() => billNow.mutate({ id: appointment.id })}
                >
                  <Receipt className="h-4 w-4" />
                  Generate invoice now
                </DropdownMenuItem>
              ) : null}

              {completed ? (
                <DropdownMenuItem
                  onSelect={() =>
                    setStatus.mutate({
                      id: appointment.id,
                      status: "scheduled",
                    })
                  }
                >
                  <Undo2 className="h-4 w-4" />
                  Reopen appointment
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => {
                  setDeleteScope("one");
                  setConfirmingDelete(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={onEdit}
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>

          {!completed ? (
            <Button
              type="button"
              size="sm"
              disabled={isBusy}
              onClick={() =>
                setStatus.mutate({ id: appointment.id, status: "completed" })
              }
            >
              {setStatus.isPending ? (
                <Spinner className="mr-1.5 h-4 w-4" />
              ) : (
                <Check className="mr-1.5 h-4 w-4" />
              )}
              Mark completed
            </Button>
          ) : canBill ? (
            <Button
              type="button"
              size="sm"
              disabled={isBusy}
              onClick={() => billNow.mutate({ id: appointment.id })}
            >
              {billNow.isPending ? (
                <Spinner className="mr-1.5 h-4 w-4" />
              ) : (
                <Receipt className="mr-1.5 h-4 w-4" />
              )}
              Generate invoice
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={confirmingDelete}
        onOpenChange={(open) => !open && setConfirmingDelete(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRecurring
                ? "Delete recurring appointment"
                : "Delete this appointment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRecurring
                ? "Choose how much of this series to remove."
                : "This removes the appointment from the calendar."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isRecurring ? (
            <div className="space-y-2">
              <ScopeOption
                checked={deleteScope === "one"}
                onSelect={() => setDeleteScope("one")}
                title="Only this appointment"
                hint="The rest of the series stays untouched"
              />
              <ScopeOption
                checked={deleteScope === "future"}
                onSelect={() => setDeleteScope("future")}
                title="This and all future appointments"
                hint="Past visits stay on the calendar and the series stops repeating"
              />
            </div>
          ) : null}

          {preview && preview.invoiced > 0 ? (
            <div className="flex gap-2.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
              <p className="leading-relaxed">
                {preview.invoiced === preview.total
                  ? preview.total === 1
                    ? "This appointment was already invoiced."
                    : `All ${preview.total} of these were already invoiced.`
                  : `${preview.invoiced} of the ${preview.total} appointments were already invoiced.`}{" "}
                Those invoices stay on the customer's account, so the work will
                be charged even though it is no longer scheduled. Void them from
                Invoices if that is not what you want.
              </p>
            </div>
          ) : (
            <p className="rounded-lg bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              {preview && preview.total > 1
                ? `${preview.total} appointments will be removed. `
                : null}
              Invoices already generated are kept. Only the schedule entries are
              removed.
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "min-w-24",
              )}
              onClick={(event) => {
                // Radix closes on click; keep it open until the request settles.
                event.preventDefault();
                remove.mutate({
                  id: appointment.id,
                  scope: isRecurring ? deleteScope : "one",
                });
              }}
            >
              {remove.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function ScopeOption({ checked, onSelect, title, hint }: ScopeOptionProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-0.5 rounded-xl px-3.5 py-2.5 ring-1 transition-all",
        checked
          ? "bg-primary/5 ring-2 ring-primary"
          : "bg-card ring-border hover:bg-secondary/50",
      )}
    >
      <input
        type="radio"
        name="delete-scope"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </label>
  );
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="ml-auto text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

/** 42 day strings covering the six weeks that contain the given month. */
function buildMonthGrid(year: number, month: number): string[] {
  const first = new Date(Date.UTC(year, month, 1));
  const gridStart = new Date(first);
  gridStart.setUTCDate(gridStart.getUTCDate() - first.getUTCDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setUTCDate(day.getUTCDate() + index);
    return toDayString(day);
  });
}

function summarize(
  appointments: Appointment[],
  timezone: string,
  cursor: MonthCursor,
): Summary {
  const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;

  let scheduled = 0;
  let completed = 0;
  let invoiced = 0;
  let pending = 0;
  let hasPrices = false;

  for (const appointment of appointments) {
    const day = formatInTimeZone(appointment.startsAt, timezone, "yyyy-MM");
    if (day !== monthPrefix) continue;

    if (appointment.status === "scheduled") scheduled += 1;
    if (appointment.status === "completed") completed += 1;

    if (appointment.total === null || appointment.billingMode === "none") {
      continue;
    }

    hasPrices = true;
    const amount = Number(appointment.total);
    if (appointment.invoiceId) invoiced += amount;
    else if (appointment.status !== "cancelled") pending += amount;
  }

  return {
    scheduled,
    completed,
    invoiced: invoiced.toFixed(2),
    pending: pending.toFixed(2),
    hasPrices,
  };
}

function currentMonth(timezone: string): MonthCursor {
  const today = todayIn(timezone);
  return {
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
  };
}

function todayIn(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

function toDayString(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const value = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1));
  value.setUTCDate(value.getUTCDate() + days);
  return toDayString(value);
}

/** Left accent bar + tint for an appointment chip in the grid. */
function statusAccent(status: string): string {
  switch (status) {
    case "completed":
      return "border-l-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100";
    case "cancelled":
      return "border-l-border bg-secondary text-muted-foreground line-through hover:bg-secondary";
    case "no_show":
      return "border-l-red-500 bg-red-50 text-red-900 hover:bg-red-100";
    default:
      return "border-l-primary bg-primary/5 text-foreground hover:bg-primary/10";
  }
}

function statusPill(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
      return "bg-secondary text-muted-foreground";
    case "no_show":
      return "bg-red-100 text-red-800";
    default:
      return "bg-primary/10 text-primary";
  }
}

const WEEKDAY_HEADERS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

type MonthCursor = {
  year: number;
  /** Zero-indexed, matching `Date` semantics. */
  month: number;
};

type Summary = {
  scheduled: number;
  completed: number;
  invoiced: string;
  pending: string;
  /** False when the viewer lacks `schedule:view-prices`, so money is hidden. */
  hasPrices: boolean;
};

type Appointment = {
  id: string;
  seriesId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  startsAt: Date;
  endsAt: Date;
  status: string;
  customerName: string | null;
  billingMode: string;
  total: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  billingBlockedReason: string | null;
};

interface PageShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

interface SummaryTileProps {
  label: string;
  value: string;
  accent?: boolean;
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

type DeleteScope = "one" | "future";

interface ScopeOptionProps {
  checked: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
}

interface AppointmentDetailDialogProps {
  appointment: Appointment | null;
  timezone: string;
  currency: CurrencyFormat;
  onClose: () => void;
  onEdit: () => void;
  onChanged: () => void;
}

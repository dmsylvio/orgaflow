import { StatusPill, type StatusTone } from "@/components/app/page-shell";
import type { RecurringFrequency } from "@/schemas/recurring-invoice";
import { FREQUENCY_LABELS } from "@/schemas/recurring-invoice";

export type RecurringStatus = "active" | "on_hold" | "completed";

const STATUS_TONES: Record<RecurringStatus, StatusTone> = {
  active: "emerald",
  on_hold: "amber",
  completed: "zinc",
};

const STATUS_LABELS: Record<RecurringStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

export function RecurringStatusBadge({ status }: { status: RecurringStatus }) {
  return (
    <StatusPill tone={STATUS_TONES[status] ?? "slate"}>
      {STATUS_LABELS[status] ?? status}
    </StatusPill>
  );
}

export function FrequencyLabel({
  frequency,
}: {
  frequency: RecurringFrequency;
}) {
  return <span>{FREQUENCY_LABELS[frequency] ?? frequency}</span>;
}

export { PageShell } from "@/components/app/page-shell";

export function formatNextRun(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

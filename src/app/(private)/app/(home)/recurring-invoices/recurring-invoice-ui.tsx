import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { RecurringFrequency } from "@/schemas/recurring-invoice";
import { FREQUENCY_LABELS } from "@/schemas/recurring-invoice";

export type RecurringStatus = "active" | "on_hold" | "completed";

const STATUS_STYLES: Record<RecurringStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  completed: "bg-zinc-100 text-zinc-700",
};

const STATUS_LABELS: Record<RecurringStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

export function RecurringStatusBadge({ status }: { status: RecurringStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function FrequencyLabel({ frequency }: { frequency: RecurringFrequency }) {
  return <span>{FREQUENCY_LABELS[frequency] ?? frequency}</span>;
}

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full p-6 md:p-8">
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

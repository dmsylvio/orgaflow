import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type EstimateStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "EXPIRED"
  | "APPROVED"
  | "REJECTED";

const STATUS_STYLES: Record<EstimateStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-cyan-100 text-cyan-700",
  EXPIRED: "bg-zinc-100 text-zinc-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

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
    <div className="min-w-0 w-full p-6 md:p-8">
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

export function formatEstimateDate(value: string | null) {
  if (!value) return null;

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

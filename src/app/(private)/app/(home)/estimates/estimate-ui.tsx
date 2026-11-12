import { StatusPill, type StatusTone } from "@/components/app/page-shell";

export type EstimateStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "EXPIRED"
  | "APPROVED"
  | "REJECTED";

const STATUS_TONES: Record<EstimateStatus, StatusTone> = {
  DRAFT: "slate",
  SENT: "blue",
  VIEWED: "violet",
  EXPIRED: "zinc",
  APPROVED: "emerald",
  REJECTED: "rose",
};

export { PageShell } from "@/components/app/page-shell";

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
    <StatusPill tone={STATUS_TONES[status] ?? "slate"}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </StatusPill>
  );
}

import { StatusPill, type StatusTone } from "@/components/app/page-shell";

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "SENT"
  | "VIEWED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

const STATUS_TONES: Record<InvoiceStatus, StatusTone> = {
  DRAFT: "slate",
  PENDING: "amber",
  SENT: "blue",
  VIEWED: "violet",
  PARTIALLY_PAID: "amber",
  PAID: "emerald",
  OVERDUE: "rose",
  VOID: "zinc",
};

export { PageShell } from "@/components/app/page-shell";

export function formatInvoiceDate(value: string | null) {
  if (!value) return null;

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const label = status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

  return (
    <StatusPill tone={STATUS_TONES[status] ?? "slate"}>{label}</StatusPill>
  );
}

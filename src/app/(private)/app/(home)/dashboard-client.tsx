"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import NextLink from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)
    return `$${(value / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Estimate status badge
// ---------------------------------------------------------------------------

const ESTIMATE_STATUS: Record<string, { label: string; className: string }> = {
  SENT:     { label: "Sent",     className: "bg-blue-50 text-blue-700 border-blue-200" },
  VIEWED:   { label: "Viewed",   className: "bg-violet-50 text-violet-700 border-violet-200" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-rose-50 text-rose-700 border-rose-200" },
  EXPIRED:  { label: "Expired",  className: "bg-muted text-muted-foreground border-border" },
};

const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  SENT:          { label: "Sent",          className: "bg-blue-50 text-blue-700 border-blue-200" },
  VIEWED:        { label: "Viewed",        className: "bg-violet-50 text-violet-700 border-violet-200" },
  OVERDUE:       { label: "Overdue",       className: "bg-rose-50 text-rose-700 border-rose-200" },
  PARTIALLY_PAID:{ label: "Partial",       className: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID:          { label: "Paid",          className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function StatusBadge({ map, status }: { map: typeof ESTIMATE_STATUS; status: string }) {
  const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Activity icon
// ---------------------------------------------------------------------------

function ActivityIcon({ type, status }: { type: string; status?: string }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full";

  if (type === "payment")
    return <div className={`${base} bg-emerald-100`}><DollarSign className="h-3.5 w-3.5 text-emerald-600" /></div>;

  if (type === "estimate") {
    if (status === "APPROVED")
      return <div className={`${base} bg-emerald-100`}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /></div>;
    if (status === "REJECTED")
      return <div className={`${base} bg-rose-100`}><XCircle className="h-3.5 w-3.5 text-rose-600" /></div>;
    return <div className={`${base} bg-blue-100`}><FileText className="h-3.5 w-3.5 text-blue-600" /></div>;
  }

  if (status === "OVERDUE")
    return <div className={`${base} bg-rose-100`}><Clock className="h-3.5 w-3.5 text-rose-600" /></div>;
  if (status === "PAID")
    return <div className={`${base} bg-emerald-100`}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /></div>;
  return <div className={`${base} bg-violet-100`}><BookOpen className="h-3.5 w-3.5 text-violet-600" /></div>;
}

function activityText(type: string, status?: string): string {
  if (type === "payment") return "Payment received";
  if (type === "estimate") {
    const map: Record<string, string> = {
      SENT: "Estimate sent", VIEWED: "Estimate viewed",
      APPROVED: "Estimate approved", REJECTED: "Estimate rejected", EXPIRED: "Estimate expired",
    };
    return map[status ?? ""] ?? "Estimate updated";
  }
  const map: Record<string, string> = {
    SENT: "Invoice sent", VIEWED: "Invoice viewed", PAID: "Invoice paid",
    OVERDUE: "Invoice overdue", PARTIALLY_PAID: "Partial payment",
  };
  return map[status ?? ""] ?? "Invoice updated";
}

// ---------------------------------------------------------------------------
// Chart tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-0.5 font-semibold text-foreground">{label}</p>
      <p className="text-primary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardClient({ orgName }: { orgName: string | null }) {
  const trpc = useTRPC();

  const stats        = useQuery(trpc.dashboard.getStats.queryOptions());
  const revenue      = useQuery(trpc.dashboard.getMonthlyRevenue.queryOptions());
  const pendingEst   = useQuery(trpc.dashboard.getPendingEstimates.queryOptions());
  const pendingInv   = useQuery(trpc.dashboard.getPendingInvoices.queryOptions());
  const activity     = useQuery(trpc.dashboard.getRecentActivity.queryOptions());

  return (
    <div className="space-y-6 p-6 md:p-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        {orgName && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            Welcome back — <span className="font-medium text-foreground">{orgName}</span>
          </p>
        )}
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Customers",
            value: stats.data?.customers,
            icon: Users,
            color: "bg-blue-500/10 text-blue-600",
            href: "/app/customers",
          },
          {
            label: "Open estimates",
            value: stats.data?.openEstimates,
            icon: FileText,
            color: "bg-violet-500/10 text-violet-600",
            href: "/app/estimates",
          },
          {
            label: "Open invoices",
            value: stats.data?.openInvoices,
            icon: BookOpen,
            color: "bg-amber-500/10 text-amber-600",
            href: "/app/invoices",
          },
          {
            label: "Revenue this month",
            value: stats.data !== undefined ? formatCurrency(stats.data.revenueThisMonth) : undefined,
            icon: TrendingUp,
            color: "bg-emerald-500/10 text-emerald-600",
            href: "/app/reports",
          },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <NextLink
            key={label}
            href={href}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            {value === undefined ? (
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            )}
          </NextLink>
        ))}
      </div>

      {/* ── Revenue chart ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Revenue — last 12 months</h2>
          <NextLink href="/app/reports" className="text-xs text-muted-foreground hover:text-primary">
            Full report →
          </NextLink>
        </div>

        {revenue.isPending ? (
          <div className="flex h-[200px] items-center justify-center">
            <Spinner className="size-4 text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenue.data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#2563eb" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Pending documents ──────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Estimates awaiting response */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Estimates awaiting response</h2>
            <NextLink href="/app/estimates" className="text-xs text-muted-foreground hover:text-primary">
              View all →
            </NextLink>
          </div>

          {pendingEst.isPending ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner className="size-4 text-primary" />
            </div>
          ) : !pendingEst.data?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No estimates pending.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingEst.data.map((e) => (
                <li key={e.id}>
                  <NextLink
                    href={`/app/estimates/${e.id}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{e.customerName}</p>
                      <p className="text-xs text-muted-foreground">{e.estimateNumber}</p>
                    </div>
                    <StatusBadge map={ESTIMATE_STATUS} status={e.status} />
                  </NextLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Invoices needing attention */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Invoices needing attention</h2>
            <NextLink href="/app/invoices" className="text-xs text-muted-foreground hover:text-primary">
              View all →
            </NextLink>
          </div>

          {pendingInv.isPending ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner className="size-4 text-primary" />
            </div>
          ) : !pendingInv.data?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No invoices pending.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingInv.data.map((i) => (
                <li key={i.id}>
                  <NextLink
                    href={`/app/invoices/${i.id}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{i.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.invoiceNumber}
                        {i.dueDate ? ` · Due ${new Date(`${i.dueDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                      </p>
                    </div>
                    <StatusBadge map={INVOICE_STATUS} status={i.status} />
                  </NextLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Recent activity ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Recent activity</h2>

        {activity.isPending ? (
          <div className="flex h-24 items-center justify-center">
            <Spinner className="size-4 text-primary" />
          </div>
        ) : !activity.data?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="space-y-3">
            {activity.data.map((item) => (
              <li key={item.id}>
                <NextLink
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
                >
                  <ActivityIcon type={item.type} status={item.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {activityText(item.type, item.status)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.label} · {item.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(item.date)}
                  </span>
                </NextLink>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

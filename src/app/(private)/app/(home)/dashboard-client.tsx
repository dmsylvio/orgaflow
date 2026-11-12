"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  ListTodo,
  Plus,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusPill, type StatusTone } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { useCanViewPrices } from "@/hooks/use-can-view-prices";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
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
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

const ESTIMATE_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  SENT: { label: "Sent", tone: "blue" },
  VIEWED: { label: "Viewed", tone: "violet" },
  APPROVED: { label: "Approved", tone: "emerald" },
  REJECTED: { label: "Rejected", tone: "rose" },
  EXPIRED: { label: "Expired", tone: "zinc" },
};

const INVOICE_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  SENT: { label: "Sent", tone: "blue" },
  VIEWED: { label: "Viewed", tone: "violet" },
  OVERDUE: { label: "Overdue", tone: "rose" },
  PARTIALLY_PAID: { label: "Partial", tone: "amber" },
  PAID: { label: "Paid", tone: "emerald" },
};

function StatusBadge({
  map,
  status,
}: {
  map: typeof ESTIMATE_STATUS;
  status: string;
}) {
  const cfg = map[status] ?? { label: status, tone: "slate" as const };
  return <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>;
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

function ActivityIcon({ type, status }: { type: string; status?: string }) {
  const base =
    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-4 ring-card";

  if (type === "payment")
    return (
      <div className={cn(base, "bg-emerald-100 text-emerald-600")}>
        <DollarSign className="h-4 w-4" />
      </div>
    );

  if (type === "estimate") {
    if (status === "APPROVED")
      return (
        <div className={cn(base, "bg-emerald-100 text-emerald-600")}>
          <CheckCircle2 className="h-4 w-4" />
        </div>
      );
    if (status === "REJECTED")
      return (
        <div className={cn(base, "bg-rose-100 text-rose-600")}>
          <XCircle className="h-4 w-4" />
        </div>
      );
    return (
      <div className={cn(base, "bg-sky-100 text-sky-600")}>
        <FileText className="h-4 w-4" />
      </div>
    );
  }

  if (status === "OVERDUE")
    return (
      <div className={cn(base, "bg-rose-100 text-rose-600")}>
        <Clock className="h-4 w-4" />
      </div>
    );
  if (status === "PAID")
    return (
      <div className={cn(base, "bg-emerald-100 text-emerald-600")}>
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  return (
    <div className={cn(base, "bg-violet-100 text-violet-600")}>
      <BookOpen className="h-4 w-4" />
    </div>
  );
}

function activityText(type: string, status?: string): string {
  if (type === "payment") return "Payment received";
  if (type === "estimate") {
    const map: Record<string, string> = {
      SENT: "Estimate sent",
      VIEWED: "Estimate viewed",
      APPROVED: "Estimate approved",
      REJECTED: "Estimate rejected",
      EXPIRED: "Estimate expired",
    };
    return map[status ?? ""] ?? "Estimate updated";
  }
  const map: Record<string, string> = {
    SENT: "Invoice sent",
    VIEWED: "Invoice viewed",
    PAID: "Invoice paid",
    OVERDUE: "Invoice overdue",
    PARTIALLY_PAID: "Partial payment",
  };
  return map[status ?? ""] ?? "Invoice updated";
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

type ChartTooltipProps = {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
};

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
      <p className="mb-0.5 text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function Panel({
  title,
  href,
  hrefLabel = "View all",
  children,
  className,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("app-card p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {href ? (
          <NextLink
            href={href}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            {hrefLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </NextLink>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <div key={i} className="flex items-center gap-3">
          <div className="app-shimmer h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="app-shimmer h-3 w-2/5 rounded" />
            <div className="app-shimmer h-2.5 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ Icon, text }: { Icon: typeof FileText; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

const KPI_TONES = {
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
} as const;

const QUICK_ACTIONS = [
  { href: "/app/estimates/create", label: "New estimate", Icon: FileText },
  { href: "/app/invoices/create", label: "New invoice", Icon: BookOpen },
  { href: "/app/customers", label: "Customers", Icon: Users },
  { href: "/app/tasks", label: "Tasks", Icon: ListTodo },
  { href: "/app/schedule", label: "Schedule", Icon: CalendarDays },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardClient({ orgName }: { orgName: string | null }) {
  const trpc = useTRPC();
  const { dashboard: canViewPrices } = useCanViewPrices();

  const stats = useQuery(trpc.dashboard.getStats.queryOptions());
  const revenue = useQuery(trpc.dashboard.getMonthlyRevenue.queryOptions());
  const pendingEst = useQuery(
    trpc.dashboard.getPendingEstimates.queryOptions(),
  );
  const pendingInv = useQuery(trpc.dashboard.getPendingInvoices.queryOptions());
  const activity = useQuery(trpc.dashboard.getRecentActivity.queryOptions());

  const revenueTotal =
    revenue.data?.reduce((sum, point) => sum + (point.revenue ?? 0), 0) ?? 0;

  const kpis = [
    {
      label: "Customers",
      value: stats.data?.customers,
      Icon: Users,
      tone: "sky" as const,
      href: "/app/customers",
    },
    {
      label: "Open estimates",
      value: stats.data?.openEstimates,
      Icon: FileText,
      tone: "violet" as const,
      href: "/app/estimates",
    },
    {
      label: "Open invoices",
      value: stats.data?.openInvoices,
      Icon: BookOpen,
      tone: "amber" as const,
      href: "/app/invoices",
    },
    ...(canViewPrices
      ? [
          {
            label: "Revenue this month",
            value:
              stats.data !== undefined
                ? formatCurrency(stats.data.revenueThisMonth ?? 0)
                : undefined,
            Icon: TrendingUp,
            tone: "emerald" as const,
            href: "/app/reports",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1 className="app-page-title mt-0.5">
            {orgName ? `${orgName} overview` : "Overview"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ href, label, Icon }, i) => (
            <Button
              key={href}
              asChild
              size="sm"
              variant={i === 0 ? "default" : "outline"}
              className={cn("gap-1.5", i >= 2 && "hidden sm:inline-flex")}
            >
              <NextLink href={href}>
                {i < 2 ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {label}
              </NextLink>
            </Button>
          ))}
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, Icon, tone, href }) => (
          <NextLink
            key={label}
            href={href}
            className="app-card group relative overflow-hidden p-4 transition-colors hover:border-primary/40 sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  KPI_TONES[tone],
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">
              {label}
            </p>
            {value === undefined ? (
              <div className="app-shimmer mt-1.5 h-8 w-20 rounded-lg" />
            ) : (
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                {value}
              </p>
            )}
          </NextLink>
        ))}
      </div>

      {/* ── Revenue + activity ───────────────────────────────────── */}
      <div
        className={cn(
          "grid gap-4",
          canViewPrices && "xl:grid-cols-[1.65fr_1fr]",
        )}
      >
        {canViewPrices ? (
          <section className="app-card p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-foreground">
                  Revenue
                </h2>
                <p className="text-xs text-muted-foreground">Last 12 months</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {revenue.isPending ? "—" : formatCurrency(revenueTotal)}
                </p>
                <NextLink
                  href="/app/reports"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Full report
                </NextLink>
              </div>
            </div>

            {revenue.isPending ? (
              <div className="app-shimmer h-[240px] rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={revenue.data}
                  margin={{ top: 6, right: 6, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#6366f1"
                        stopOpacity={0.32}
                      />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 6"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "#a5b4fc", strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#fff",
                      stroke: "#6366f1",
                      strokeWidth: 3,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </section>
        ) : null}

        <Panel title="Recent activity">
          {activity.isPending ? (
            <ListSkeleton rows={5} />
          ) : !activity.data?.length ? (
            <EmptyState Icon={Clock} text="No recent activity yet." />
          ) : (
            <ol className="relative">
              <span
                aria-hidden
                className="absolute bottom-5 left-[1.4rem] top-5 w-px bg-gradient-to-b from-border via-border to-transparent"
              />
              {activity.data.map((item) => (
                <li key={item.id}>
                  <NextLink
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-muted/70"
                  >
                    <ActivityIcon type={item.type} status={item.status} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {activityText(item.type, item.status)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.label} · {item.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      {timeAgo(item.date)}
                    </span>
                  </NextLink>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {/* ── Pending documents ────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Estimates awaiting response" href="/app/estimates">
          {pendingEst.isPending ? (
            <ListSkeleton />
          ) : !pendingEst.data?.length ? (
            <EmptyState
              Icon={FileText}
              text="No estimates waiting on clients."
            />
          ) : (
            <ul className="-mx-1.5 space-y-0.5">
              {pendingEst.data.map((e) => (
                <li key={e.id}>
                  <NextLink
                    href={`/app/estimates/${e.id}`}
                    className="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-muted/70"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-bold text-violet-600">
                      {e.customerName?.trim()?.[0]?.toUpperCase() ?? "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {e.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.estimateNumber}
                      </p>
                    </div>
                    <StatusBadge map={ESTIMATE_STATUS} status={e.status} />
                  </NextLink>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Invoices needing attention" href="/app/invoices">
          {pendingInv.isPending ? (
            <ListSkeleton />
          ) : !pendingInv.data?.length ? (
            <EmptyState
              Icon={CheckCircle2}
              text="All caught up. No invoices pending."
            />
          ) : (
            <ul className="-mx-1.5 space-y-0.5">
              {pendingInv.data.map((i) => (
                <li key={i.id}>
                  <NextLink
                    href={`/app/invoices/${i.id}`}
                    className="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-muted/70"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-600">
                      {i.customerName?.trim()?.[0]?.toUpperCase() ?? "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {i.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i.invoiceNumber}
                        {i.dueDate
                          ? ` · Due ${new Date(`${i.dueDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : ""}
                      </p>
                    </div>
                    <StatusBadge map={INVOICE_STATUS} status={i.status} />
                  </NextLink>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

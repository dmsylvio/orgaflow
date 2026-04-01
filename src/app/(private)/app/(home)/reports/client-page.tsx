"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { useCanViewPrices } from "@/hooks/use-can-view-prices";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

type Period = "3m" | "6m" | "12m";

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status colours
// ---------------------------------------------------------------------------

const ESTIMATE_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SENT: "#3b82f6",
  VIEWED: "#a78bfa",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
};

const INVOICE_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SENT: "#3b82f6",
  VIEWED: "#a78bfa",
  DUE: "#f97316",
  PAID: "#22c55e",
  CANCELLED: "#e2e8f0",
};

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">
        {name}: {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ReportsClientPage() {
  const trpc = useTRPC();
  const [period, setPeriod] = useState<Period>("12m");
  const { dashboard: canViewPrices } = useCanViewPrices();

  const overview = useQuery(
    trpc.reports.getMonthlyOverview.queryOptions({ period }),
  );
  const estimateStats = useQuery(trpc.reports.getEstimateStats.queryOptions());
  const invoiceStats = useQuery(trpc.reports.getInvoiceStats.queryOptions());
  const topCustomers = useQuery(
    trpc.reports.getTopCustomers.queryOptions({ period }),
  );

  const totalRevenue = (overview.data ?? []).reduce(
    (s, r) => s + r.revenue,
    0,
  );
  const totalExpenses = (overview.data ?? []).reduce(
    (s, r) => s + r.expenses,
    0,
  );
  const approvedEstimates =
    estimateStats.data?.find((s) => s.status === "APPROVED")?.count ?? 0;
  const totalEstimates =
    estimateStats.data?.reduce((s, r) => s + r.count, 0) ?? 0;
  const approvalRate =
    totalEstimates > 0
      ? Math.round((approvedEstimates / totalEstimates) * 100)
      : 0;
  const paidInvoices =
    invoiceStats.data?.find((s) => s.status === "PAID")?.count ?? 0;

  const isLoading =
    overview.isPending ||
    estimateStats.isPending ||
    invoiceStats.isPending ||
    topCustomers.isPending;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Overview of revenue, expenses, and document activity.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {(["3m", "6m", "12m"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "3m" ? "3 months" : p === "6m" ? "6 months" : "12 months"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="size-5 text-primary" label="Loading reports" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {canViewPrices ? (
              <StatCard
                label="Total revenue"
                value={formatCurrency(totalRevenue)}
                sub={`Last ${period === "3m" ? "3" : period === "6m" ? "6" : "12"} months`}
              />
            ) : null}
            {canViewPrices ? (
              <StatCard
                label="Total expenses"
                value={formatCurrency(totalExpenses)}
                sub={`Last ${period === "3m" ? "3" : period === "6m" ? "6" : "12"} months`}
              />
            ) : null}
            <StatCard
              label="Estimate approval rate"
              value={`${approvalRate}%`}
              sub={`${approvedEstimates} of ${totalEstimates} estimates`}
            />
            <StatCard
              label="Paid invoices"
              value={String(paidInvoices)}
              sub="All time"
            />
          </div>

          {/* Revenue vs Expenses bar chart */}
          {canViewPrices ? <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Revenue vs Expenses
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={(overview.data ?? []).map((d) => ({
                  ...d,
                  month: formatMonthLabel(d.month),
                }))}
                barCategoryGap="30%"
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                  }
                />
                <Tooltip content={<BarTooltip />} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#2563eb]" />
                Revenue
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#f97316]" />
                Expenses
              </div>
            </div>
          </div> : null}

          {/* Pie charts row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Estimate status */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Estimates by status
              </h2>
              {totalEstimates === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No estimates yet.
                </p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={(estimateStats.data ?? []).filter(
                          (s) => s.count > 0,
                        )}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                      >
                        {(estimateStats.data ?? [])
                          .filter((s) => s.count > 0)
                          .map((entry) => (
                            <Cell
                              key={entry.status}
                              fill={
                                ESTIMATE_COLORS[entry.status] ?? "#94a3b8"
                              }
                            />
                          ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2">
                    {(estimateStats.data ?? [])
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <div
                          key={s.status}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background:
                                ESTIMATE_COLORS[s.status] ?? "#94a3b8",
                            }}
                          />
                          <span className="text-muted-foreground">
                            {s.label}
                          </span>
                          <span className="ml-auto font-semibold text-foreground">
                            {s.count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Invoice status */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Invoices by status
              </h2>
              {invoiceStats.data?.every((s) => s.count === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No invoices yet.
                </p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={(invoiceStats.data ?? []).filter(
                          (s) => s.count > 0,
                        )}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                      >
                        {(invoiceStats.data ?? [])
                          .filter((s) => s.count > 0)
                          .map((entry) => (
                            <Cell
                              key={entry.status}
                              fill={INVOICE_COLORS[entry.status] ?? "#94a3b8"}
                            />
                          ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2">
                    {(invoiceStats.data ?? [])
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <div
                          key={s.status}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background:
                                INVOICE_COLORS[s.status] ?? "#94a3b8",
                            }}
                          />
                          <span className="text-muted-foreground">
                            {s.label}
                          </span>
                          <span className="ml-auto font-semibold text-foreground">
                            {s.count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top customers */}
          {canViewPrices ? <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Top customers by revenue
            </h2>
            {!topCustomers.data?.length ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No payment data for this period.
              </p>
            ) : (
              <div className="space-y-3">
                {topCustomers.data.map((c, i) => {
                  const max = topCustomers.data![0]!.total;
                  const pct = max > 0 ? (c.total / max) * 100 : 0;
                  return (
                    <div key={c.customerId} className="flex items-center gap-3">
                      <span className="w-4 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-foreground">
                            {c.customerName}
                          </p>
                          <p className="ml-3 shrink-0 text-sm font-semibold text-foreground">
                            {formatCurrency(c.total)}
                          </p>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div> : null}
        </>
      )}
    </div>
  );
}

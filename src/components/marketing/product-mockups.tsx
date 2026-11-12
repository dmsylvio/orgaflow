/**
 * Illustrations of the Orgaflow app, drawn with HTML/SVG instead of
 * screenshots so they stay sharp, light, and in sync with the brand.
 * Sample data only. Every mockup is decorative (aria-hidden); the caller
 * describes it in text.
 */
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Eye,
  FileText,
  LayoutDashboard,
  Package,
  Paperclip,
  Receipt,
  Search,
  Settings,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Frame                                                               */
/* ------------------------------------------------------------------ */

export function BrowserFrame({
  url = "app.orgaflow.dev",
  children,
  className,
  dark = false,
}: {
  url?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-2xl border shadow-[0_40px_120px_-30px_rgba(49,46,129,0.55)]",
        dark ? "border-white/10 bg-ink-800" : "border-border bg-white",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 border-b px-4 py-2.5",
          dark ? "border-white/10 bg-ink-700/60" : "border-border bg-slate-50",
        )}
      >
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div
          className={cn(
            "mx-auto flex max-w-xs flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-[11px]",
            dark ? "bg-white/5 text-slate-400" : "bg-white text-slate-500",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
          {url}
        </div>
        <div className="w-10" />
      </div>
      {children}
    </div>
  );
}

const NAV = [
  { Icon: LayoutDashboard, label: "Dashboard" },
  { Icon: Users, label: "Customers" },
  { Icon: Package, label: "Items" },
  { Icon: FileText, label: "Estimates" },
  { Icon: Receipt, label: "Invoices" },
  { Icon: Wallet, label: "Payments" },
  { Icon: CalendarDays, label: "Schedule" },
  { Icon: ClipboardList, label: "Tasks" },
  { Icon: BarChart3, label: "Reports" },
  { Icon: Settings, label: "Settings" },
];

function AppSidebar({ active }: { active: string }) {
  return (
    <div className="hidden w-44 shrink-0 flex-col bg-[#060918] p-3 text-slate-400 md:flex">
      <div className="mb-4 flex items-center gap-2 px-2 pt-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-bold text-white">
          O
        </span>
        <span className="text-[13px] font-semibold text-white">Orgaflow</span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {NAV.map(({ Icon, label }) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px]",
              label === active
                ? "bg-white/[0.07] font-semibold text-white"
                : "text-slate-400",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {label === active ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center gap-2 rounded-md border border-white/5 px-2 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-semibold text-indigo-300">
          M
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-white">
            Maple Services
          </p>
          <p className="truncate text-[10px] text-slate-500">Scale plan</p>
        </div>
      </div>
    </div>
  );
}

function AppTopbar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
      <div>
        <p className="text-[15px] font-bold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <span className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-400">
          <Search className="h-3 w-3" />
          Search…
          <kbd className="ml-3 rounded bg-slate-100 px-1 text-[9px]">⌘K</kbd>
        </span>
        <span className="relative flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </span>
      </div>
    </div>
  );
}

export function AppShell({
  active,
  title,
  subtitle,
  children,
}: {
  active: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[22rem] bg-white text-left">
      <AppSidebar active={active} />
      <div className="min-w-0 flex-1 bg-slate-50/60">
        <AppTopbar title={title} subtitle={subtitle} />
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const STATUS_STYLES = {
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Viewed: "bg-violet-50 text-violet-700 ring-violet-600/20",
  Sent: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Partial: "bg-amber-50 text-amber-700 ring-amber-600/20",
} as const;

export function StatusPill({ status }: { status: keyof typeof STATUS_STYLES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

const KPIS = [
  {
    label: "Revenue this month",
    value: "$18,420",
    delta: "+24%",
    tone: "emerald",
  },
  { label: "Open estimates", value: "12", delta: "4 viewed", tone: "violet" },
  {
    label: "Unpaid invoices",
    value: "$3,180",
    delta: "2 overdue",
    tone: "rose",
  },
  { label: "Tasks this week", value: "27", delta: "9 done", tone: "sky" },
] as const;

const TONE_TEXT = {
  emerald: "text-emerald-600",
  violet: "text-violet-600",
  rose: "text-rose-600",
  sky: "text-sky-600",
} as const;

// Monthly revenue sample, plotted on a 600x150 canvas.
const REVENUE = [4.2, 5.1, 4.8, 6.4, 7.1, 6.6, 8.2, 9.4, 8.9, 11.2, 12.6, 14.1];

function revenuePath(width: number, height: number) {
  const max = 15;
  const step = width / (REVENUE.length - 1);
  const points = REVENUE.map(
    (v, i) => [i * step, height - (v / max) * height] as const,
  );
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return { line: d, area: `${d} L ${width} ${height} L 0 ${height} Z` };
}

export function RevenueChart({ animated = true }: { animated?: boolean }) {
  const { line, area } = revenuePath(600, 150);
  return (
    <svg
      viewBox="0 0 600 160"
      className="h-auto w-full"
      preserveAspectRatio="none"
    >
      <title>Revenue over the last 12 months</title>
      <defs>
        <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rev-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="60%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="0"
          x2="600"
          y1={5 + i * 48}
          y2={5 + i * 48}
          stroke="#e2e8f0"
          strokeDasharray="3 4"
        />
      ))}
      <path d={area} fill="url(#rev-fill)" />
      <path
        d={line}
        fill="none"
        stroke="url(#rev-line)"
        strokeWidth="3"
        strokeLinecap="round"
        className={animated ? "draw-line" : undefined}
      />
      <circle cx="600" cy={150 - (14.1 / 15) * 150} r="5" fill="#10b981" />
      <circle
        cx="600"
        cy={150 - (14.1 / 15) * 150}
        r="10"
        fill="#10b981"
        opacity="0.2"
      />
    </svg>
  );
}

const ACTIVITY = [
  {
    Icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-600",
    title: "Estimate approved",
    meta: "EST-0142 · Maple Street Bakery",
    when: "2m",
  },
  {
    Icon: CircleDollarSign,
    tone: "bg-emerald-50 text-emerald-600",
    title: "Payment received",
    meta: "$860.00 · Bank transfer",
    when: "1h",
  },
  {
    Icon: Zap,
    tone: "bg-violet-50 text-violet-600",
    title: "Task created by automation",
    meta: "Clean exhaust hood · Dana",
    when: "1h",
  },
  {
    Icon: Eye,
    tone: "bg-sky-50 text-sky-600",
    title: "Estimate viewed",
    meta: "EST-0145 · Harbor Dental",
    when: "3h",
  },
];

export function DashboardMock() {
  return (
    <AppShell
      active="Dashboard"
      title="Dashboard"
      subtitle="Welcome back, Maple Services"
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {KPIS.map(({ label, value, delta, tone }) => (
          <Card key={label}>
            <p className="text-[10.5px] text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
              {value}
            </p>
            <p className={cn("text-[10px] font-semibold", TONE_TEXT[tone])}>
              {delta}
            </p>
          </Card>
        ))}
      </div>
      <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-slate-900">
              Revenue · last 12 months
            </p>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              +236%
            </span>
          </div>
          <div className="mt-3">
            <RevenueChart />
          </div>
        </Card>
        <Card>
          <p className="text-[12px] font-semibold text-slate-900">
            Recent activity
          </p>
          <ul className="mt-2 flex flex-col">
            {ACTIVITY.map(({ Icon, tone, title, meta, when }) => (
              <li
                key={title}
                className="flex items-center gap-2.5 border-b border-slate-100 py-2 last:border-b-0"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    tone,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-slate-800">
                    {title}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">{meta}</p>
                </div>
                <span className="text-[10px] text-slate-400">{when}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Estimates list + client approval                                    */
/* ------------------------------------------------------------------ */

const ESTIMATES = [
  {
    no: "EST-0145",
    client: "Harbor Dental",
    amount: "$2,400.00",
    status: "Viewed",
  },
  {
    no: "EST-0144",
    client: "Northside Gym",
    amount: "$1,150.00",
    status: "Sent",
  },
  {
    no: "EST-0142",
    client: "Maple Street Bakery",
    amount: "$860.00",
    status: "Approved",
  },
  {
    no: "EST-0139",
    client: "Blue Fern Café",
    amount: "$540.00",
    status: "Draft",
  },
] as const;

export function EstimatesMock() {
  return (
    <AppShell
      active="Estimates"
      title="Estimates"
      subtitle="Send a link, get a yes"
    >
      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <Card className="p-0">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-slate-100 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Client</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
          </div>
          {ESTIMATES.map(({ no, client, amount, status }) => (
            <div
              key={no}
              className={cn(
                "grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b border-slate-100 px-3.5 py-2.5 last:border-b-0",
                no === "EST-0142" && "bg-emerald-50/40",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-[11.5px] font-semibold text-slate-800">
                  {client}
                </p>
                <p className="text-[10px] text-slate-400">{no}</p>
              </div>
              <span className="text-right text-[11.5px] font-semibold tabular-nums text-slate-700">
                {amount}
              </span>
              <StatusPill status={status} />
            </div>
          ))}
        </Card>
        <ClientApprovalCard />
      </div>
    </AppShell>
  );
}

export function ClientApprovalCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(49,46,129,0.35)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white">
            MS
          </span>
          <div>
            <p className="text-[11px] font-semibold text-slate-900">
              Maple Services
            </p>
            <p className="text-[9.5px] text-slate-400">Estimate EST-0142</p>
          </div>
        </div>
        <StatusPill status="Viewed" />
      </div>
      <div className="mt-3 space-y-1.5 border-y border-dashed border-slate-200 py-2.5 text-[11px]">
        <div className="flex justify-between text-slate-600">
          <span>Exhaust hood cleaning</span>
          <span className="tabular-nums">$680.00</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Filter replacement × 4</span>
          <span className="tabular-nums">$180.00</span>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
          <Paperclip className="h-3 w-3" /> site-photos.pdf
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between">
        <span className="text-[11px] text-slate-500">Total</span>
        <span className="text-lg font-bold tabular-nums text-slate-900">
          $860.00
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="rounded-lg border border-slate-200 py-1.5 text-center text-[11px] font-semibold text-slate-600">
          Decline
        </span>
        <span className="relative overflow-hidden rounded-lg bg-emerald-600 py-1.5 text-center text-[11px] font-semibold text-white">
          <span className="shimmer absolute inset-0" />
          Approve estimate
        </span>
      </div>
      <p className="mt-2 text-center text-[9.5px] text-slate-400">
        No account needed to approve
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Invoice                                                             */
/* ------------------------------------------------------------------ */

export function InvoiceMock() {
  return (
    <AppShell
      active="Invoices"
      title="INV-0142"
      subtitle="Created from EST-0142"
    >
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Invoice
              </p>
              <p className="mt-1 text-[15px] font-bold text-slate-900">
                Maple Street Bakery
              </p>
              <p className="text-[10.5px] text-slate-400">Due Nov 30, 2026</p>
            </div>
            <StatusPill status="Partial" />
          </div>
          <div className="mt-4 space-y-2 text-[11px]">
            {[
              ["Exhaust hood cleaning", "$680.00"],
              ["Filter replacement × 4", "$180.00"],
              ["Tax (7%)", "$60.20"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-slate-600">
                <span>{k}</span>
                <span className="tabular-nums">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
            <span className="text-[11px] text-slate-500">Balance due</span>
            <span className="text-lg font-bold tabular-nums text-slate-900">
              $460.20
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            $460.00 of $920.20 paid
          </p>
        </Card>
        <div className="flex flex-col gap-3">
          <Card>
            <p className="text-[11.5px] font-semibold text-slate-900">
              Payments
            </p>
            {[["Bank transfer", "Nov 14", "$460.00"]].map(([m, d, v]) => (
              <div
                key={m}
                className="mt-2 flex items-center justify-between text-[11px]"
              >
                <span className="flex items-center gap-1.5 text-slate-600">
                  <CircleDollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  {m} · {d}
                </span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {v}
                </span>
              </div>
            ))}
          </Card>
          <Card>
            <p className="text-[11.5px] font-semibold text-slate-900">
              PDF template
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {["Classic", "Modern", "Minimal"].map((t, i) => (
                <div
                  key={t}
                  className={cn(
                    "rounded-md border p-1.5 text-center text-[9.5px]",
                    i === 1
                      ? "border-indigo-400 bg-indigo-50 font-semibold text-indigo-700"
                      : "border-slate-200 text-slate-500",
                  )}
                >
                  <div className="mx-auto mb-1 h-6 w-5 rounded-sm bg-slate-200/80" />
                  {t}
                </div>
              ))}
            </div>
          </Card>
          <Card className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <CalendarDays className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-slate-800">
                Recurring monthly
              </p>
              <p className="text-[10px] text-slate-400">
                Next on Dec 1 · auto-send
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Tasks (kanban)                                                      */
/* ------------------------------------------------------------------ */

const COLUMNS = [
  {
    name: "To do",
    dot: "bg-slate-400",
    cards: [
      { title: "Clean exhaust hood", who: "D", due: "Nov 18", auto: true },
      { title: "Order filters", who: "R", due: "Nov 19", auto: false },
    ],
  },
  {
    name: "In progress",
    dot: "bg-indigo-500",
    cards: [
      { title: "Harbor Dental deep clean", who: "S", due: "Today", auto: true },
    ],
  },
  {
    name: "Done",
    dot: "bg-emerald-500",
    cards: [
      {
        title: "Northside Gym inspection",
        who: "D",
        due: "Nov 12",
        auto: false,
      },
      { title: "Blue Fern hood service", who: "S", due: "Nov 10", auto: true },
    ],
  },
];

export function KanbanMock() {
  return (
    <AppShell
      active="Tasks"
      title="Tasks"
      subtitle="Everything the team is working on"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {COLUMNS.map(({ name, dot, cards }) => (
          <div key={name} className="rounded-xl bg-slate-100/80 p-2">
            <p className="flex items-center gap-1.5 px-1 pb-2 text-[11px] font-semibold text-slate-600">
              <span className={cn("h-2 w-2 rounded-full", dot)} />
              {name}
              <span className="ml-auto text-slate-400">{cards.length}</span>
            </p>
            <div className="flex flex-col gap-2">
              {cards.map(({ title, who, due, auto }) => (
                <div
                  key={title}
                  className="rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                >
                  <p className="text-[11.5px] font-semibold text-slate-800">
                    {title}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    {auto ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-violet-700">
                        <Zap className="h-2.5 w-2.5" /> Auto
                      </span>
                    ) : (
                      <span className="text-[9.5px] text-slate-400">
                        Manual
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-[9.5px] text-slate-400">
                      {due}
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">
                        {who}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Automations                                                         */
/* ------------------------------------------------------------------ */

export function AutomationMock() {
  return (
    <AppShell
      active="Settings"
      title="Automations"
      subtitle="Let the work start itself"
    >
      <div className="mx-auto flex max-w-md flex-col items-stretch">
        <FlowNode
          tone="emerald"
          Icon={CheckCircle2}
          kicker="When"
          title="Estimate is approved"
          detail="Any customer · any amount"
        />
        <FlowConnector />
        <FlowNode
          tone="indigo"
          Icon={ClipboardList}
          kicker="Then"
          title="Create a task"
          detail="“Service for {customer}”"
        />
        <FlowConnector />
        <div className="grid grid-cols-2 gap-2.5">
          <FlowNode
            tone="violet"
            Icon={Users}
            kicker="Assign to"
            title="Dana"
            compact
          />
          <FlowNode
            tone="sky"
            Icon={CalendarDays}
            kicker="Due"
            title="In 3 days"
            compact
          />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[10.5px] font-semibold text-emerald-700">
          <span className="pulse-dot relative h-2 w-2 rounded-full bg-emerald-500 text-emerald-500" />
          Active · ran 38 times this month
        </div>
      </div>
    </AppShell>
  );
}

const FLOW_TONES = {
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
  violet: "bg-violet-50 text-violet-600",
  sky: "bg-sky-50 text-sky-600",
} as const;

function FlowNode({
  Icon,
  kicker,
  title,
  detail,
  tone,
  compact = false,
}: {
  Icon: typeof Zap;
  kicker: string;
  title: string;
  detail?: string;
  tone: keyof typeof FLOW_TONES;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg",
          compact ? "h-7 w-7" : "h-9 w-9",
          FLOW_TONES[tone],
        )}
      >
        <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </span>
      <div className="min-w-0">
        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
          {kicker}
        </p>
        <p className="truncate text-[12px] font-semibold text-slate-900">
          {title}
        </p>
        {detail ? (
          <p className="truncate text-[10px] text-slate-500">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex justify-center py-1">
      <svg aria-hidden width="2" height="22" className="overflow-visible">
        <title>Then</title>
        <line
          x1="1"
          x2="1"
          y1="0"
          y2="22"
          stroke="#a5b4fc"
          strokeWidth="2"
          strokeDasharray="4 4"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="16"
            to="0"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </line>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Schedule                                                            */
/* ------------------------------------------------------------------ */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const VISITS = [
  {
    day: 0,
    start: 0,
    span: 2,
    title: "Harbor Dental",
    tone: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  {
    day: 1,
    start: 1,
    span: 1,
    title: "Blue Fern Café",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    day: 2,
    start: 0,
    span: 1,
    title: "Maple Bakery",
    tone: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    day: 2,
    start: 2,
    span: 2,
    title: "Northside Gym",
    tone: "bg-violet-100 text-violet-800 border-violet-300",
  },
  {
    day: 3,
    start: 1,
    span: 2,
    title: "Harbor Dental",
    tone: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  {
    day: 4,
    start: 0,
    span: 1,
    title: "Maple Bakery",
    tone: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    day: 4,
    start: 2,
    span: 1,
    title: "Blue Fern Café",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
];

export function ScheduleMock() {
  return (
    <AppShell
      active="Schedule"
      title="Schedule"
      subtitle="Week of Nov 16, 2026"
    >
      <Card className="p-2.5">
        <div className="grid grid-cols-5 gap-1.5">
          {DAYS.map((d) => (
            <p
              key={d}
              className="pb-1 text-center text-[10px] font-semibold text-slate-500"
            >
              {d}
            </p>
          ))}
          {DAYS.map((d, dayIndex) => (
            <div
              key={d}
              className="relative grid h-44 grid-rows-4 gap-1.5 rounded-lg bg-slate-50 p-1"
            >
              {VISITS.filter((v) => v.day === dayIndex).map((v) => (
                <div
                  key={`${v.title}-${v.start}`}
                  style={{ gridRow: `${v.start + 1} / span ${v.span}` }}
                  className={cn(
                    "rounded-md border-l-2 px-1.5 py-1 text-[9.5px] font-semibold leading-tight",
                    v.tone,
                  )}
                >
                  {v.title}
                  <span className="mt-0.5 block font-normal opacity-70">
                    Repeats weekly
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

const BARS = [38, 52, 46, 64, 58, 72, 80, 68, 88, 94, 86, 100];

export function ReportsMock() {
  return (
    <AppShell active="Reports" title="Reports" subtitle="Last 12 months">
      <div className="grid gap-2.5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <p className="text-[12px] font-semibold text-slate-900">
            Invoiced vs. collected
          </p>
          <div className="mt-4 flex h-36 items-end gap-1.5">
            {BARS.map((h, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
                key={i}
                className="flex flex-1 items-end gap-0.5"
                style={{ height: "100%" }}
              >
                <div
                  className="grow-bar flex-1 rounded-t-sm bg-indigo-200"
                  style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                />
                <div
                  className="grow-bar flex-1 rounded-t-sm bg-gradient-to-t from-indigo-600 to-violet-500"
                  style={{
                    height: `${h * 0.86}%`,
                    animationDelay: `${i * 60 + 30}ms`,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-2.5">
          {[
            [
              "Estimate win rate",
              "68%",
              "w-[68%]",
              "from-indigo-500 to-violet-500",
            ],
            [
              "Collected on time",
              "91%",
              "w-[91%]",
              "from-emerald-500 to-teal-400",
            ],
            [
              "Avg. days to paid",
              "6.2",
              "w-[40%]",
              "from-amber-400 to-orange-500",
            ],
          ].map(([label, value, width, grad]) => (
            <Card key={label}>
              <div className="flex items-baseline justify-between">
                <p className="text-[10.5px] text-slate-500">{label}</p>
                <p className="text-[15px] font-bold text-slate-900">{value}</p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    width,
                    grad,
                  )}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Floating toasts used around the hero                                 */
/* ------------------------------------------------------------------ */

export function FloatingToast({
  Icon,
  title,
  meta,
  tone,
  className,
  style,
}: {
  Icon: typeof Zap;
  title: string;
  meta: string;
  tone: "emerald" | "violet" | "indigo";
  className?: string;
  style?: React.CSSProperties;
}) {
  const tones = {
    emerald: "bg-emerald-500/15 text-emerald-500",
    violet: "bg-violet-500/15 text-violet-500",
    indigo: "bg-indigo-500/15 text-indigo-500",
  };
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-white/60 bg-white px-3.5 py-3 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.45)] backdrop-blur-md",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl",
          tones[tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[12.5px] font-semibold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500">{meta}</p>
      </div>
    </div>
  );
}

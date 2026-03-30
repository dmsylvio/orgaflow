import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Layers,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Estimates & invoices for small businesses",
  description:
    "Orgaflow is an all-in-one CRM to create estimates and invoices, accept payments, manage tasks, and automate workflows for small businesses.",
  keywords: [
    "estimate software",
    "invoice software",
    "quoting software",
    "small business CRM",
    "payments",
    "tasks",
    "workflow automation",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Estimates & invoices for small businesses",
    description:
      "Create estimates and invoices, accept payments, manage tasks, and automate workflows in one place.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "Estimates & invoices for small businesses",
    description:
      "Create estimates and invoices, accept payments, manage tasks, and automate workflows in one place.",
  },
};

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */

const STATS = [
  { value: "200+", label: "Businesses" },
  { value: "98.9%", label: "Uptime" },
  { value: "120k", label: "Invoices" },
  { value: "4.9★", label: "Rating" },
];

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "Founder, Pixel & Co.",
    avatar: "SM",
    avatarColor: "bg-violet-100 text-violet-700",
    content:
      "Our quoting-to-payment cycle went from 2 weeks to 3 days. Orgaflow replaced three separate tools overnight.",
    stars: 5,
  },
  {
    name: "Marcos Oliveira",
    role: "CEO, BuildRight",
    avatar: "MO",
    avatarColor: "bg-blue-100 text-blue-700",
    content:
      "The automation features alone save us 5+ hours a week. Tasks are created the moment a client pays.",
    stars: 5,
  },
  {
    name: "Julia Chen",
    role: "Operations Lead, Craft Studio",
    avatar: "JC",
    avatarColor: "bg-emerald-100 text-emerald-700",
    content:
      "Finally a platform that actually understands how small businesses work. The Kanban linked to invoices is a game-changer.",
    stars: 5,
  },
];

const STAR_KEYS = ["1", "2", "3", "4", "5"] as const;

/* ─────────────────────────────────────────────
   Mini UI mockups (pure CSS / Tailwind)
───────────────────────────────────────────── */

function _InvoiceMockup() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      {/* toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="h-2 w-24 rounded-full bg-muted" />
        <div className="h-2 w-8 rounded-full bg-muted" />
      </div>
      {/* content */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-1 h-2.5 w-20 rounded-full bg-foreground/80" />
            <div className="h-2 w-32 rounded-full bg-muted" />
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            PAID
          </span>
        </div>
        <div className="mb-3 space-y-1.5">
          {[80, 60, 70].map((w) => (
            <div key={w} className="flex items-center justify-between">
              <div
                className={`h-2 rounded-full bg-muted`}
                style={{ width: `${w}%` }}
              />
              <div className="h-2 w-10 rounded-full bg-muted" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2.5">
          <div className="h-2 w-12 rounded-full bg-muted" />
          <div className="h-3 w-16 rounded-full bg-primary/20" />
        </div>
      </div>
    </div>
  );
}

function KanbanMockup() {
  const cols = [
    {
      label: "To Do",
      color: "bg-slate-100",
      dot: "bg-slate-400",
      cards: ["Design mockup", "Client call"],
      count: 2,
    },
    {
      label: "In Progress",
      color: "bg-primary/8",
      dot: "bg-primary",
      cards: ["Invoice #034", "Setup meeting"],
      count: 2,
    },
    {
      label: "Done",
      color: "bg-emerald-50",
      dot: "bg-emerald-500",
      cards: ["Estimate sent", "Contract signed"],
      count: 2,
    },
  ];
  return (
    <div className="flex gap-2 overflow-hidden">
      {cols.map(({ label, color, dot, cards }) => (
        <div key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5 px-0.5">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className="text-[10px] font-semibold text-foreground/70">
              {label}
            </span>
          </div>
          {cards.map((card) => (
            <div
              key={card}
              className={`rounded-lg border border-border ${color} px-2.5 py-2`}
            >
              <div className="mb-1 h-1.5 w-full rounded-full bg-foreground/10" />
              <p className="text-[9px] font-medium text-foreground/60 leading-tight">
                {card}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AutomationFlowMockup() {
  const steps = [
    {
      icon: CreditCard,
      label: "Invoice paid",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      icon: Zap,
      label: "Trigger fires",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      icon: CheckCircle2,
      label: "Task created",
      color: "text-primary",
      bg: "bg-primary/8",
      border: "border-primary/20",
    },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map(({ icon: Icon, label, color, bg, border }, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex flex-col items-center gap-1.5 rounded-xl border ${border} ${bg} px-3 py-2.5`}
          >
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-[10px] font-semibold text-foreground/70 whitespace-nowrap">
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </div>
  );
}

function CRMMockup() {
  const customers = [
    {
      name: "Acme Corp",
      status: "Active",
      value: "$3,400",
      color: "bg-blue-100 text-blue-700",
    },
    {
      name: "Pixel & Co.",
      status: "Lead",
      value: "$1,200",
      color: "bg-violet-100 text-violet-700",
    },
    {
      name: "BuildRight",
      status: "Active",
      value: "$5,800",
      color: "bg-emerald-100 text-emerald-700",
    },
  ];
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between bg-muted/50 px-3 py-2">
        <span className="text-[11px] font-semibold text-foreground/70">
          Customers
        </span>
        <span className="text-[10px] text-muted-foreground">3 of 200</span>
      </div>
      {customers.map(({ name, status, value, color }) => (
        <div key={name} className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${color}`}
            >
              {name[0]}
            </div>
            <span className="text-[11px] font-medium text-foreground">
              {name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${color}`}
            >
              {status}
            </span>
            <span className="text-[11px] font-semibold text-foreground">
              {value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportMockup() {
  const bars = [
    { id: "b1", height: 45 },
    { id: "b2", height: 72 },
    { id: "b3", height: 60 },
    { id: "b4", height: 88 },
    { id: "b5", height: 55 },
    { id: "b6", height: 95 },
    { id: "b7", height: 78 },
  ];
  const days = [
    { id: "mon", label: "M" },
    { id: "tue", label: "T" },
    { id: "wed", label: "W" },
    { id: "thu", label: "T" },
    { id: "fri", label: "F" },
    { id: "sat", label: "S" },
    { id: "sun", label: "S" },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Revenue this month</p>
          <p className="text-xl font-bold text-foreground">$18,340</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <TrendingUp className="h-3 w-3" />
          +24%
        </span>
      </div>
      <div className="flex items-end justify-between gap-1 h-14">
        {bars.map(({ id, height }, i) => (
          <div
            key={id}
            className={`flex-1 rounded-t-md ${i === bars.length - 1 ? "bg-primary" : "bg-primary/20"}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {days.map(({ id, label }) => (
          <span key={id} className="flex-1 text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pb-0 pt-20">
        {/* background blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/8 to-transparent blur-[80px]" />
          <div className="absolute -left-32 top-40 h-80 w-80 rounded-full bg-violet-200/50 blur-[60px]" />
          <div className="absolute -right-32 top-56 h-80 w-80 rounded-full bg-cyan-200/40 blur-[60px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          {/* badge */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-2.5 text-xs font-semibold text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-primary" />
            </span>
            Now live — built for small businesses
          </div>

          <h1 className="mx-auto mb-6 max-w-4xl text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.1] tracking-tight text-foreground">
            The smarter way to run{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                your business
              </span>
              <svg
                aria-hidden
                viewBox="0 0 300 12"
                className="absolute -bottom-2 left-0 w-full"
                fill="none"
              >
                <title>Decorative underline</title>
                <path
                  d="M2 8 C60 3, 140 10, 298 4"
                  stroke="url(#underline-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="underline-grad"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="hsl(243,75%,59%)" />
                    <stop offset="100%" stopColor="hsl(189,94%,43%)" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Estimates, invoices, payments, automations, and tasks — all in one
            platform built for small teams that want to close more deals with
            less busywork.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="h-12 gap-2 px-8 shadow-xl shadow-primary/20 text-base"
            >
              <NextLink href="/register">
                Start 15-day trial
                <ArrowRight className="h-4 w-4" />
              </NextLink>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 px-8 text-base"
            >
              <NextLink href="/pricing">See pricing</NextLink>
            </Button>
          </div>
        </div>

        {/* Dashboard image */}
        <div className="relative mx-auto mt-16 max-w-6xl px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-40 max-w-3xl rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/10 ring-1 ring-border">
            {/* Browser bar */}
            <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="flex h-6 w-52 items-center justify-center rounded-md bg-background px-3 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border">
                  orgaflow.dev/app
                </div>
              </div>
              <div className="w-12" />
            </div>

            {/* Screenshot */}
            <Image
              src="/screencapture-orgaflow.png"
              alt="Orgaflow dashboard"
              className="w-full"
              width={1920}
              height={1080}
              quality={100}
              priority
              unoptimized
            />
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-background via-background/80 to-transparent"
          />
        </div>

        {/* stats strip — overlaps image */}
        <div className="relative mx-auto -mt-8 max-w-6xl px-6">
          <div className="flex divide-x divide-border overflow-hidden rounded-2xl border border-border bg-background/80 shadow-lg backdrop-blur-sm">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-1 flex-col items-center py-6 px-4"
              >
                <span className="text-2xl font-bold text-foreground sm:text-3xl">
                  {value}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section id="features" className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Features
            </p>
            <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Everything your team needs,{" "}
              <span className="text-muted-foreground font-normal">
                nothing it doesn't
              </span>
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-12 gap-4">
            {/* ── LARGE: Estimates → Invoice flow ── */}
            <div className="col-span-12 md:col-span-7 rounded-2xl border border-border bg-gradient-to-br from-violet-50 to-background p-7 shadow-sm">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-foreground">
                Estimates & Invoices
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Create professional quotes, get client approval via a secure
                link, and convert to invoice in one click. PDF export included.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                {[
                  "Client approves via shareable link",
                  "Convert estimate → invoice instantly",
                  "PDF export with your branding",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <Check className="h-4 w-4 shrink-0 text-violet-600" />
                    {f}
                  </div>
                ))}
              </div>
              {/* Mini flow */}
              <div className="mt-6 flex items-center gap-2">
                {["Draft", "Sent", "Approved", "Invoiced", "Paid"].map(
                  (step, i) => (
                    <div key={step} className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          i === 2
                            ? "bg-violet-600 text-white"
                            : i < 2
                              ? "bg-violet-100 text-violet-700"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step}
                      </span>
                      {i < 4 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* ── SMALL: CRM ── */}
            <div className="col-span-12 md:col-span-5 rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-background p-7 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-foreground">
                Customer CRM
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                All your clients in one place. Track history, activity, linked
                estimates and invoices — scoped per workspace.
              </p>
              <div className="mt-5">
                <CRMMockup />
              </div>
            </div>

            {/* ── LARGE SPOTLIGHT: Automations + Tasks ── */}
            <div className="col-span-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-violet-50/60 to-amber-50/40 p-8 shadow-sm overflow-hidden relative">
              {/* decorative blob */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-amber-300/15 blur-3xl"
              />

              <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
                {/* Left: copy */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                      <CheckCircle2 className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Automations + Tasks — <br />
                    <span className="text-primary">your team on autopilot</span>
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    When a client pays an invoice or approves an estimate,
                    Orgaflow automatically creates tasks and assigns them to the
                    right team members. No manual handoffs, no sticky notes, no
                    dropped balls.
                  </p>
                  <div className="mt-5 flex flex-col gap-2.5">
                    {[
                      "Set triggers: invoice paid, estimate approved, and more",
                      "Auto-create tasks with title, assignee, and due date",
                      "Track everything on a visual Kanban board",
                      "Customize stages to match your exact workflow",
                    ].map((f) => (
                      <div
                        key={f}
                        className="flex items-start gap-2.5 text-sm text-foreground/80"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Button asChild className="mt-7 shadow-md shadow-primary/20">
                    <NextLink href="/pricing">
                      See which plans include automations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </NextLink>
                  </Button>
                </div>

                {/* Right: visual */}
                <div className="flex flex-col gap-4">
                  {/* Automation flow */}
                  <div className="rounded-xl border border-border bg-background/90 p-4 shadow-sm backdrop-blur-sm">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Automation rule
                    </p>
                    <AutomationFlowMockup />
                    <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        → Task:
                      </span>{" "}
                      "Deliver project files" assigned to{" "}
                      <span className="font-medium text-primary">Lucas M.</span>{" "}
                      · Due in 3 days
                    </div>
                  </div>

                  {/* Kanban */}
                  <div className="rounded-xl border border-border bg-background/90 p-4 shadow-sm backdrop-blur-sm">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Task board
                    </p>
                    <KanbanMockup />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Reports ── */}
            <div className="col-span-12 md:col-span-5 rounded-2xl border border-border bg-gradient-to-br from-rose-50 to-background p-7 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                <BarChart3 className="h-5 w-5 text-rose-600" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-foreground">
                Reports & Analytics
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Revenue by period, outstanding invoices, conversion rates —
                every number that matters to your business.
              </p>
              <div className="mt-5">
                <ReportMockup />
              </div>
            </div>

            {/* ── Payments ── */}
            <div className="col-span-12 md:col-span-7 rounded-2xl border border-border bg-gradient-to-br from-emerald-50 to-background p-7 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-foreground">
                Payments & Collections
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Record payments manually or let clients pay online via Stripe.
                Track what's been collected and what's outstanding — per
                invoice, per client, per period.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Collected",
                    value: "$18,340",
                    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
                  },
                  {
                    label: "Outstanding",
                    value: "$4,200",
                    color: "bg-amber-50 border-amber-200 text-amber-700",
                  },
                  {
                    label: "Overdue",
                    value: "$890",
                    color: "bg-rose-50 border-rose-200 text-rose-700",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className={`rounded-xl border px-3 py-3 ${color}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-1.5">
                {[
                  "Log payments against invoices",
                  "Stripe Connect for online payments (Scale plan)",
                  "Status auto-updates when fully paid",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-sm text-foreground/75"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-muted/40 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              How it works
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your workspace",
                description:
                  "Sign up, name your organization, and invite your team. Configure currencies, taxes, and preferences.",
                accent: "bg-primary/8 border-primary/20 text-primary",
              },
              {
                step: "02",
                title: "Add clients & send quotes",
                description:
                  "Import or add clients, build estimates with line items, and share a secure link for client approval.",
                accent: "bg-violet-50 border-violet-200 text-violet-700",
              },
              {
                step: "03",
                title: "Invoice, collect & automate",
                description:
                  "Convert approved quotes to invoices, collect payments, and let automations handle task creation.",
                accent: "bg-emerald-50 border-emerald-200 text-emerald-700",
              },
            ].map(({ step, title, description, accent }) => (
              <div
                key={step}
                className="rounded-2xl border border-border bg-background p-7 shadow-sm"
              >
                <div
                  className={`mb-5 inline-flex rounded-xl border px-3 py-1.5 text-sm font-bold ${accent}`}
                >
                  {step}
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Testimonials
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Loved by growing teams
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map(
              ({ name, role, avatar, avatarColor, content, stars }) => (
                <div
                  key={name}
                  className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-7 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-0.5">
                    {STAR_KEYS.slice(0, stars).map((k) => (
                      <Star
                        key={`${name}-star-${k}`}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-foreground/75">
                    &ldquo;{content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-border pt-5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}
                    >
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-24 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
            </div>
            <div className="relative">
              <Layers className="mx-auto mb-6 h-14 w-14 text-white/70" />
              <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                Ready to grow faster?
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-lg text-white/70">
                Join 200+ businesses already saving time and closing more deals
                with Orgaflow. Set up takes under 5 minutes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  size="lg"
                  asChild
                  className="h-12 bg-white px-10 text-base text-primary shadow-2xl hover:bg-white/95"
                >
                  <NextLink href="/register">
                    Start 15-day trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </NextLink>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="h-12 px-8 text-base text-white/80 hover:bg-white/15 hover:text-white"
                >
                  <NextLink href="/contact">Talk to sales</NextLink>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

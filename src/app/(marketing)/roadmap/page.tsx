import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  Eye,
  FileSearch,
  FileText,
  History,
  Layers,
  Mail,
  Paperclip,
  RefreshCw,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "See what we're building next. Our public roadmap shows upcoming features and their priorities.",
  alternates: { canonical: "/roadmap" },
  openGraph: {
    title: "Roadmap — Orgaflow",
    description:
      "See what we're building next. Our public roadmap shows upcoming features and their priorities.",
    url: "/roadmap",
    type: "website",
  },
  twitter: {
    title: "Roadmap — Orgaflow",
    description:
      "See what we're building next. Our public roadmap shows upcoming features and their priorities.",
  },
};

type Status = "shipped" | "in-progress" | "planned" | "considering";

interface RoadmapItem {
  id: number;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: Status;
  effort: "Low" | "Medium" | "High";
  category: string;
}

const ITEMS: RoadmapItem[] = [
  {
    id: 1,
    Icon: Paperclip,
    title: "File Attachments",
    description:
      "Attach receipts, contracts, and files to expenses, estimates, and invoices. Client-visible toggle controls what appears on public estimate pages.",
    status: "shipped",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 2,
    Icon: CheckCircle2,
    title: "Client Approve / Reject Flow",
    description:
      "Clients can approve or reject estimates directly from the public link. Rejection includes an optional rich-text reason shown back to the sender.",
    status: "shipped",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 13,
    Icon: FileText,
    title: "Public Estimate Page Redesign",
    description:
      "Professional document-style layout for client-facing estimate pages. Sticky approve/reject bar, rich-text notes, attachment grid with thumbnails, and highlighted totals.",
    status: "shipped",
    effort: "Low",
    category: "UX",
  },
  {
    id: 3,
    Icon: FileText,
    title: "PDF Export",
    description:
      "Download estimates and invoices as professional PDFs — from the admin dashboard and directly from the client-facing public page.",
    status: "shipped",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 4,
    Icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Revenue vs expenses chart, estimate approval rates, invoice status breakdown, and top customers — with a 3/6/12-month period selector.",
    status: "shipped",
    effort: "High",
    category: "Analytics",
  },
  {
    id: 14,
    Icon: Mail,
    title: "Document Viewed Notifications",
    description:
      "Email notifications when a client opens an estimate or invoice for the first time. Configurable per toggle in Settings → Notifications.",
    status: "shipped",
    effort: "Low",
    category: "Communication",
  },
  {
    id: 15,
    Icon: Settings,
    title: "Settings Routing",
    description:
      "Settings home now redirects directly to Company Settings. Dead links removed and unknown routes return a proper 404.",
    status: "shipped",
    effort: "Low",
    category: "Platform",
  },
  {
    id: 16,
    Icon: BarChart3,
    title: "Live Dashboard",
    description:
      "Real KPIs, a 12-month revenue area chart, pending estimates and invoices panels, and a recent activity feed — all with live data.",
    status: "shipped",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 18,
    Icon: Eye,
    title: "Per-Module Price Visibility Permissions",
    description:
      "Six granular permissions (one per module) let owners restrict which team members can see monetary amounts — prices, totals, and financial charts are hidden server-side and in the UI.",
    status: "shipped",
    effort: "Medium",
    category: "RBAC",
  },
  {
    id: 19,
    Icon: Layers,
    title: "Task Side Drawers & Linked Document Review",
    description:
      "Tasks now open in dedicated right-side drawers with wider editing space, explicit close actions, and a second layered drawer for reviewing linked invoices and estimates without leaving the board.",
    status: "shipped",
    effort: "Low",
    category: "UX",
  },
  {
    id: 20,
    Icon: Zap,
    title: "Tasks Linked to Invoices & Estimates",
    description:
      "Tasks and automations can now attach related invoices and estimates directly, making follow-up work easier to review and act on from the task flow.",
    status: "shipped",
    effort: "Medium",
    category: "Automation",
  },
  {
    id: 21,
    Icon: Mail,
    title: "Expanded Notification Events",
    description:
      "Notification settings now cover more lifecycle events, including estimate status updates, overdue invoices, and payment received emails.",
    status: "shipped",
    effort: "Medium",
    category: "Communication",
  },
  {
    id: 22,
    Icon: CreditCard,
    title: "Checkout Currency & Promo Codes",
    description:
      "Stripe checkout now supports organization currency and promotion codes, with cleaner success and cancel routing for subscription flows.",
    status: "shipped",
    effort: "Low",
    category: "Billing",
  },
  {
    id: 17,
    Icon: ShieldCheck,
    title: "Payment Reliability & Retry Flow",
    description:
      "Plan gates now enforce subscription status — incomplete or canceled subscriptions can no longer access paid features. Global banner alerts for failed payments, dedicated billing section with one-click portal access, and webhook sync for expired checkout sessions.",
    status: "shipped",
    effort: "Medium",
    category: "Billing",
  },
  {
    id: 5,
    Icon: Mail,
    title: "Extended Notifications",
    description:
      "More notification triggers: estimate approved or rejected, invoice due, payment received. Configurable per event with per-user preferences.",
    status: "planned",
    effort: "Low",
    category: "Communication",
  },
  {
    id: 6,
    Icon: Settings,
    title: "Expanded Settings",
    description:
      "Deeper settings coverage: document branding, custom number formats, and additional customization options.",
    status: "planned",
    effort: "Low",
    category: "Platform",
  },
  {
    id: 6,
    Icon: CreditCard,
    title: "Online Payments via Stripe",
    description:
      "Let clients pay invoices directly online via Stripe Connect. Generate a payment link and track status automatically. Available on the Scale plan.",
    status: "in-progress",
    effort: "High",
    category: "Payments",
  },
  {
    id: 7,
    Icon: Layers,
    title: "Multi-Currency with Live Rates",
    description:
      "Automatic exchange rate fetching and conversion logic for businesses working with international clients.",
    status: "planned",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 8,
    Icon: FileSearch,
    title: "Advanced Search & Filters",
    description:
      "Full-text search, date range filters, client filters, and amount filters across estimates, invoices, and customers.",
    status: "planned",
    effort: "Medium",
    category: "UX",
  },
  {
    id: 9,
    Icon: History,
    title: "Activity Log & Audit Trail",
    description:
      "See who did what and when — approvals, edits, sends, payments — with a visible timeline on every document.",
    status: "considering",
    effort: "Medium",
    category: "Platform",
  },
  {
    id: 10,
    Icon: CheckCircle2,
    title: "Bulk Actions",
    description:
      "Select multiple estimates or invoices to change status, delete, or send in a single action.",
    status: "considering",
    effort: "Low",
    category: "UX",
  },
  {
    id: 11,
    Icon: Zap,
    title: "Document Templates & Custom Branding",
    description:
      "Upload your logo, pick your colors, and customize the header and footer of your estimates and invoices.",
    status: "considering",
    effort: "High",
    category: "Customization",
  },
  {
    id: 12,
    Icon: RefreshCw,
    title: "Recurring Invoices",
    description:
      "Schedule invoices to be generated automatically on a set interval — ideal for monthly retainers and ongoing contracts.",
    status: "considering",
    effort: "High",
    category: "Automation",
  },
];

const STATUS_CONFIG: Record<
  Status,
  { label: string; dot: string; badge: string; text: string }
> = {
  shipped: {
    label: "Shipped",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
  },
  "in-progress": {
    label: "In Progress",
    dot: "bg-primary",
    badge: "bg-primary/10 border-primary/20",
    text: "text-primary",
  },
  planned: {
    label: "Planned",
    dot: "bg-amber-500",
    badge: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
  },
  considering: {
    label: "Considering",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted border-border",
    text: "text-muted-foreground",
  },
};

const EFFORT_CONFIG: Record<
  "Low" | "Medium" | "High",
  { label: string; color: string }
> = {
  Low: { label: "Low effort", color: "text-emerald-600" },
  Medium: { label: "Medium effort", color: "text-amber-600" },
  High: { label: "High effort", color: "text-rose-600" },
};

const COLUMNS: { status: Status; title: string; description: string }[] = [
  {
    status: "shipped",
    title: "Recently Shipped",
    description: "Released in the last cycle",
  },
  {
    status: "in-progress",
    title: "In Progress",
    description: "Actively being built",
  },
  {
    status: "planned",
    title: "Planned",
    description: "Confirmed for upcoming cycles",
  },
  {
    status: "considering",
    title: "Considering",
    description: "On our radar, not yet scheduled",
  },
];

export default function RoadmapPage() {
  const lastUpdated = "April 2, 2026 (v1.5.1)";

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative pb-16 pt-20 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Roadmap
          </p>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            What we're building next
          </h1>
          <p className="text-lg text-muted-foreground">
            Our roadmap is public. We believe you deserve to know what's coming
            and when. Updated regularly as priorities shift.
          </p>
          <p className="mt-4 text-xs text-muted-foreground/60">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Legend */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="flex flex-wrap items-center justify-center gap-5">
          {COLUMNS.map(({ status, title, description }) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-sm font-medium text-foreground">
                  {title}
                </span>
                <span className="text-sm text-muted-foreground">
                  — {description}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Board */}
      <section className="mx-auto max-w-7xl px-6 pb-28">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {COLUMNS.map(({ status, title }) => {
            const cfg = STATUS_CONFIG[status];
            const items = ITEMS.filter((i) => i.status === status);

            return (
              <div key={status}>
                {/* Column header */}
                <div className="mb-4 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  <h2 className="font-semibold text-foreground">{title}</h2>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3">
                  {items.map(
                    ({ id, Icon, title: itemTitle, description, effort, category }) => {
                      const effortCfg = EFFORT_CONFIG[effort];

                      return (
                        <div
                          key={id}
                          className="rounded-2xl border border-border bg-background p-5 shadow-sm"
                        >
                          {/* Top row */}
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span
                              className={`mt-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge} ${cfg.text}`}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <h3 className="mb-1.5 font-semibold text-foreground">
                            {itemTitle}
                          </h3>
                          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                            {description}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                              {category}
                            </span>
                            <span className={`text-xs font-medium ${effortCfg.color}`}>
                              {effortCfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feedback CTA */}
      <section className="border-t border-border bg-muted/40 py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            Missing something?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Our roadmap is shaped by customer feedback. If there's a feature you
            need that isn't here, we want to hear about it.
          </p>
          <Button asChild className="shadow-md shadow-primary/20">
            <NextLink href="/contact">Request a feature</NextLink>
          </Button>
        </div>
      </section>
    </div>
  );
}

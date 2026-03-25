import {
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSearch,
  FileText,
  History,
  Layers,
  Mail,
  Paperclip,
  RefreshCw,
  Settings,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Roadmap — Orgaflow",
  description:
    "See what we're building next. Our public roadmap shows upcoming features and their priorities.",
};

type Status = "in-progress" | "planned" | "considering";

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
      "Attach receipts, contracts, and files to expenses, estimates, and invoices. Stored securely with per-plan quotas (1 GB on Growth, 10 GB on Scale).",
    status: "in-progress",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 4,
    Icon: FileText,
    title: "PDF Export",
    description:
      "Download estimates and invoices as professional PDFs — both from the internal dashboard and from the client-facing public pages.",
    status: "in-progress",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 5,
    Icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Revenue by period, estimate approval rates, expenses by category, and profitability per client. Visual charts included.",
    status: "in-progress",
    effort: "High",
    category: "Analytics",
  },
  {
    id: 3,
    Icon: Mail,
    title: "Notification System",
    description:
      "Email notifications for key events: invoice due, estimate approved or rejected, payment received, and more. Configurable per user.",
    status: "planned",
    effort: "Low",
    category: "Communication",
  },
  {
    id: 2,
    Icon: Settings,
    title: "Expanded Settings",
    description:
      "Full settings coverage across all sections including dynamic routing. Currently some settings sections are stubs.",
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
    status: "planned",
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
  const lastUpdated = "March 24, 2026";

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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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

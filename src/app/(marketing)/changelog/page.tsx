import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new in Orgaflow. Every update, fix, and improvement.",
  alternates: { canonical: "/changelog" },
};

interface ChangelogEntry {
  version: string;
  date: string;
  badge: "major" | "minor" | "patch";
  summary: string;
  changes: {
    type: "new" | "improved" | "fixed" | "removed";
    text: string;
  }[];
}

const ENTRIES: ChangelogEntry[] = [
  {
    version: "0.9.0",
    date: "March 24, 2026",
    badge: "minor",
    summary: "Public marketing pages, roadmap, and billing improvements.",
    changes: [
      { type: "new", text: "Public marketing site with landing, pricing, about, contact, roadmap, and changelog pages." },
      { type: "new", text: "Roadmap page listing all upcoming features with status and effort indicators." },
      { type: "improved", text: "Billing settings now show storage usage progress bar per plan." },
      { type: "improved", text: "Upgrade flow now supports both monthly and annual intervals with a 30% annual discount." },
      { type: "fixed", text: "Billing portal button no longer appears when no Stripe customer exists." },
    ],
  },
  {
    version: "0.8.0",
    date: "March 10, 2026",
    badge: "minor",
    summary: "Workflow automations and expense categories.",
    changes: [
      { type: "new", text: "Workflow automations: trigger task creation automatically when an invoice is paid or estimate is approved." },
      { type: "new", text: "Expense categories: organize expenses into custom categories per organization." },
      { type: "new", text: "Automation rule editor with trigger, condition, and action steps." },
      { type: "improved", text: "Task board now supports custom stages configurable from settings." },
      { type: "improved", text: "Estimates and invoices now support rich-text notes per line item." },
      { type: "fixed", text: "Currency picker now correctly filters by active organization currencies." },
    ],
  },
  {
    version: "0.7.0",
    date: "February 21, 2026",
    badge: "minor",
    summary: "Team roles, RBAC permissions, and invite system.",
    changes: [
      { type: "new", text: "Role-based access control (RBAC): create custom roles with granular permissions per resource." },
      { type: "new", text: "Team invite system: invite members via email link with role assignment." },
      { type: "new", text: "Owners bypass all permission checks and have full access to org settings." },
      { type: "improved", text: "Settings sidebar now groups sections by category with permission-aware visibility." },
      { type: "improved", text: "Workspace switcher redesigned with organization avatar and quick access." },
      { type: "fixed", text: "Fixed session not refreshing after organization switch in some browsers." },
    ],
  },
  {
    version: "0.6.0",
    date: "February 5, 2026",
    badge: "minor",
    summary: "Payments, expenses, and multi-workspace support.",
    changes: [
      { type: "new", text: "Payments module: record and track payments linked to invoices." },
      { type: "new", text: "Expenses module: log business expenses with category, amount, and date." },
      { type: "new", text: "Multi-workspace: users can belong to multiple organizations and switch between them." },
      { type: "improved", text: "Invoice status now automatically updates to PAID when full payment is recorded." },
      { type: "improved", text: "Dashboard stat cards now reflect real data from the active workspace." },
    ],
  },
  {
    version: "0.5.0",
    date: "January 18, 2026",
    badge: "minor",
    summary: "Task board (Kanban) and public invoice pages.",
    changes: [
      { type: "new", text: "Kanban task board: create, assign, and move tasks across custom stages." },
      { type: "new", text: "Public invoice page: clients can view their invoice via a secure token link." },
      { type: "new", text: "Public estimate page: clients can approve or reject estimates via a shareable link." },
      { type: "improved", text: "Estimates can now be converted to invoices in a single click." },
      { type: "fixed", text: "Fixed line item totals not recalculating when tax type is changed." },
    ],
  },
  {
    version: "0.4.0",
    date: "January 4, 2026",
    badge: "minor",
    summary: "Invoices module and item catalog.",
    changes: [
      { type: "new", text: "Invoices: create, send, and manage invoices with line items, taxes, and discounts." },
      { type: "new", text: "Item catalog: define reusable products and services with default price and unit." },
      { type: "new", text: "Tax types: configure organization-level tax rates applied to line items." },
      { type: "improved", text: "Estimate editor now shares the same line item component as invoices." },
    ],
  },
  {
    version: "0.3.0",
    date: "December 15, 2025",
    badge: "minor",
    summary: "Estimates and customer management.",
    changes: [
      { type: "new", text: "Estimates module: create and send professional estimates to customers." },
      { type: "new", text: "Customer management: full CRM with contact details, history, and notes." },
      { type: "new", text: "Currency and language pickers for internationalization support." },
      { type: "improved", text: "Organization settings expanded with company info, address, and preferences." },
    ],
  },
  {
    version: "0.2.0",
    date: "November 28, 2025",
    badge: "minor",
    summary: "Authentication, organizations, and onboarding.",
    changes: [
      { type: "new", text: "Email/password authentication with Auth.js." },
      { type: "new", text: "Organization creation and onboarding flow." },
      { type: "new", text: "Password reset via email token." },
      { type: "new", text: "Dashboard skeleton with placeholder stat cards." },
    ],
  },
  {
    version: "0.1.0",
    date: "November 10, 2025",
    badge: "major",
    summary: "Initial private beta release.",
    changes: [
      { type: "new", text: "Project scaffolded with Next.js App Router, tRPC, Drizzle ORM, and PostgreSQL." },
      { type: "new", text: "Multi-tenant architecture with organization-scoped data isolation." },
      { type: "new", text: "Stripe subscription integration with Starter, Growth, and Scale plans." },
      { type: "new", text: "Role-based access control foundation and IAM permission catalog." },
    ],
  },
];

const BADGE_CONFIG = {
  major: { label: "Major", bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  minor: { label: "Minor", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  patch: { label: "Patch", bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

const TYPE_CONFIG = {
  new:      { label: "New",      dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  improved: { label: "Improved", dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  fixed:    { label: "Fixed",    dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  removed:  { label: "Removed",  dot: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
};

export default function ChangelogPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative pb-16 pt-20 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Changelog</p>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            What's new
          </h1>
          <p className="text-lg text-muted-foreground">
            Every update, improvement, and fix — documented as we ship. We release
            new versions every 1–2 weeks.
          </p>
        </div>
      </section>

      {/* Entries */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <div className="relative">
          {/* Timeline line */}
          <div
            aria-hidden
            className="absolute left-[11px] top-2 hidden h-full w-px bg-border sm:block"
          />

          <div className="flex flex-col gap-14">
            {ENTRIES.map(({ version, date, badge, summary, changes }) => {
              const badgeCfg = BADGE_CONFIG[badge];
              return (
                <div key={version} className="relative flex gap-6">
                  {/* Timeline dot */}
                  <div className="hidden shrink-0 sm:block">
                    <div className="mt-1 h-6 w-6 rounded-full border-2 border-border bg-background" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Header */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-foreground">
                        v{version}
                      </h2>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeCfg.bg} ${badgeCfg.text} ${badgeCfg.border}`}
                      >
                        {badgeCfg.label}
                      </span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {date}
                      </span>
                    </div>

                    <p className="mb-5 text-sm text-muted-foreground">{summary}</p>

                    {/* Change list */}
                    <div className="flex flex-col gap-2">
                      {changes.map(({ type, text }, i) => {
                        const typeCfg = TYPE_CONFIG[type];
                        return (
                          <div key={`${version}-${i}`} className="flex items-start gap-3">
                            <span
                              className={`mt-[3px] shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                            >
                              {typeCfg.label}
                            </span>
                            <p className="text-sm leading-relaxed text-foreground/80">{text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/40 py-20 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="mb-3 text-2xl font-bold text-foreground">Want to know what's coming?</h2>
          <p className="mb-8 text-muted-foreground">
            Check our public roadmap to see what's in progress and planned for upcoming releases.
          </p>
          <Button asChild variant="outline">
            <NextLink href="/roadmap">View roadmap</NextLink>
          </Button>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "What's new in Orgaflow. Every update, fix, and improvement — documented as we ship.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: "Changelog — Orgaflow",
    description:
      "What's new in Orgaflow. Every update, fix, and improvement — documented as we ship.",
    url: "/changelog",
    type: "website",
  },
  twitter: {
    title: "Changelog — Orgaflow",
    description:
      "What's new in Orgaflow. Every update, fix, and improvement — documented as we ship.",
  },
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
    version: "1.9.0",
    date: "April 11, 2026",
    badge: "minor",
    summary:
      "Three selectable PDF templates for invoices and estimates — Classic, Branded, and Modern — each with full logo and address support.",
    changes: [
      {
        type: "new",
        text: "PDF templates: choose between three layouts per document type (invoice and estimate). Templates are selected independently in Settings → Preferences → PDF templates.",
      },
      {
        type: "new",
        text: "Template 1 — Classic: centered logo or company name, horizontal divider, company address left / document details right, and a bordered total box.",
      },
      {
        type: "new",
        text: "Template 2 — Branded: full-width purple header band with logo left and document title in white on the right. Company address and customer info shown below.",
      },
      {
        type: "new",
        text: "Template 3 — Modern: split header with logo on the left and company address on the right, then customer block and document metadata side by side.",
      },
      {
        type: "improved",
        text: "All PDF exports now include the company logo (from Company Settings) and the formatted organization address directly inside the document.",
      },
      {
        type: "improved",
        text: "Customer billing address is now fetched and embedded in every generated PDF, eliminating the need to repeat it manually in notes.",
      },
    ],
  },
  {
    version: "1.8.0",
    date: "April 11, 2026",
    badge: "minor",
    summary:
      "Company logo upload, file visibility toggle on estimates, attachments on public invoices, real storage tracking, and automatic blob cleanup on deletions.",
    changes: [
      {
        type: "new",
        text: "Company Settings now has a dedicated Logo section — upload a PNG/JPG/WebP/SVG (max 5 MB), preview it inline, and remove it with one click. The logo is stored on Vercel Blob and appears on document pages.",
      },
      {
        type: "new",
        text: "Each file attached to an estimate now has a visibility toggle (eye icon). Only files marked as visible are shown on the public estimate link — files default to hidden.",
      },
      {
        type: "new",
        text: "Public invoice pages now display an Attachments section with a file grid, matching the existing public estimate page experience.",
      },
      {
        type: "new",
        text: "File attachment storage usage in Billing settings now shows real data — bytes consumed are summed live from the database instead of a hardcoded zero.",
      },
      {
        type: "fixed",
        text: "Deleting an estimate or invoice now removes all associated files from Vercel Blob storage, preventing orphaned blobs from accumulating.",
      },
      {
        type: "fixed",
        text: "Deleting an organization now removes all document attachments and the company logo from blob storage before the record is deleted.",
      },
    ],
  },
  {
    version: "1.7.0",
    date: "April 11, 2026",
    badge: "minor",
    summary:
      "Mobile-first app shell — fully responsive layout with a slide-in drawer, mobile top bar, and user dropdown with account and logout actions.",
    changes: [
      {
        type: "new",
        text: "App shell is now fully responsive — on mobile the sidebar becomes a slide-in drawer from the left with a translucent backdrop and smooth CSS transition.",
      },
      {
        type: "new",
        text: "Mobile top bar with hamburger button, Orgaflow logo, and user avatar always visible on small screens.",
      },
      {
        type: "new",
        text: "Sidebar auto-closes when navigating to a new route on mobile, and the page body scroll is locked while the drawer is open.",
      },
      {
        type: "new",
        text: "Settings navigation on mobile renders as a scrollable horizontal pill-tab bar at the top of the content area, replacing the desktop secondary sidebar.",
      },
      {
        type: "new",
        text: "User dropdown in the sidebar footer and mobile header — opens a menu with Account Settings (links to /app/settings/account) and Log out actions.",
      },
    ],
  },
  {
    version: "1.6.0",
    date: "April 4, 2026",
    badge: "minor",
    summary:
      "Recurring Invoices — automatically generate invoices on a configurable schedule with optional auto-send.",
    changes: [
      {
        type: "new",
        text: "Recurring Invoices module: create templates that automatically generate invoices on a set frequency — every hour, day, week, 15 days, month, 6 months, or year.",
      },
      {
        type: "new",
        text: "Each template supports a start date, optional end limit by date or invoice count, and a due-date offset (e.g. net 30 days).",
      },
      {
        type: "new",
        text: "Send Automatically toggle: when enabled, the generated invoice is emailed to the customer immediately upon creation with a secure view link.",
      },
      {
        type: "new",
        text: "Template status lifecycle: Active, On Hold (paused manually), and Completed (set automatically when a limit is reached).",
      },
      {
        type: "new",
        text: "Edit page shows all previously generated invoices for a template with direct links to the invoice detail.",
      },
      {
        type: "new",
        text: "Dedicated sidebar menu item under Invoices, with its own IAM permissions (view, view-prices, create, edit, delete).",
      },
      {
        type: "new",
        text: "Server-side cron job fires every hour via Next.js instrumentation, processes due templates, copies line items, and advances nextRunAt automatically.",
      },
    ],
  },
  {
    version: "1.5.2",
    date: "April 2, 2026",
    badge: "patch",
    summary:
      "Marketing navbar now includes a cleaner authenticated user menu across desktop and mobile.",
    changes: [
      {
        type: "new",
        text: "Public marketing pages now show an authenticated user dropdown in the top navigation, including quick access to the active workspace and sign out.",
      },
      {
        type: "improved",
        text: "The user menu was adapted for both desktop and mobile layouts, with a more compact trigger and a mobile-friendly dropdown offset.",
      },
      {
        type: "fixed",
        text: "Dropdown layering and background styling were adjusted so the menu now renders cleanly above the navbar on changelog and other marketing pages.",
      },
    ],
  },
  {
    version: "1.5.1",
    date: "April 2, 2026",
    badge: "patch",
    summary:
      "Tasks workflow polish, richer notifications, and billing checkout improvements shipped together today.",
    changes: [
      {
        type: "improved",
        text: "Add Task and Edit Task now open in dedicated right-side drawers instead of centered dialogs, making it easier to work without losing board context.",
      },
      {
        type: "improved",
        text: "Linked invoices and estimates from tasks now open in a second side drawer when selected, creating a clearer layered workflow for reviewing related documents.",
      },
      {
        type: "improved",
        text: "Task drawers are wider and now include explicit close buttons in the header for faster navigation and a more app-like editing flow.",
      },
      {
        type: "fixed",
        text: "Linked task document currency payloads are now aligned with the shared CurrencyFormat contract, resolving production type-check failures during build.",
      },
      {
        type: "new",
        text: "Tasks and workflow automations now support linked invoices and estimates, so follow-up work can keep a direct connection to the related document.",
      },
      {
        type: "new",
        text: "Notification settings and event handling were expanded with new outbound emails for estimate status changes, overdue invoices, and received payments.",
      },
      {
        type: "new",
        text: "Public invoice PDF route added, making invoice PDFs available directly from the client-facing public flow.",
      },
      {
        type: "improved",
        text: "Stripe subscription checkout now supports organization currency and promotion codes during checkout creation.",
      },
      {
        type: "fixed",
        text: "Subscription checkout routing now uses the correct cancel URL and a shared base URL helper for a more reliable post-checkout success flow.",
      },
    ],
  },
  {
    version: "1.5.0",
    date: "April 1, 2026",
    badge: "minor",
    summary:
      "Per-module price visibility permissions — hide monetary amounts from team members on a per-module basis.",
    changes: [
      {
        type: "new",
        text: "Six new per-module permissions — invoice:view-prices, estimate:view-prices, expense:view-prices, item:view-prices, payment:view-prices, and dashboard:view-prices — assignable independently per role.",
      },
      {
        type: "new",
        text: "Monetary fields are stripped server-side when a member lacks the corresponding permission — the API never returns price data to unauthorized users.",
      },
      {
        type: "new",
        text: "Price columns, financial stat cards, revenue charts, and top-customer sections are hidden from the UI for members without view-prices permissions — no empty columns or zero placeholders.",
      },
      {
        type: "improved",
        text: "Create and edit permissions automatically include the corresponding view-prices dependency — members with write access always see the prices they are editing.",
      },
    ],
  },
  {
    version: "1.4.0",
    date: "March 29, 2026",
    badge: "minor",
    summary:
      "Subscription payment reliability — retry flow, payment banners, and status-aware plan gates.",
    changes: [
      {
        type: "fixed",
        text: "PlanGate and usePlanCheck now correctly block paid-plan features when the subscription status is incomplete, incomplete_expired, canceled, or paused — previously the plan field alone was checked, allowing access before payment was confirmed.",
      },
      {
        type: "new",
        text: "Global payment alert banner in the app shell: a persistent amber banner appears on every page when the subscription is past_due or unpaid, with a direct link to fix the payment.",
      },
      {
        type: "new",
        text: "Billing settings page now shows a dedicated payment failure section when the subscription is past_due or unpaid, with a one-click button to open the Stripe billing portal and update the payment method.",
      },
      {
        type: "new",
        text: "Webhook handler for checkout.session.expired: when a user abandons a checkout session and the 24-hour Stripe window closes, the subscription status is automatically updated to incomplete_expired so the UI can show a clear retry prompt.",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "March 26, 2026",
    badge: "minor",
    summary:
      "Live dashboard with KPIs, revenue chart, pending documents, and activity feed.",
    changes: [
      {
        type: "new",
        text: "Dashboard now shows real data: total customers, open estimates, open invoices, and revenue for the current month.",
      },
      {
        type: "new",
        text: "Revenue area chart for the last 12 months directly on the dashboard, with a link to the full reports page.",
      },
      {
        type: "new",
        text: "Pending estimates panel: lists all estimates with SENT or VIEWED status awaiting client response.",
      },
      {
        type: "new",
        text: "Invoices needing attention panel: lists SENT, VIEWED, OVERDUE, and partially paid invoices.",
      },
      {
        type: "new",
        text: "Recent activity feed: last 8 events across estimates, invoices, and payments — with relative timestamps and contextual icons.",
      },
      {
        type: "improved",
        text: "KPI cards are now clickable links that navigate directly to the relevant section.",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "March 26, 2026",
    badge: "minor",
    summary:
      "PDF export, reports & analytics, notification emails, and settings routing.",
    changes: [
      {
        type: "new",
        text: "PDF export for estimates and invoices — download from the admin detail pages or directly from the public client-facing page.",
      },
      {
        type: "new",
        text: "Reports page (/app/reports) with revenue vs expenses bar chart, estimate and invoice status pie charts, and top 5 customers by revenue.",
      },
      {
        type: "new",
        text: "Period selector on reports (3, 6, or 12 months) for revenue, expenses, and top customers.",
      },
      {
        type: "new",
        text: "Notification emails: owners receive an email when a client views an estimate or invoice for the first time. Configurable per toggle in Settings → Notifications.",
      },
      {
        type: "improved",
        text: "Settings home page now redirects directly to Company Settings instead of showing a stub screen.",
      },
      {
        type: "fixed",
        text: "Removed dead 'Customization' link from settings sidebar (section was not yet implemented).",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "March 26, 2026",
    badge: "minor",
    summary:
      "Redesigned public estimate page — professional document layout, all attachments visible, sticky approve/reject bar.",
    changes: [
      {
        type: "improved",
        text: "Public estimate page fully redesigned: clean document-style layout with clear typography hierarchy, summary cards, and a branded footer.",
      },
      {
        type: "improved",
        text: "All attached files are now always visible to the client on the public estimate page — no more per-file visibility toggle.",
      },
      {
        type: "improved",
        text: "Attachments displayed as a responsive card grid with image thumbnails, file icons, names, sizes, and direct download links.",
      },
      {
        type: "improved",
        text: "Approve / Reject actions moved to a sticky bar at the bottom of the screen — always accessible without scrolling.",
      },
      {
        type: "improved",
        text: "Notes on the public page now render rich text (HTML) instead of plain text, matching what was written in the editor.",
      },
      {
        type: "improved",
        text: "Rejection reason on the public page is rendered as rich text inside a highlighted banner.",
      },
      {
        type: "improved",
        text: "Line items redesigned as a clean table with divider rows instead of individual card backgrounds.",
      },
      {
        type: "improved",
        text: "Total amount visually highlighted in the summary cards with primary color to draw immediate attention.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "March 25, 2026",
    badge: "minor",
    summary:
      "File attachments across all documents, client approve/reject flow, and Notes/Files tabs.",
    changes: [
      {
        type: "new",
        text: "File attachments on expenses, estimates, and invoices — upload PDFs, images, and documents stored securely via Vercel Blob.",
      },
      {
        type: "new",
        text: "Clients can now approve or reject estimates directly from the public estimate link.",
      },
      {
        type: "new",
        text: "Rejection modal with optional rich-text reason. Rejection reason is displayed on the public page after submission.",
      },
      {
        type: "new",
        text: "Attachment grid on the public estimate page — clients see image thumbnails, file icons, and downloadable files.",
      },
      {
        type: "new",
        text: "Notes / Files tab switcher in create and edit forms for estimates and invoices. Files in create forms are uploaded right after saving.",
      },
      {
        type: "improved",
        text: "Expense detail page (/app/expenses/[id]) now shows receipts with download and delete.",
      },
      {
        type: "improved",
        text: "Estimate and invoice detail pages now have a full attachments section with upload and delete.",
      },
    ],
  },
  {
    version: "0.9.0",
    date: "March 24, 2026",
    badge: "minor",
    summary: "Public marketing pages, roadmap, and billing improvements.",
    changes: [
      {
        type: "new",
        text: "Public marketing site with landing, pricing, about, contact, roadmap, and changelog pages.",
      },
      {
        type: "new",
        text: "Roadmap page listing all upcoming features with status and effort indicators.",
      },
      {
        type: "improved",
        text: "Billing settings now show storage usage progress bar per plan.",
      },
      {
        type: "improved",
        text: "Upgrade flow now supports both monthly and annual intervals with a 30% annual discount.",
      },
      {
        type: "fixed",
        text: "Billing portal button no longer appears when no Stripe customer exists.",
      },
    ],
  },
  {
    version: "0.8.0",
    date: "March 10, 2026",
    badge: "minor",
    summary: "Workflow automations and expense categories.",
    changes: [
      {
        type: "new",
        text: "Workflow automations: trigger task creation automatically when an invoice is paid or estimate is approved.",
      },
      {
        type: "new",
        text: "Expense categories: organize expenses into custom categories per organization.",
      },
      {
        type: "new",
        text: "Automation rule editor with trigger, condition, and action steps.",
      },
      {
        type: "improved",
        text: "Task board now supports custom stages configurable from settings.",
      },
      {
        type: "improved",
        text: "Estimates and invoices now support rich-text notes per line item.",
      },
      {
        type: "fixed",
        text: "Currency picker now correctly filters by active organization currencies.",
      },
    ],
  },
  {
    version: "0.7.0",
    date: "February 21, 2026",
    badge: "minor",
    summary: "Team roles, RBAC permissions, and invite system.",
    changes: [
      {
        type: "new",
        text: "Role-based access control (RBAC): create custom roles with granular permissions per resource.",
      },
      {
        type: "new",
        text: "Team invite system: invite members via email link with role assignment.",
      },
      {
        type: "new",
        text: "Owners bypass all permission checks and have full access to org settings.",
      },
      {
        type: "improved",
        text: "Settings sidebar now groups sections by category with permission-aware visibility.",
      },
      {
        type: "improved",
        text: "Workspace switcher redesigned with organization avatar and quick access.",
      },
      {
        type: "fixed",
        text: "Fixed session not refreshing after organization switch in some browsers.",
      },
    ],
  },
  {
    version: "0.6.0",
    date: "February 5, 2026",
    badge: "minor",
    summary: "Payments, expenses, and multi-workspace support.",
    changes: [
      {
        type: "new",
        text: "Payments module: record and track payments linked to invoices.",
      },
      {
        type: "new",
        text: "Expenses module: log business expenses with category, amount, and date.",
      },
      {
        type: "new",
        text: "Multi-workspace: users can belong to multiple organizations and switch between them.",
      },
      {
        type: "improved",
        text: "Invoice status now automatically updates to PAID when full payment is recorded.",
      },
      {
        type: "improved",
        text: "Dashboard stat cards now reflect real data from the active workspace.",
      },
    ],
  },
  {
    version: "0.5.0",
    date: "January 18, 2026",
    badge: "minor",
    summary: "Task board (Kanban) and public invoice pages.",
    changes: [
      {
        type: "new",
        text: "Kanban task board: create, assign, and move tasks across custom stages.",
      },
      {
        type: "new",
        text: "Public invoice page: clients can view their invoice via a secure token link.",
      },
      {
        type: "new",
        text: "Public estimate page: clients can approve or reject estimates via a shareable link.",
      },
      {
        type: "improved",
        text: "Estimates can now be converted to invoices in a single click.",
      },
      {
        type: "fixed",
        text: "Fixed line item totals not recalculating when tax type is changed.",
      },
    ],
  },
  {
    version: "0.4.0",
    date: "January 4, 2026",
    badge: "minor",
    summary: "Invoices module and item catalog.",
    changes: [
      {
        type: "new",
        text: "Invoices: create, send, and manage invoices with line items, taxes, and discounts.",
      },
      {
        type: "new",
        text: "Item catalog: define reusable products and services with default price and unit.",
      },
      {
        type: "new",
        text: "Tax types: configure organization-level tax rates applied to line items.",
      },
      {
        type: "improved",
        text: "Estimate editor now shares the same line item component as invoices.",
      },
    ],
  },
  {
    version: "0.3.0",
    date: "December 15, 2025",
    badge: "minor",
    summary: "Estimates and customer management.",
    changes: [
      {
        type: "new",
        text: "Estimates module: create and send professional estimates to customers.",
      },
      {
        type: "new",
        text: "Customer management: full CRM with contact details, history, and notes.",
      },
      {
        type: "new",
        text: "Currency and language pickers for internationalization support.",
      },
      {
        type: "improved",
        text: "Organization settings expanded with company info, address, and preferences.",
      },
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
    summary: "Initial release.",
    changes: [
      {
        type: "new",
        text: "Project scaffolded with Next.js App Router, tRPC, Drizzle ORM, and PostgreSQL.",
      },
      {
        type: "new",
        text: "Multi-tenant architecture with organization-scoped data isolation.",
      },
      {
        type: "new",
        text: "Stripe subscription integration with Starter, Growth, and Scale plans.",
      },
      {
        type: "new",
        text: "Role-based access control foundation and IAM permission catalog.",
      },
    ],
  },
];

const BADGE_CONFIG = {
  major: {
    label: "Major",
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
  },
  minor: {
    label: "Minor",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  patch: {
    label: "Patch",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

const TYPE_CONFIG = {
  new: {
    label: "New",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  improved: {
    label: "Improved",
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  fixed: {
    label: "Fixed",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  removed: {
    label: "Removed",
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

export default function ChangelogPage() {
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
            Changelog
          </p>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            What's new
          </h1>
          <p className="text-lg text-muted-foreground">
            Every update, improvement, and fix — documented as we ship. We
            release new versions every 1–2 weeks.
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

                    <p className="mb-5 text-sm text-muted-foreground">
                      {summary}
                    </p>

                    {/* Change list */}
                    <div className="flex flex-col gap-2">
                      {changes.map(({ type, text }) => {
                        const typeCfg = TYPE_CONFIG[type];
                        return (
                          <div key={text} className="flex items-start gap-3">
                            <span
                              className={`mt-[3px] shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                            >
                              {typeCfg.label}
                            </span>
                            <p className="text-sm leading-relaxed text-foreground/80">
                              {text}
                            </p>
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
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            Want to know what's coming?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Check our public roadmap to see what's in progress and planned for
            upcoming releases.
          </p>
          <Button asChild variant="outline">
            <NextLink href="/roadmap">View roadmap</NextLink>
          </Button>
        </div>
      </section>
    </div>
  );
}

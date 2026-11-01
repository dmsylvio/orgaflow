import {
  BarChart3,
  CalendarDays,
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
  Smartphone,
  Users,
  Zap,
} from "lucide-react";

export type Status = "shipped" | "in-progress" | "planned" | "considering";

export interface RoadmapItem {
  id: number;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: Status;
  effort: "Low" | "Medium" | "High";
  category: string;
  version: string | null;
  releaseDate: string | null;
  details: string[];
}

const ITEMS: RoadmapItem[] = [
  {
    id: 1,
    version: "1.0.0",
    releaseDate: "March 25, 2026",
    details: [
      "You can upload PDFs, images, and other documents to expenses, estimates, and invoices.",
      "Estimate and invoice pages have an attachments section for uploading and deleting files, and expense pages show receipts you can download or delete.",
      "Create and edit forms have Notes and Files tabs, and files added to a new document upload right after you save it.",
      "Clients see image thumbnails, file icons, and download links on the public page.",
    ],
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
    version: "1.0.0",
    releaseDate: "March 25, 2026",
    details: [
      "Clients can approve or reject an estimate from its public link, without creating an account.",
      "Rejecting opens a dialog with an optional rich-text reason.",
      "The reason appears on the public page after it is submitted.",
    ],
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
    version: "1.1.0",
    releaseDate: "March 26, 2026",
    details: [
      "The public estimate page now uses a clean document layout with summary cards and a clear hierarchy.",
      "Approve and Reject sit in a sticky bar at the bottom of the screen, so clients don't have to scroll to find them.",
      "Notes and rejection reasons display as rich text, matching what was written in the editor.",
      "Line items appear in a table with divider rows, and the total is highlighted.",
      "Attachments appear in a grid with thumbnails, file names, sizes, and download links.",
    ],
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
    version: "1.2.0",
    releaseDate: "March 26, 2026",
    details: [
      "You can download estimates and invoices as PDFs from their detail pages.",
      "Clients can download the PDF from the public page.",
      "Version 1.5.1 added a dedicated public route for invoice PDFs.",
    ],
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
    version: "1.2.0",
    releaseDate: "March 26, 2026",
    details: [
      "A new Reports page shows revenue against expenses in a bar chart.",
      "Pie charts break down estimates and invoices by status.",
      "The page lists your top 5 customers by revenue.",
      "A selector switches revenue, expenses, and top customers between 3, 6, and 12 months.",
    ],
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
    version: "1.2.0",
    releaseDate: "March 26, 2026",
    details: [
      "Owners get an email the first time a client views an estimate or invoice.",
      "Each notification has its own toggle in Settings → Notifications.",
    ],
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
    version: "1.2.0",
    releaseDate: "March 26, 2026",
    details: [
      "Opening Settings now takes you straight to Company Settings instead of a placeholder screen.",
      "The unused Customization link was removed from the settings sidebar.",
      "Unknown settings routes return a proper 404.",
    ],
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
    version: "1.3.0",
    releaseDate: "March 26, 2026",
    details: [
      "The dashboard shows real totals for customers, open estimates, open invoices, and this month's revenue, and each card links to its section.",
      "An area chart shows the last 12 months of revenue, with a link to the full reports.",
      "One panel lists estimates waiting on a client. Another lists invoices that need attention, including overdue and partially paid ones.",
      "An activity feed shows the last 8 events across estimates, invoices, and payments.",
    ],
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
    version: "1.5.0",
    releaseDate: "April 1, 2026",
    details: [
      "Six permissions control who can see prices for invoices, estimates, expenses, items, payments, and the dashboard. Each can be assigned per role.",
      "The server removes monetary fields when a member lacks permission, so the data never reaches their browser.",
      "Price columns, financial cards, revenue charts, and top-customer sections disappear for those members, with no empty columns or zero placeholders.",
      "Create and edit permissions include the matching price permission, so people can always see the prices they're editing.",
    ],
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
    version: "1.5.1",
    releaseDate: "April 2, 2026",
    details: [
      "Adding or editing a task now opens a right-side drawer instead of a centered dialog, so the board stays in view.",
      "Drawers are wider and have a close button in the header.",
      "Selecting a linked invoice or estimate opens it in a second drawer on top of the task.",
    ],
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
    version: "1.5.1",
    releaseDate: "April 2, 2026",
    details: [
      "Tasks can link directly to related invoices and estimates.",
      "Workflow automations can attach those documents to the tasks they create, so follow-up work stays connected to its document.",
    ],
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
    version: "1.5.1",
    releaseDate: "April 2, 2026",
    details: [
      "New outbound emails cover estimate status changes, overdue invoices, and received payments.",
      "Notification settings were expanded to include these events.",
    ],
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
    version: "1.5.1",
    releaseDate: "April 2, 2026",
    details: [
      "Stripe subscription checkout now supports the organization's currency.",
      "Customers can enter promotion codes during checkout.",
      "Checkout uses the correct cancel URL and a shared base URL for a more reliable return after payment.",
    ],
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
    version: "1.4.0",
    releaseDate: "March 29, 2026",
    details: [
      "Paid features are now blocked when a subscription is incomplete, expired, canceled, or paused. Before this, only the plan name was checked.",
      "A banner appears on every page when a subscription is past due or unpaid, with a link to fix the payment.",
      "The billing page has a payment failure section with a button that opens the Stripe billing portal.",
      "When a checkout session expires without payment, a webhook updates the subscription status automatically.",
    ],
    Icon: ShieldCheck,
    title: "Payment Reliability & Retry Flow",
    description:
      "Plan gates now enforce subscription status — incomplete or canceled subscriptions can no longer access paid features. Global banner alerts for failed payments, dedicated billing section with one-click portal access, and webhook sync for expired checkout sessions.",
    status: "shipped",
    effort: "Medium",
    category: "Billing",
  },
  {
    id: 23,
    version: "1.10.0",
    releaseDate: "April 22, 2026",
    details: [
      "Starter no longer requires Stripe. New Starter workspaces are active right away and stay free.",
      "Growth and Scale start with a 15-day trial inside Orgaflow, and Stripe checkout is only required after it ends.",
      "Trial status is checked across workspaces, billing, and protected pages, so expired trials are blocked consistently.",
    ],
    Icon: CreditCard,
    title: "Free Starter & Internal Trial Lifecycle",
    description:
      "Starter is now fully free without Stripe checkout. Paid plans start with a 15-day Orgaflow-managed trial, then require payment after the trial expires.",
    status: "shipped",
    effort: "Medium",
    category: "Billing",
  },
  {
    id: 24,
    version: "1.10.0",
    releaseDate: "April 22, 2026",
    details: [
      "Roles automatically receive the companion permissions they require, with no manual update for older roles.",
      "The role editor selects required permissions for you, and removes dependent ones when you remove a base permission.",
      "Creating or editing a payment now requires invoice viewing, invoice price visibility, and customer viewing. Expenses require customer viewing.",
    ],
    Icon: ShieldCheck,
    title: "Permission Dependency Mapping",
    description:
      "Role permissions now map and enforce their required dependencies automatically. The role editor expands required permissions and shrinks dependent permissions in cascade.",
    status: "shipped",
    effort: "Medium",
    category: "RBAC",
  },
  {
    id: 39,
    version: "1.11.0",
    releaseDate: "August 5, 2026",
    details: [
      "A month calendar shows one-off and repeating appointments, with a set time or all day.",
      "Visits can repeat daily, weekly on chosen weekdays, bi-weekly, or monthly. Each one can be completed, cancelled, edited, or invoiced on its own.",
      "Invoices can be created per appointment or consolidated weekly, bi-weekly, or monthly, on completion, at period end, or manually.",
      "Schedule invoices use a configurable payment term, 7 days by default, and can be emailed automatically if the customer has an address on file.",
      "Changes to a repeating visit can apply to one occurrence or to this and future ones. Existing invoices are never deleted with an appointment.",
      "A warning appears when a visit overlaps another appointment, but it doesn't block you.",
      "Choosing a catalog service fills in the unit price, which you can still change for that visit.",
      "If Starter reaches its invoice limit, the blocked appointment records the reason and the rest of the billing run continues.",
    ],
    Icon: CalendarDays,
    title: "Schedule Calendar & Visit Billing",
    description:
      "Month calendar for one-off and recurring service visits (daily, weekly, bi-weekly, monthly). Bill per visit or consolidate by period, with on-completion / period-end / manual triggers, conflict warnings, edit/delete scopes, 7-day payment terms, and optional auto-send. Available on every plan including Starter.",
    status: "shipped",
    effort: "High",
    category: "Core",
  },
  {
    id: 40,
    version: null,
    releaseDate: null,
    details: [
      "Assign team members to appointments.",
      "Filter the calendar by assignee, which would help crews and multi-technician schedules.",
    ],
    Icon: Users,
    title: "Schedule Staff Assignment",
    description:
      "Assign team members to appointments and filter the calendar by assignee — useful for crews and multi-technician schedules.",
    status: "considering",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 27,
    version: null,
    releaseDate: null,
    details: [
      "More control over document branding.",
      "Custom number formats for your documents.",
      "Additional customization options in Settings.",
    ],
    Icon: Settings,
    title: "Expanded Settings",
    description:
      "Deeper settings coverage: document branding, custom number formats, and additional customization options.",
    status: "planned",
    effort: "Low",
    category: "Platform",
  },
  {
    id: 28,
    version: null,
    releaseDate: null,
    details: [
      "Clients would be able to pay invoices online through Stripe Connect.",
      "You would be able to generate a payment link, and the payment status would update automatically.",
      "It is planned for the Scale plan.",
      "This isn't available yet. Today, you record payments in Orgaflow manually.",
    ],
    Icon: CreditCard,
    title: "Online Payments via Stripe",
    description:
      "Let clients pay invoices directly online via Stripe Connect. Generate a payment link and track status automatically. Available on the Scale plan.",
    status: "in-progress",
    effort: "High",
    category: "Payments",
  },
  {
    id: 29,
    version: null,
    releaseDate: null,
    details: [
      "Exchange rates fetched automatically.",
      "Conversion logic for businesses that work with international clients.",
    ],
    Icon: Layers,
    title: "Multi-Currency with Live Rates",
    description:
      "Automatic exchange rate fetching and conversion logic for businesses working with international clients.",
    status: "planned",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 30,
    version: null,
    releaseDate: null,
    details: [
      "Full-text search across estimates, invoices, and customers.",
      "Filters by date range, client, and amount.",
    ],
    Icon: FileSearch,
    title: "Advanced Search & Filters",
    description:
      "Full-text search, date range filters, client filters, and amount filters across estimates, invoices, and customers.",
    status: "planned",
    effort: "Medium",
    category: "UX",
  },
  {
    id: 31,
    version: null,
    releaseDate: null,
    details: [
      "Automated SMS for unpaid invoice reminders, estimates awaiting approval, payment confirmations, and overdue alerts.",
      "Turn SMS on per client and choose which events send a message.",
    ],
    Icon: Smartphone,
    title: "SMS Notifications",
    description:
      "Send automated SMS messages to clients for key events: unpaid invoice reminders, estimate awaiting approval, payment received confirmations, and overdue alerts. Businesses can enable SMS per-client and configure which events trigger messages.",
    status: "considering",
    effort: "High",
    category: "Communication",
  },
  {
    id: 32,
    version: null,
    releaseDate: null,
    details: [
      "A timeline on every document showing who did what and when.",
      "Approvals, edits, sends, and payments would all be recorded.",
    ],
    Icon: History,
    title: "Activity Log & Audit Trail",
    description:
      "See who did what and when — approvals, edits, sends, payments — with a visible timeline on every document.",
    status: "considering",
    effort: "Medium",
    category: "Platform",
  },
  {
    id: 33,
    version: null,
    releaseDate: null,
    details: [
      "Select multiple estimates or invoices at once.",
      "Change their status, delete them, or send them in a single action.",
    ],
    Icon: CheckCircle2,
    title: "Bulk Actions",
    description:
      "Select multiple estimates or invoices to change status, delete, or send in a single action.",
    status: "considering",
    effort: "Low",
    category: "UX",
  },
  {
    id: 34,
    version: null,
    releaseDate: null,
    details: [
      "Choose brand colors and customize fonts.",
      "Control the header and footer of estimates and invoices, beyond the current templates.",
    ],
    Icon: Zap,
    title: "Advanced Custom Branding",
    description:
      "Pick brand colors, customize fonts, and fully control the header and footer of your estimates and invoices beyond the current template options.",
    status: "planned",
    effort: "High",
    category: "Customization",
  },
  {
    id: 35,
    version: "1.6.0",
    releaseDate: "April 4, 2026",
    details: [
      "Templates generate invoices every hour, day, week, 15 days, month, 6 months, or year.",
      "Each template has a start date, an optional end date or invoice limit, and a due-date offset such as net 30.",
      "With Send Automatically on, each new invoice is emailed to the customer with a secure view link.",
      "Templates are Active, On Hold, or Completed, and they complete automatically when they reach a limit.",
      "The edit page lists every invoice a template has generated.",
      "Recurring invoices have their own menu item and permissions.",
    ],
    Icon: RefreshCw,
    title: "Recurring Invoices",
    description:
      "Schedule invoices to be generated automatically on a set interval — ideal for monthly retainers and ongoing contracts. Configurable frequency, start date, limits, due-date offset, and optional auto-send.",
    status: "shipped",
    effort: "High",
    category: "Automation",
  },
  {
    id: 36,
    version: "1.9.0",
    releaseDate: "April 11, 2026",
    details: [
      "You can choose a template separately for invoices and estimates in Settings → Preferences → PDF templates.",
      "Classic has a centered logo or company name, a divider, and a bordered total.",
      "Branded has a full-width header band with the logo and a white document title.",
      "Modern has a split header with the logo on the left and the company address on the right.",
      "Every PDF includes your logo, your organization's address, and the customer's billing address.",
    ],
    Icon: FileText,
    title: "PDF Templates",
    description:
      "Three selectable layouts per document type: Classic (centered logo, clean divider), Branded (purple header band with white doc title), and Modern (split header with logo and address). Each template embeds the company logo, org address, and customer billing address.",
    status: "shipped",
    effort: "Medium",
    category: "Customization",
  },
  {
    id: 37,
    version: "1.8.0",
    releaseDate: "April 11, 2026",
    details: [
      "Company Settings has a Logo section for PNG, JPG, WebP, or SVG files up to 5 MB.",
      "Each file on an estimate has a visibility toggle. Files are hidden by default, and only visible ones appear on the public link.",
      "Public invoice pages now show attachments in a file grid.",
      "The billing page shows the storage you actually use.",
      "Deleting an estimate, invoice, or organization also removes its stored files.",
    ],
    Icon: Paperclip,
    title: "Company Logo & File Visibility",
    description:
      "Upload a company logo in Settings — shown on document pages. Toggle file visibility per attachment on estimates so only selected files appear on the public link. Public invoice pages now display attachments. Blob cleanup on deletion keeps storage tidy.",
    status: "shipped",
    effort: "Medium",
    category: "Core",
  },
  {
    id: 38,
    version: "1.7.0",
    releaseDate: "April 11, 2026",
    details: [
      "On mobile, the sidebar becomes a slide-in drawer that closes when you navigate.",
      "A top bar keeps the menu button, logo, and your avatar in reach.",
      "Settings navigation becomes a horizontal row of tabs you can scroll.",
      "A user menu gives quick access to Account Settings and Log out.",
    ],
    Icon: Smartphone,
    title: "Mobile-Responsive App Shell",
    description:
      "The private app shell is now fully responsive. On mobile the sidebar becomes a slide-in drawer with backdrop, a top bar with hamburger and logo, auto-close on navigation, horizontal scrollable settings tabs, and a user dropdown with Account Settings and Log out.",
    status: "shipped",
    effort: "Medium",
    category: "UX",
  },
];

export const STATUS_CONFIG: Record<
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

export const EFFORT_CONFIG: Record<
  "Low" | "Medium" | "High",
  { label: string; color: string }
> = {
  Low: { label: "Low effort", color: "text-emerald-600" },
  Medium: { label: "Medium effort", color: "text-amber-600" },
  High: { label: "High effort", color: "text-rose-600" },
};

export const COLUMNS: { status: Status; title: string; description: string }[] =
  [
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

export function roadmapSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const ROADMAP_ITEMS = ITEMS.map((item) => ({
  ...item,
  slug: roadmapSlug(item.title),
}));

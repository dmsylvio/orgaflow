import {
  formatUsdPrice,
  getWorkspacePlanPrice,
} from "@/lib/subscription-plans";

/**
 * Competitor facts shown on the marketing site.
 *
 * Keep this honest and dated: list prices come from each vendor's public
 * pricing page (US, monthly billing, before promotions) and change often.
 * Update COMPARISON_CHECKED_ON whenever you re-check them.
 */
export const COMPARISON_CHECKED_ON = "November 2026";

export type CompetitorSlug = "freshbooks" | "quickbooks" | "jobber";
export type Vendor = "orgaflow" | CompetitorSlug;

/** `true` = included, `false` = not offered, string = nuance. */
export type Cell = boolean | string;

export interface ComparisonRow {
  feature: string;
  hint?: string;
  values: Record<Vendor, Cell>;
}

export const VENDOR_NAMES: Record<Vendor, string> = {
  orgaflow: "Orgaflow",
  freshbooks: "FreshBooks",
  quickbooks: "QuickBooks Online",
  jobber: "Jobber",
};

const growth = formatUsdPrice(getWorkspacePlanPrice("growth", "monthly"));

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Free plan with no time limit",
    values: {
      orgaflow: "Starter, free forever",
      freshbooks: "Free trial only",
      quickbooks: "Free trial only",
      jobber: "Free trial only",
    },
  },
  {
    feature: "Entry paid plan (list price)",
    hint: "Monthly billing, USD",
    values: {
      orgaflow: `${growth}/mo`,
      freshbooks: "$23/mo",
      quickbooks: "$38/mo",
      jobber: "$49/mo",
    },
  },
  {
    feature: "Team members on that plan",
    values: {
      orgaflow: "5 included",
      freshbooks: "1 (extra users cost more)",
      quickbooks: "1",
      jobber: "1",
    },
  },
  {
    feature: "Client approves estimates online",
    values: {
      orgaflow: true,
      freshbooks: true,
      quickbooks: true,
      jobber: true,
    },
  },
  {
    feature: "Estimate → invoice in one click",
    values: {
      orgaflow: true,
      freshbooks: true,
      quickbooks: true,
      jobber: true,
    },
  },
  {
    feature: "Recurring invoices",
    values: {
      orgaflow: true,
      freshbooks: true,
      quickbooks: true,
      jobber: true,
    },
  },
  {
    feature: "Kanban task board for the team",
    values: {
      orgaflow: "Growth and Scale",
      freshbooks: false,
      quickbooks: false,
      jobber: "Jobs & visits",
    },
  },
  {
    feature: "Auto-create tasks when a client approves or pays",
    values: {
      orgaflow: "Scale",
      freshbooks: "Via third-party tools",
      quickbooks: "Reminders on Advanced plan",
      jobber: "Quote → job conversion",
    },
  },
  {
    feature: "Online card payments",
    values: {
      orgaflow: "In development",
      freshbooks: true,
      quickbooks: true,
      jobber: true,
    },
  },
  {
    feature: "Full bookkeeping & accounting",
    values: {
      orgaflow: false,
      freshbooks: true,
      quickbooks: true,
      jobber: "Via QuickBooks/Xero sync",
    },
  },
  {
    feature: "GPS dispatch & route planning",
    values: {
      orgaflow: false,
      freshbooks: false,
      quickbooks: false,
      jobber: "Higher plans",
    },
  },
];

export interface Competitor {
  slug: CompetitorSlug;
  name: string;
  category: string;
  startingPrice: string;
  summary: string;
  /** Where the competitor is the better pick. Honesty builds trust. */
  chooseThemIf: string[];
  chooseOrgaflowIf: string[];
  keyword: string;
}

export const COMPETITORS: Competitor[] = [
  {
    slug: "freshbooks",
    name: "FreshBooks",
    category: "Accounting & invoicing",
    startingPrice: "$23/mo (Lite, up to 5 billable clients)",
    summary:
      "FreshBooks is accounting software with strong invoicing. Orgaflow skips the bookkeeping and focuses on what happens before it: the estimate, the approval, the invoice, and the work your team does after the client says yes.",
    chooseThemIf: [
      "You want invoicing and double-entry bookkeeping in the same tool",
      "You need clients to pay by card online today",
      "You work alone and track billable hours more than jobs",
    ],
    chooseOrgaflowIf: [
      "You want a free plan with no time limit while you get started",
      "Your team needs to see and start the work once a client approves",
      "You want 5 team members included instead of paying per user",
      "You already have an accountant or bookkeeping tool",
    ],
    keyword: "FreshBooks alternative",
  },
  {
    slug: "quickbooks",
    name: "QuickBooks Online",
    category: "Accounting",
    startingPrice: "$38/mo (Simple Start, 1 user)",
    summary:
      "QuickBooks Online is built for bookkeeping and taxes. Orgaflow is built for the person who wins the work: quoting, getting approval, invoicing, and getting the job done, without a chart of accounts in the way.",
    chooseThemIf: [
      "You need full accounting, bank feeds, and tax prep in one place",
      "Your accountant requires QuickBooks",
      "You need online card payments today",
    ],
    chooseOrgaflowIf: [
      "You want simple estimates and invoices without learning accounting",
      "Your team needs a task board and automations tied to approvals",
      "You want to start free and pay less as you grow",
      "You'd rather keep QuickBooks for the books and something simpler for the work",
    ],
    keyword: "QuickBooks alternative",
  },
  {
    slug: "jobber",
    name: "Jobber",
    category: "Field service management",
    startingPrice: "$49/mo (Core, 1 user)",
    summary:
      "Jobber is a full field service platform for home service crews. Orgaflow covers the same quote-to-paid loop with a lighter, more affordable setup, which suits small teams and service businesses that don't need dispatch or route planning.",
    chooseThemIf: [
      "You run multiple crews and need GPS dispatch and route planning",
      "You want a client hub and online booking for home services",
      "You need card payments built in today",
    ],
    chooseOrgaflowIf: [
      "You want the quote → invoice → task flow without field-service complexity",
      "You want a free plan, and 5 team members on the first paid plan",
      "You're an agency, studio, or B2B service business, not only home services",
      "You want a kanban board and automations included, not bolted on",
    ],
    keyword: "Jobber alternative",
  },
];

export function getCompetitor(slug: string) {
  return COMPETITORS.find((c) => c.slug === slug);
}

import {
  Check,
  Globe2,
  Lock,
  Mail,
  Paperclip,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import {
  AutomationMock,
  BrowserFrame,
  EstimatesMock,
  InvoiceMock,
  KanbanMock,
  ReportsMock,
  ScheduleMock,
} from "@/components/marketing/product-mockups";
import { Reveal } from "@/components/marketing/reveal";
import { Eyebrow } from "@/components/marketing/section-heading";
import { marketingMetadata } from "@/lib/marketing-metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = marketingMetadata({
  title: "Features: Estimates, Invoices, Scheduling, Tasks & Automations",
  description:
    "Every Orgaflow feature: estimates clients approve online, one-click invoices, recurring billing, payment tracking, scheduling, a kanban task board, workflow automations, and reports.",
  path: "/features",
});

type Module = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  plan: string;
  view: ReactNode;
  caption: string;
};

const MODULES: Module[] = [
  {
    id: "estimates",
    eyebrow: "Estimates",
    title: "Estimate software your clients can approve from their phone",
    body: "Build a professional estimate in minutes and send it as a secure link. Your client reviews it, opens the attachments, and approves or declines. No account, no password, no PDF back-and-forth.",
    points: [
      "Line items, taxes, discounts, and notes",
      "Know when the client has viewed it",
      "Approve or decline from a public page",
      "Attach photos, plans, and documents",
    ],
    plan: "Every plan",
    view: <EstimatesMock />,
    caption:
      "The estimates list with statuses like Viewed, Sent, and Approved, next to the client approval page.",
  },
  {
    id: "invoices",
    eyebrow: "Invoices & payments",
    title: "Invoices in one click, payments tracked to the cent",
    body: "Turn an approved estimate into an invoice with nothing to retype. Record full or partial payments by method, and Orgaflow marks the invoice paid when the balance reaches zero.",
    points: [
      "Convert estimates to invoices instantly",
      "Recurring invoices with optional auto-send",
      "Three PDF templates, custom branding on Growth and Scale",
      "Partial payments and balance tracking",
    ],
    plan: "Every plan",
    view: <InvoiceMock />,
    caption:
      "An invoice with a partial payment recorded, a PDF template picker, and a monthly recurring schedule.",
  },
  {
    id: "schedule",
    eyebrow: "Schedule",
    title: "Plan service visits and let them repeat",
    body: "Put visits on a weekly calendar, set them to repeat, and bill for the work once it's done. Your team always knows where they need to be.",
    points: [
      "Weekly calendar of visits",
      "Repeating visits for ongoing clients",
      "Bill completed work",
    ],
    plan: "Every plan",
    view: <ScheduleMock />,
    caption:
      "A weekly schedule of repeating service visits for several clients.",
  },
  {
    id: "tasks",
    eyebrow: "Task board",
    title: "A kanban board for the work after the yes",
    body: "Track what needs to happen on a board your whole team can use. Assign people, set due dates, and see which tasks were created automatically.",
    points: [
      "To do, in progress, and done columns",
      "Assignees and due dates",
      "Tasks linked to the customer and the job",
    ],
    plan: "Growth and Scale",
    view: <KanbanMock />,
    caption: "A kanban board with To do, In progress, and Done columns.",
  },
  {
    id: "automations",
    eyebrow: "Automations",
    title: "Workflow automations that start the work for you",
    body: "Choose a trigger, like an approved estimate or a paid invoice, and Orgaflow creates the task with the right assignee and due date. No more manual handoffs.",
    points: [
      "Triggers: estimate approved, invoice paid",
      "Create tasks with an assignee and due date",
      "See how often each automation runs",
    ],
    plan: "Scale",
    view: <AutomationMock />,
    caption:
      "An automation: when an estimate is approved, create a task assigned to Dana, due in 3 days.",
  },
  {
    id: "reports",
    eyebrow: "Dashboard & reports",
    title: "Know where the money is, without a spreadsheet",
    body: "The dashboard shows revenue, open estimates, unpaid invoices, and recent activity. Advanced reports add invoiced vs. collected, win rate, and time to payment.",
    points: [
      "Revenue for the last 12 months",
      "Estimates awaiting a response",
      "Invoices that need attention",
      "Advanced reports on Scale",
    ],
    plan: "Dashboard on every plan · advanced reports on Scale",
    view: <ReportsMock />,
    caption:
      "Reports comparing invoiced and collected revenue, with estimate win rate and average days to payment.",
  },
];

const EXTRAS = [
  {
    Icon: Users,
    title: "Customers",
    body: "Contact details and the full document history of each client.",
  },
  {
    Icon: ShieldCheck,
    title: "Roles & permissions",
    body: "Decide what each role can see and do, including prices.",
  },
  {
    Icon: Globe2,
    title: "Multi-currency",
    body: "Pick the currency for each estimate and invoice.",
  },
  {
    Icon: Paperclip,
    title: "File storage",
    body: "1 GB on Growth and 10 GB on Scale for photos and documents.",
  },
  {
    Icon: Mail,
    title: "Email notifications",
    body: "Know when estimates are viewed, approved, or paid.",
  },
  {
    Icon: Smartphone,
    title: "Works everywhere",
    body: "Runs in the browser on desktop, tablet, and phone.",
  },
  {
    Icon: Lock,
    title: "Secure links",
    body: "Every public estimate and invoice link is unique and unguessable.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Features", path: "/features" }]} />
      <PageHero
        eyebrow="Features"
        title="Everything from the quote to the finished job"
      >
        Orgaflow brings estimates, invoices, payments, scheduling, tasks, and
        automations into one panel built for small businesses.
      </PageHero>

      <nav aria-label="Feature sections" className="mx-auto max-w-6xl px-6">
        <ul className="flex flex-wrap gap-2">
          {MODULES.map(({ id, eyebrow }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary"
              >
                {eyebrow}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {MODULES.map(
          ({ id, eyebrow, title, body, points, plan, view, caption }, i) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-title`}
              className="grid scroll-mt-24 items-center gap-10 py-14 lg:grid-cols-[1fr_1.35fr] lg:gap-14"
            >
              <Reveal className={cn(i % 2 === 1 && "lg:order-2")}>
                <Eyebrow>{eyebrow}</Eyebrow>
                <h2
                  id={`${id}-title`}
                  className="mt-5 text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-4xl"
                >
                  {title}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {body}
                </p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check
                          aria-hidden
                          className="h-3 w-3"
                          strokeWidth={3}
                        />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm font-semibold text-primary">
                  {plan}
                </p>
              </Reveal>
              <Reveal delay={120} className="relative min-w-0">
                <div
                  aria-hidden
                  className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/50 via-violet-200/40 to-emerald-100/50 blur-2xl"
                />
                <figure>
                  <figcaption className="sr-only">{caption}</figcaption>
                  <BrowserFrame>{view}</BrowserFrame>
                </figure>
              </Reveal>
            </section>
          ),
        )}
      </div>

      <section className="mx-3 rounded-[2rem] bg-muted sm:mx-5">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Also included
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXTRAS.map(({ Icon, title, body }, i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 50}
                className="rounded-3xl bg-white p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

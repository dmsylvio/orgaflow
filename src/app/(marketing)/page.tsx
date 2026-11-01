import type { Metadata } from "next";
import Image from "next/image";
import NextLink from "next/link";
import { HomeFaqJsonLd } from "@/components/json-ld";
import { JobTicket } from "@/components/marketing/job-ticket";
import { Button } from "@/components/ui/button";
import { HOME_FAQS } from "@/lib/marketing-faq";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "Estimate & Invoice Software for Small Businesses | Orgaflow",
  absolute: true,
  description:
    "Send estimates clients approve from a link, turn them into invoices, track payments, and start the work. Free plan, no credit card needed.",
  path: "/",
});

const STEPS = [
  {
    title: "Send the estimate",
    body: "Add line items, taxes, and your logo, then send a secure link. Orgaflow tells you when your client has viewed it.",
    plan: "Every plan",
    slip: [
      ["Maple Street Bakery", "$860.00"],
      ["Status", "Viewed today"],
    ],
  },
  {
    title: "Get it approved",
    body: "Your client reviews the details and any attached files, then approves or rejects from the same page. No account, no password.",
    plan: "Every plan",
    slip: [
      ["EST-0142", "Approved"],
      ["Client account needed", "No"],
    ],
  },
  {
    title: "Turn it into an invoice",
    body: "Convert the approved estimate in one click, with nothing to retype. Choose from three PDF templates, or set up recurring invoices for ongoing work.",
    plan: "Every plan. Custom branding on Growth and Scale",
    slip: [
      ["EST-0142", "INV-0142"],
      ["PDF template", "Branded"],
    ],
  },
  {
    title: "Track the payment",
    body: "Record each payment by method, such as cash or bank transfer. Orgaflow marks the invoice paid once the balance reaches zero. Online card payments through Stripe are in development.",
    plan: "Every plan",
    slip: [
      ["Bank transfer", "$860.00"],
      ["Balance", "$0.00"],
    ],
  },
  {
    title: "Start the work",
    body: "When an estimate is approved or an invoice is paid, an automation creates the task with an assignee and a due date. Your team picks it up on the board.",
    plan: "Task board on Growth and Scale. Automations on Scale",
    slip: [
      ["Clean exhaust hood", "Dana"],
      ["Due", "In 3 days"],
    ],
  },
];

const ALSO_INCLUDED = [
  {
    term: "Customers",
    body: "Each client's details, estimates, and invoices in one record.",
  },
  {
    term: "Schedule",
    body: "Plan service visits on a calendar, repeat them, and bill for completed work. Included on every plan.",
  },
  {
    term: "Dashboard and reports",
    body: "See revenue and pending documents at a glance. Advanced reports come with Scale.",
  },
  {
    term: "Team permissions",
    body: "Choose what each role can do, and hide prices from people who don't need them.",
  },
  {
    term: "File attachments",
    body: "Add photos and documents to estimates and invoices, with 1 GB on Growth and 10 GB on Scale.",
  },
];

export default function LandingPage() {
  return (
    <>
      <HomeFaqJsonLd />

      {/* Hero */}
      <section className="overflow-hidden bg-canary">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 pb-14 pt-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10 lg:pb-20 lg:pt-20">
          <div>
            <h1 className="text-[clamp(3rem,7.4vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-foreground">
              Quote it. Get paid. Do the work.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-foreground sm:text-xl">
              Orgaflow is estimate and invoice software for small businesses.
              Every job moves from the first quote to the finished work in one
              place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button
                size="lg"
                asChild
                className="h-12 bg-foreground px-7 text-base text-background hover:bg-foreground/85"
              >
                <NextLink href="/register">Start free</NextLink>
              </Button>
              <NextLink
                href="#how-it-works"
                className="font-semibold text-foreground underline decoration-2 underline-offset-4"
              >
                See how a job moves
              </NextLink>
            </div>
            <p className="mt-5 text-sm text-foreground">
              Free plan available. No credit card needed.
            </p>
          </div>

          <JobTicket />
        </div>
      </section>

      {/* Problem */}
      <section className="border-b-2 border-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <h2 className="max-w-4xl text-balance text-3xl font-bold leading-[1.15] tracking-[-0.025em] sm:text-5xl">
            The quote is in a doc, the invoice is in another app, and the job is
            on a sticky note.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Every handoff is a chance for something to slip. Orgaflow keeps the
            estimate, the invoice, the payment, and the task connected, so you
            can see where each job stands.
          </p>
        </div>
      </section>

      {/* One job, five steps */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <h2 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            How a job moves through Orgaflow
          </h2>

          <ol className="mt-14">
            {STEPS.map(({ title, body, plan, slip }, i) => (
              <li
                key={title}
                className="relative grid grid-cols-[2.5rem_1fr] gap-x-4 pb-14 last:pb-0 sm:grid-cols-[3.5rem_1fr] md:grid-cols-[3.5rem_1fr_19rem] md:gap-x-10"
              >
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-[1.2rem] top-11 w-0.5 bg-primary sm:left-[1.7rem] sm:top-14"
                  />
                ) : null}
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground sm:h-14 sm:w-14 sm:text-2xl"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-primary">
                    {plan}
                  </p>
                </div>
                <dl
                  aria-hidden
                  className="col-start-2 mt-5 self-start border-t-2 border-primary bg-white px-4 py-1.5 md:col-start-3 md:mt-1"
                >
                  {slip.map(([term, value]) => (
                    <div
                      key={term}
                      className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-b-0"
                    >
                      <dt className="text-sm text-muted-foreground">{term}</dt>
                      <dd className="text-right font-hand text-lg leading-tight text-primary">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Also included */}
      <section id="features" className="scroll-mt-20 bg-copy-pink">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[1fr_1.35fr] lg:items-start">
          <div>
            <h2 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              Everything around the job, too
            </h2>
            <dl className="mt-10">
              {ALSO_INCLUDED.map(({ term, body }) => (
                <div key={term} className="border-t-2 border-foreground py-4">
                  <dt className="font-bold">{term}</dt>
                  <dd className="mt-1 leading-relaxed">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Image
            src="/screencapture-orgaflow.png"
            alt="Orgaflow dashboard with revenue, pending documents, and recent activity"
            width={1920}
            height={1202}
            sizes="(min-width: 1024px) 640px, 100vw"
            className="w-full border-2 border-foreground lg:mt-2"
          />
        </div>
      </section>

      {/* Not accounting */}
      <section className="on-dark bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <h2 className="max-w-3xl text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
            Keep your accountant.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed">
            FreshBooks and QuickBooks are built around the books. Orgaflow is
            built for the person who wins the work and gets it done. It covers
            everything from the first quote to the finished job, and leaves the
            bookkeeping to the tools made for it.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section className="border-b-2 border-foreground">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 sm:py-24 md:grid-cols-2 md:gap-12">
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.025em] sm:text-4xl">
            When you write in, the person who builds Orgaflow answers.
          </h2>
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Orgaflow is built and supported by its founder, Sylvio Lima. The
              roadmap and changelog are public, so you can see what has shipped
              and what comes next.
            </p>
            <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-semibold text-primary">
              <NextLink href="/about" className="underline underline-offset-4">
                About Orgaflow
              </NextLink>
              <NextLink
                href="/roadmap"
                className="underline underline-offset-4"
              >
                See the roadmap
              </NextLink>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:py-24 lg:grid-cols-[1fr_2fr]">
          <h2 className="text-4xl font-extrabold tracking-[-0.03em]">
            Common questions
          </h2>
          <div className="border-b-2 border-foreground">
            {HOME_FAQS.map(({ q, a }) => (
              <details
                key={q}
                className="group border-t-2 border-foreground py-4"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="text-2xl font-normal leading-none text-primary group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl pr-8 leading-relaxed text-muted-foreground">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-canary">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-20 sm:py-24 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="max-w-2xl text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
              Send your first estimate today.
            </h2>
            <p className="mt-4 text-lg">
              The Starter plan is free. No credit card needed.
            </p>
          </div>
          <Button
            size="lg"
            asChild
            className="h-12 shrink-0 bg-foreground px-7 text-base text-background hover:bg-foreground/85"
          >
            <NextLink href="/register">Start free</NextLink>
          </Button>
        </div>
      </section>
    </>
  );
}

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Globe2,
  Paperclip,
  Receipt,
  Repeat,
  ShieldCheck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { HomeFaqJsonLd } from "@/components/json-ld";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { CtaBand, PrimaryCta } from "@/components/marketing/cta-band";
import { FeatureTour } from "@/components/marketing/feature-tour";
import {
  BrowserFrame,
  ClientApprovalCard,
  DashboardMock,
  FloatingToast,
  RevenueChart,
} from "@/components/marketing/product-mockups";
import { Reveal } from "@/components/marketing/reveal";
import {
  Eyebrow,
  SectionHeading,
} from "@/components/marketing/section-heading";
import { COMPETITORS } from "@/lib/competitors";
import { HOME_FAQS } from "@/lib/marketing-faq";
import { marketingMetadata } from "@/lib/marketing-metadata";
import {
  formatUsdPrice,
  getWorkspacePlanPrice,
  PLAN_TRIAL_DAYS,
} from "@/lib/subscription-plans";

export const metadata: Metadata = marketingMetadata({
  title: "Orgaflow: Estimate, Invoice & Job Software for Small Businesses",
  absolute: true,
  description:
    "Send estimates clients approve from a link, turn them into invoices, track payments, and start the work automatically. A simpler FreshBooks, QuickBooks, and Jobber alternative. Free plan.",
  path: "/",
});

const LIFECYCLE = [
  {
    Icon: FileText,
    title: "Send the estimate",
    body: "Line items, taxes, your logo. Share a secure link and see when it's viewed.",
  },
  {
    Icon: CheckCircle2,
    title: "Client approves",
    body: "They review the details and attachments, then approve. No account, no password.",
  },
  {
    Icon: Receipt,
    title: "Invoice in one click",
    body: "Convert the approved estimate with nothing to retype. Make it recurring if you like.",
  },
  {
    Icon: Wallet,
    title: "Track the payment",
    body: "Record payments by method. The invoice marks itself paid at a zero balance.",
  },
  {
    Icon: Zap,
    title: "The work starts",
    body: "An automation creates the task with an assignee and due date. The team picks it up.",
  },
];

const SMALL_FEATURES = [
  {
    Icon: Users,
    title: "Customers",
    body: "Every client's details, estimates, and invoices in one record.",
  },
  {
    Icon: Repeat,
    title: "Recurring invoices",
    body: "Bill on a schedule, with the option to send automatically.",
  },
  {
    Icon: ShieldCheck,
    title: "Team permissions",
    body: "Choose what each role can do, and hide prices when needed.",
  },
  {
    Icon: Paperclip,
    title: "File attachments",
    body: "Photos and documents on your work. 1 GB on Growth, 10 GB on Scale.",
  },
  {
    Icon: Globe2,
    title: "Multi-currency",
    body: "A default currency for the workspace, and per-document currencies.",
  },
  {
    Icon: CalendarDays,
    title: "Schedule",
    body: "Plan service visits on a calendar, repeat them, and bill the work.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    note: "Forever. No credit card.",
    points: ["2 team members", "50 customers", "200 estimates & 200 invoices"],
    featured: false,
  },
  {
    name: "Growth",
    price: `${formatUsdPrice(getWorkspacePlanPrice("growth", "monthly"))}`,
    note: `per month · ${PLAN_TRIAL_DAYS}-day free trial`,
    points: [
      "5 team members",
      "Unlimited documents",
      "Task board & custom branding",
    ],
    featured: true,
  },
  {
    name: "Scale",
    price: `${formatUsdPrice(getWorkspacePlanPrice("scale", "monthly"))}`,
    note: `per month · ${PLAN_TRIAL_DAYS}-day free trial`,
    points: ["10 team members", "Automations", "Advanced reports"],
    featured: false,
  },
];

export default function LandingPage() {
  return (
    <>
      <HomeFaqJsonLd />

      {/* ------------------------------------------------------------ */}
      {/* Hero                                                          */}
      {/* ------------------------------------------------------------ */}
      <section className="on-dark relative isolate mx-3 mt-1 overflow-hidden rounded-[2rem] bg-ink text-white sm:mx-5">
        <div aria-hidden className="aurora absolute inset-0 -z-10" />
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />

        <div className="mx-auto max-w-6xl px-6 pt-16 text-center sm:pt-24">
          <div className="pop-in">
            <Eyebrow dark>Quote → Approved → Paid → Done</Eyebrow>
          </div>
          <h1
            className="pop-in mx-auto mt-7 max-w-4xl text-balance text-[clamp(2.6rem,6.4vw,5.25rem)] font-extrabold leading-[1.02] tracking-[-0.045em]"
            style={{ animationDelay: "80ms" }}
          >
            From the first quote to the{" "}
            <span className="text-gradient">finished job</span>
          </h1>
          <p
            className="pop-in mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-300 sm:text-xl"
            style={{ animationDelay: "160ms" }}
          >
            Orgaflow is estimate and invoice software for small businesses.
            Clients approve from a link, invoices are one click away, and the
            work starts on its own.
          </p>
          <div
            className="pop-in mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
            style={{ animationDelay: "240ms" }}
          >
            <PrimaryCta />
            <NextLink
              href="#tour"
              className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              Take the product tour
            </NextLink>
          </div>
          <ul
            className="pop-in mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400"
            style={{ animationDelay: "320ms" }}
          >
            {[
              "Free plan forever",
              "No credit card",
              "Clients don't need an account",
            ].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check aria-hidden className="h-4 w-4 text-emerald-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Product shot */}
        <figure className="relative mx-auto mt-14 max-w-6xl px-4 sm:mt-16 sm:px-6">
          <figcaption className="sr-only">
            The Orgaflow dashboard, showing revenue, open estimates, unpaid
            invoices, and recent activity such as an approved estimate and a
            task created by an automation.
          </figcaption>
          <div className="tilt-in">
            <BrowserFrame className="ring-gradient rounded-b-none border-b-0">
              <DashboardMock />
            </BrowserFrame>
          </div>
          <div
            className="pop-in absolute -left-2 top-24 hidden lg:flex"
            style={{ animationDelay: "1.2s" }}
          >
            <FloatingToast
              Icon={CheckCircle2}
              tone="emerald"
              title="Estimate approved"
              meta="Maple Street Bakery · $860"
              className="float-slow"
            />
          </div>
          <div
            className="pop-in absolute -right-2 top-10 hidden lg:flex"
            style={{ animationDelay: "1.6s" }}
          >
            <FloatingToast
              Icon={CircleDollarSign}
              tone="indigo"
              title="Payment received"
              meta="INV-0142 · Bank transfer"
              className="float-slower"
            />
          </div>
          <div
            className="pop-in absolute -right-4 bottom-24 hidden lg:flex"
            style={{ animationDelay: "2s" }}
          >
            <FloatingToast
              Icon={Zap}
              tone="violet"
              title="Task created automatically"
              meta="Clean exhaust hood → Dana"
              className="float-slow"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent"
          />
        </figure>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Problem → lifecycle                                           */}
      {/* ------------------------------------------------------------ */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title={
                <>
                  Stop running jobs across{" "}
                  <span className="text-gradient-dark">five tabs</span>
                </>
              }
            >
              The quote is in a doc, the invoice in another app, and the job on
              a sticky note. Every handoff is a chance for something to slip.
              Orgaflow keeps one job connected from the first quote to the last
              task.
            </SectionHeading>
          </Reveal>

          <ol className="relative mt-16 grid gap-4 md:grid-cols-5">
            <span
              aria-hidden
              className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-indigo-200 via-violet-300 to-emerald-300 md:block"
            />
            {LIFECYCLE.map(({ Icon, title, body }, i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 90}
                className="relative rounded-2xl border border-border bg-card p-5 pt-0 transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(79,70,229,0.45)] md:border-0 md:bg-transparent md:p-0 md:hover:shadow-none"
              >
                <span className="relative -mt-0 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white text-primary shadow-[0_8px_24px_-12px_rgba(79,70,229,0.5)] max-md:mt-5">
                  <Icon aria-hidden className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Product tour                                                  */}
      {/* ------------------------------------------------------------ */}
      <section
        id="tour"
        className="on-dark relative isolate mx-3 scroll-mt-20 overflow-hidden rounded-[2rem] bg-ink text-white sm:mx-5"
      >
        <div aria-hidden className="aurora absolute inset-0 -z-10 opacity-70" />
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <Reveal>
            <SectionHeading
              dark
              align="center"
              eyebrow="Product tour"
              title="One panel for the whole job"
            >
              Click through the parts of Orgaflow your team uses every day.
            </SectionHeading>
          </Reveal>
          <div className="mt-12">
            <FeatureTour />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Bento                                                         */}
      {/* ------------------------------------------------------------ */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <Reveal>
            <SectionHeading
              eyebrow="Features"
              title="Everything you need to run client work"
            >
              Built for the person who wins the work and gets it done, not for
              the bookkeeper.
            </SectionHeading>
          </Reveal>

          <div className="mt-14 grid gap-4 lg:grid-cols-6">
            <Reveal className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-7 lg:col-span-3 lg:row-span-2">
              <p className="text-sm font-semibold text-primary">
                Client approval links
              </p>
              <h3 className="mt-2 max-w-sm text-2xl font-bold tracking-tight">
                A yes from your client in one tap
              </h3>
              <p className="mt-3 max-w-md text-muted-foreground">
                Clients open the estimate, check the attachments, and approve
                from their phone. You see the moment it's viewed.
              </p>
              <div
                aria-hidden
                className="mt-8 flex justify-center transition-transform duration-500 group-hover:-translate-y-1"
              >
                <ClientApprovalCard className="w-full max-w-xs" />
              </div>
            </Reveal>

            <Reveal
              delay={80}
              className="group relative overflow-hidden rounded-3xl bg-ink p-7 text-white lg:col-span-3"
            >
              <div aria-hidden className="aurora absolute inset-0 opacity-50" />
              <div className="relative">
                <p className="text-sm font-semibold text-emerald-300">
                  Automations · Scale
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">
                  Approved or paid? The task appears.
                </h3>
                <div
                  aria-hidden
                  className="mt-6 flex flex-wrap items-center gap-2 text-sm"
                >
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 font-semibold text-emerald-300">
                    Invoice paid
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  <span className="rounded-full bg-indigo-500/20 px-3 py-1.5 font-semibold text-indigo-200">
                    Create task
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  <span className="rounded-full bg-violet-500/20 px-3 py-1.5 font-semibold text-violet-200">
                    Assign Dana · 3 days
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal
              delay={160}
              className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 lg:col-span-3"
            >
              <p className="text-sm font-semibold text-primary">Dashboard</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">
                Know where the money is
              </h3>
              <div aria-hidden className="mt-5">
                <RevenueChart />
              </div>
            </Reveal>

            {SMALL_FEATURES.map(({ Icon, title, body }, i) => (
              <Reveal
                key={title}
                delay={i * 60}
                className="group rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_48px_-28px_rgba(79,70,229,0.55)] lg:col-span-2"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </Reveal>
            ))}
          </div>
          <p className="mt-8">
            <NextLink
              href="/features"
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
            >
              See every feature <ArrowRight aria-hidden className="h-4 w-4" />
            </NextLink>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Comparison                                                    */}
      {/* ------------------------------------------------------------ */}
      <section
        id="compare"
        className="relative mx-3 scroll-mt-20 overflow-hidden rounded-[2rem] bg-muted sm:mx-5"
      >
        <div aria-hidden className="bg-grid-light absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <Reveal>
            <SectionHeading eyebrow="Compare" title="How Orgaflow stacks up">
              FreshBooks and QuickBooks are built around the books. Jobber is
              built for field crews. Orgaflow is built around the job, and it's
              honest about what it doesn't do.
            </SectionHeading>
          </Reveal>
          <Reveal delay={100} className="mt-12 rounded-3xl bg-white p-4 sm:p-8">
            <ComparisonTable />
          </Reveal>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {COMPETITORS.map(({ slug, name }) => (
              <li key={slug}>
                <NextLink
                  href={`/compare/${slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 font-semibold transition-colors hover:border-primary"
                >
                  Orgaflow vs {name}
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1"
                  />
                </NextLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Keep your accountant + founder                                */}
      {/* ------------------------------------------------------------ */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-24 sm:py-28 md:grid-cols-2">
          <Reveal className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white sm:p-10">
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Keep your accountant.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-indigo-100">
              Orgaflow covers everything from the first quote to the finished
              job, and leaves the bookkeeping to the tools made for it.
            </p>
          </Reveal>
          <Reveal
            delay={100}
            className="rounded-3xl border border-border bg-card p-8 sm:p-10"
          >
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              The person who builds it answers.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Orgaflow is built and supported by its founder, Sylvio Lima. The
              roadmap and changelog are public.
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
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Plans                                                         */}
      {/* ------------------------------------------------------------ */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pb-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Pricing" title="Plans for every stage" />
            <NextLink
              href="/pricing"
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
            >
              Compare all plans <ArrowRight aria-hidden className="h-4 w-4" />
            </NextLink>
          </Reveal>
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {PLANS.map(({ name, price, note, points, featured }, i) => (
              <Reveal
                as="li"
                key={name}
                delay={i * 90}
                className={
                  featured
                    ? "ring-gradient relative rounded-3xl bg-ink p-8 text-white shadow-[0_30px_60px_-30px_rgba(79,70,229,0.8)]"
                    : "rounded-3xl border border-border bg-card p-8"
                }
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{name}</h3>
                  {featured ? (
                    <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-4xl font-extrabold tracking-[-0.03em]">
                  {price}
                </p>
                <p
                  className={
                    featured
                      ? "mt-1 text-sm text-slate-400"
                      : "mt-1 text-sm text-muted-foreground"
                  }
                >
                  {note}
                </p>
                <ul className="mt-6 flex flex-col gap-2.5 text-sm">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <Check
                        aria-hidden
                        className={
                          featured
                            ? "mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                            : "mt-0.5 h-4 w-4 shrink-0 text-primary"
                        }
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* FAQ                                                           */}
      {/* ------------------------------------------------------------ */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 sm:py-28 lg:grid-cols-[1fr_2fr]">
          <SectionHeading eyebrow="FAQ" title="Common questions" />
          <div className="flex flex-col gap-3">
            {HOME_FAQS.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border border-border bg-card px-5 py-4 transition-colors open:border-primary/30 open:bg-accent/40"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-normal leading-none text-primary transition-transform duration-300 group-open:rotate-45 group-open:bg-primary group-open:text-white"
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

      <CtaBand />
    </>
  );
}

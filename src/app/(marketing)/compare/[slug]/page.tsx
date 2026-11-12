import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/json-ld";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import {
  BrowserFrame,
  DashboardMock,
} from "@/components/marketing/product-mockups";
import { Reveal } from "@/components/marketing/reveal";
import {
  COMPARISON_CHECKED_ON,
  COMPETITORS,
  getCompetitor,
} from "@/lib/competitors";
import { marketingMetadata } from "@/lib/marketing-metadata";
import {
  formatUsdPrice,
  getWorkspacePlanPrice,
  PLAN_TRIAL_DAYS,
} from "@/lib/subscription-plans";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPETITORS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) return {};

  return marketingMetadata({
    title: `Orgaflow vs ${competitor.name}: A Simpler ${competitor.keyword}`,
    description: `Compare Orgaflow and ${competitor.name} on price, team members, estimates, invoicing, tasks, and automations. See when ${competitor.name} is the better fit and when Orgaflow is.`,
    path: `/compare/${slug}`,
  });
}

export default async function CompareCompetitorPage({ params }: PageProps) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) notFound();

  const { name, summary, startingPrice, chooseThemIf, chooseOrgaflowIf } =
    competitor;
  const growth = formatUsdPrice(getWorkspacePlanPrice("growth", "monthly"));
  const others = COMPETITORS.filter((c) => c.slug !== slug);

  const faqs = [
    {
      q: `Is Orgaflow a good ${competitor.keyword}?`,
      a: `It is if your work runs on estimates, approvals, invoices, and the tasks that follow. ${summary}`,
    },
    {
      q: `How much does Orgaflow cost compared with ${name}?`,
      a: `Orgaflow has a free Starter plan with no time limit. Growth is ${growth}/month with 5 team members and a ${PLAN_TRIAL_DAYS}-day free trial. ${name} starts at ${startingPrice}, based on its public US list price checked in ${COMPARISON_CHECKED_ON}.`,
    },
    {
      q: `Can I use Orgaflow alongside ${name}?`,
      a:
        slug === "jobber"
          ? "You could, but most teams pick one. Orgaflow suits teams that want the quote-to-paid flow without dispatch and route planning."
          : `Yes. Many businesses keep ${name} for bookkeeping and use Orgaflow for estimates, approvals, invoices, and the work that follows.`,
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Compare", path: "/compare" },
          { name: `Orgaflow vs ${name}`, path: `/compare/${slug}` },
        ]}
      />
      <FaqJsonLd faqs={faqs} />

      <PageHero
        eyebrow={competitor.keyword}
        title={
          <>
            Orgaflow vs <span className="text-gradient-dark">{name}</span>
          </>
        }
      >
        {summary}
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal className="ring-gradient relative overflow-hidden rounded-3xl bg-ink p-8 text-white">
            <div aria-hidden className="aurora absolute inset-0 opacity-50" />
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight">
                Choose Orgaflow if…
              </h2>
              <ul className="mt-6 flex flex-col gap-3">
                {chooseOrgaflowIf.map((reason) => (
                  <li key={reason} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-ink">
                      <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-slate-200">{reason}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-slate-400">
                Free forever on Starter · Growth {growth}/mo
              </p>
            </div>
          </Reveal>
          <Reveal
            delay={100}
            className="rounded-3xl border border-border bg-card p-8"
          >
            <h2 className="text-2xl font-bold tracking-tight">
              Choose {name} if…
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {chooseThemIf.map((reason) => (
                <li key={reason} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              From {startingPrice}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          Feature by feature
        </h2>
        <Reveal className="mt-10 rounded-3xl border border-border bg-white p-4 sm:p-8">
          <ComparisonTable
            vendors={["orgaflow", competitor.slug]}
            caption={`Orgaflow compared with ${name}`}
          />
        </Reveal>
      </section>

      <section className="on-dark relative mx-3 overflow-hidden rounded-[2rem] bg-ink text-white sm:mx-5">
        <div aria-hidden className="aurora absolute inset-0 opacity-70" />
        <div aria-hidden className="bg-grid absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Built around the job, not the books
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              One panel shows revenue, estimates waiting on a reply, invoices
              that need attention, and what your team did today.
            </p>
            <NextLink
              href="/features"
              className="mt-6 inline-flex items-center gap-1.5 font-semibold text-indigo-200 hover:text-white"
            >
              Explore the features{" "}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </NextLink>
          </div>
          <figure className="min-w-0">
            <figcaption className="sr-only">
              The Orgaflow dashboard with revenue, open estimates, unpaid
              invoices, and recent activity.
            </figcaption>
            <BrowserFrame>
              <DashboardMock />
            </BrowserFrame>
          </figure>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-24 lg:grid-cols-[1fr_2fr]">
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          Questions about switching
        </h2>
        <div className="flex flex-col gap-3">
          {faqs.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-lg font-bold">{q}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
          <p className="mt-4 text-sm text-muted-foreground">
            Also compare:{" "}
            {others.map((other, i) => (
              <span key={other.slug}>
                {i > 0 ? " · " : null}
                <NextLink
                  href={`/compare/${other.slug}`}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Orgaflow vs {other.name}
                </NextLink>
              </span>
            ))}
          </p>
        </div>
      </section>

      <CtaBand title="Try Orgaflow free before you decide." />
    </>
  );
}

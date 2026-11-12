import type { Metadata } from "next";
import NextLink from "next/link";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { marketingMetadata } from "@/lib/marketing-metadata";
import {
  ANNUAL_DISCOUNT_PERCENT,
  formatUsdPrice,
  getWorkspacePlanPrice,
  PLAN_TRIAL_DAYS,
} from "@/lib/subscription-plans";
import { PricingPlans } from "./pricing-plans";

export const metadata: Metadata = marketingMetadata({
  title: `Pricing: Free Plan, Paid Plans from ${formatUsdPrice(getWorkspacePlanPrice("growth", "monthly"))}/mo`,
  description:
    "Orgaflow pricing: a free-forever Starter plan, plus Growth and Scale with a 15-day free trial and 30% off annually. Compare plans and see how Orgaflow stacks up against FreshBooks, QuickBooks, and Jobber.",
  path: "/pricing",
});

const FAQS = [
  {
    q: "Can I change my plan later?",
    a: "Yes. Upgrades take effect immediately. To downgrade, contact support before your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: `Starter is free. Growth and Scale start with a ${PLAN_TRIAL_DAYS}-day free trial before billing begins.`,
  },
  {
    q: "How do I pay for Orgaflow?",
    a: "By credit or debit card, through Stripe.",
  },
  {
    q: "How many people can I invite?",
    a: "Starter includes up to 2 team members, Growth up to 5, and Scale up to 10. If you need more, contact us.",
  },
  {
    q: "How much do I save with annual billing?",
    a: `Annual billing costs ${ANNUAL_DISCOUNT_PERCENT}% less than paying monthly.`,
  },
  {
    q: "Can my clients pay invoices online?",
    a: "Not yet. Online card payments through Stripe are in development for Scale. On every plan today, you record payments in Orgaflow and the invoice status updates when it is fully paid.",
  },
  {
    q: "What happens when I cancel?",
    a: "Cancel from the Stripe billing portal. Your account stays active until the end of the billing period.",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Start free. Upgrade when the work grows."
      >
        Starter costs nothing. Growth and Scale include a {PLAN_TRIAL_DAYS}-day
        free trial, and annual billing saves {ANNUAL_DISCOUNT_PERCENT}%.
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <PricingPlans />
      </section>

      <section className="mx-3 rounded-[2rem] bg-muted sm:mx-5">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1fr_2fr]">
          <h2 className="text-4xl font-extrabold tracking-[-0.03em]">
            Pricing questions
          </h2>
          <div className="flex flex-col gap-2">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-2xl bg-white px-5 py-5">
                <h3 className="text-lg font-bold">{q}</h3>
                <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading eyebrow="Compare" title="What you get for the price">
          List prices for the entry paid plan of each tool, and what they
          include. Orgaflow also has a free plan with no time limit.
        </SectionHeading>
        <div className="mt-12 rounded-3xl border border-border bg-white p-4 sm:p-8">
          <ComparisonTable />
        </div>
        <p className="mt-6">
          <NextLink
            href="/compare"
            className="font-semibold text-primary underline underline-offset-4"
          >
            Read the full comparisons
          </NextLink>
        </p>
      </section>

      <CtaBand />
    </>
  );
}

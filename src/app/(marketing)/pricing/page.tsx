import type { Metadata } from "next";
import NextLink from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { marketingMetadata } from "@/lib/marketing-metadata";
import {
  ANNUAL_DISCOUNT_PERCENT,
  PLAN_TRIAL_DAYS,
} from "@/lib/subscription-plans";
import { PricingPlans } from "./pricing-plans";

export const metadata: Metadata = marketingMetadata({
  title: "Pricing for Estimate & Invoice Software",
  description:
    "Orgaflow pricing: a free Starter plan, plus Growth and Scale with a 15-day free trial. Save 30% with annual billing. See what each plan includes.",
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
      <PageHero title="Start free. Upgrade when the work grows.">
        Starter costs nothing. Growth and Scale include a {PLAN_TRIAL_DAYS}-day
        free trial, and annual billing saves {ANNUAL_DISCOUNT_PERCENT}%.
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <PricingPlans />
      </section>

      <section className="mx-3 rounded-[2rem] sm:mx-5 bg-muted">
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

      <section className="mx-3 rounded-[2rem] sm:mx-5 mb-5 mt-5 bg-canary">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Send your first estimate today.
          </h2>
          <Button
            size="lg"
            asChild
            className="h-12 shrink-0 rounded-full bg-foreground px-7 text-base text-background hover:bg-foreground/85"
          >
            <NextLink href="/register">Start free</NextLink>
          </Button>
        </div>
      </section>
    </>
  );
}

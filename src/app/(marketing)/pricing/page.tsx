import { ArrowRight, HelpCircle } from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import {
  ANNUAL_DISCOUNT_PERCENT,
  PLAN_TRIAL_DAYS,
} from "@/lib/subscription-plans";
import { PricingPlans } from "./pricing-plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for every stage of your business, including a free Starter plan.",
  keywords: [
    "pricing",
    "invoice software pricing",
    "estimate software price",
    "free invoicing tool",
    "small business billing plans",
  ],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — Orgaflow",
    description:
      "Simple, transparent pricing for every stage of your business, including a free Starter plan.",
    url: "/pricing",
    type: "website",
  },
  twitter: {
    title: "Pricing — Orgaflow",
    description:
      "Simple, transparent pricing for every stage of your business, including a free Starter plan.",
  },
};

const FAQS = [
  {
    q: "Can I change my plan later?",
    a: "Absolutely. You can upgrade at any time. Changes take effect immediately. Downgrades are handled by our support team before your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Starter is free. Paid plans can start with a 15-day free trial before billing starts.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. Annual plans can also be paid by bank transfer.",
  },
  {
    q: "How many users can I invite?",
    a: "Starter supports up to 2 users, Growth up to 5, and Scale up to 10. Need more? Contact us for a custom arrangement.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "Yes. Annual billing saves 30% compared to monthly pricing. You can switch anytime from your billing settings.",
  },
  {
    q: "What happens when I cancel?",
    a: "You can cancel via the Stripe billing portal. Your account stays active until the end of your billing period. Export your data before or after cancellation.",
  },
];

export default function PricingPage() {
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
            Pricing
          </p>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            No hidden fees. No surprises. Starter is free, paid plans include a{" "}
            {PLAN_TRIAL_DAYS}-day free trial, and annual billing saves{" "}
            {ANNUAL_DISCOUNT_PERCENT}%.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <PricingPlans />
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/40 py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              FAQ
            </p>
            <h2 className="text-4xl font-bold text-foreground">
              Frequently asked questions
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="py-6">
                <div className="mb-3 flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <h3 className="font-semibold text-foreground">{q}</h3>
                </div>
                <p className="pl-8 text-sm leading-relaxed text-muted-foreground">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Ready to get started?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Pick the plan that fits now. Starter is free, and paid plans include
            a {PLAN_TRIAL_DAYS}-day free trial.
          </p>
          <Button
            size="lg"
            asChild
            className="px-10 shadow-lg shadow-primary/25"
          >
            <NextLink href="/register">
              Start free
              <ArrowRight className="ml-2 h-4 w-4" />
            </NextLink>
          </Button>
        </div>
      </section>
    </div>
  );
}

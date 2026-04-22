import { ArrowRight, Check, HelpCircle, X } from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import {
  ANNUAL_DISCOUNT_PERCENT,
  formatWorkspacePlanPrice,
  PLAN_TRIAL_DAYS,
} from "@/lib/subscription-plans";

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

const PLANS = [
  {
    name: "Starter",
    priceLabel: "Free",
    annualLabel: "Free",
    description:
      "Perfect for freelancers and solo business owners who want the full billing flow with lower usage limits.",
    cta: "Start free",
    ctaHref: "/register",
    popular: false,
    features: [
      "Up to 2 team members",
      "Up to 50 customers",
      "Up to 50 estimates",
      "Up to 50 invoices",
      "Public estimate & invoice links",
      "Email support",
    ],
    missing: [
      "Task board (Kanban)",
      "File attachments",
      "Custom branding on exports",
      "Stripe online payments",
      "Workflow automations",
      "Advanced reports",
    ],
  },
  {
    name: "Growth",
    priceLabel: formatWorkspacePlanPrice("growth", "monthly"),
    annualLabel: formatWorkspacePlanPrice("growth", "annual"),
    description: "For growing teams that need unlimited capacity and branding.",
    cta: "Start 15-day trial",
    ctaHref: "/register",
    popular: true,
    features: [
      "Up to 5 team members",
      "Unlimited customers",
      "Unlimited estimates",
      "Unlimited invoices",
      "Task board (Kanban)",
      "Public estimate & invoice links",
      "1 GB file attachment storage",
      "Custom branding on exports",
      "Priority email support",
    ],
    missing: [
      "Stripe online payments",
      "Workflow automations",
      "Advanced reports",
    ],
  },
  {
    name: "Scale",
    priceLabel: formatWorkspacePlanPrice("scale", "monthly"),
    annualLabel: formatWorkspacePlanPrice("scale", "annual"),
    description:
      "For established businesses that want full automation and payments.",
    cta: "Start 15-day trial",
    ctaHref: "/register",
    popular: false,
    features: [
      "Up to 10 team members",
      "Unlimited customers",
      "Unlimited estimates",
      "Unlimited invoices",
      "Task board (Kanban)",
      "Public estimate & invoice links",
      "10 GB file attachment storage",
      "Custom branding on exports",
      "Stripe online payments",
      "Workflow automations",
      "Advanced reports & analytics",
      "Priority support",
    ],
    missing: [],
  },
];

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

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1">
            <div className="rounded-full bg-background px-5 py-1.5 text-sm font-medium text-foreground shadow-sm">
              Monthly
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium text-muted-foreground">
              Annual
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                Save {ANNUAL_DISCOUNT_PERCENT}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map(
            ({
              name,
              priceLabel,
              annualLabel,
              description,
              cta,
              ctaHref,
              popular,
              features,
              missing,
            }) => (
              <div
                key={name}
                className={`relative flex flex-col overflow-hidden rounded-2xl border ${
                  popular
                    ? "border-primary bg-primary/[0.03] shadow-xl shadow-primary/10"
                    : "border-border bg-background shadow-sm"
                } p-8`}
              >
                {popular && (
                  <div className="absolute right-0 top-0">
                    <div className="rounded-bl-2xl bg-primary px-4 py-1.5 text-xs font-semibold text-white">
                      Most popular
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">
                    {name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-foreground">
                      {priceLabel}
                    </span>
                    {name !== "Starter" ? (
                      <span className="mb-2 text-muted-foreground">/mo</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {name === "Starter"
                      ? "No card required. Upgrade when you need more capacity."
                      : `${annualLabel}/yr billed annually. Includes a ${PLAN_TRIAL_DAYS}-day free trial and saves ${ANNUAL_DISCOUNT_PERCENT}%.`}
                  </p>
                </div>

                <Button
                  asChild
                  className={
                    popular ? "mb-8 shadow-md shadow-primary/20" : "mb-8"
                  }
                  variant={popular ? "default" : "outline"}
                >
                  <NextLink href={ctaHref}>
                    {cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </NextLink>
                </Button>

                <div className="flex flex-1 flex-col gap-3">
                  {features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-sm text-foreground/80">{f}</span>
                    </div>
                  ))}
                  {missing.map((f) => (
                    <div key={f} className="flex items-start gap-3 opacity-40">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>

        {/* Enterprise note */}
        <div className="mt-8 rounded-2xl border border-border bg-muted/40 px-8 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need a custom plan for your enterprise?{" "}
            <NextLink
              href="/contact"
              className="font-medium text-primary hover:underline"
            >
              Talk to our sales team
            </NextLink>{" "}
            — we'll build something that fits.
          </p>
        </div>
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

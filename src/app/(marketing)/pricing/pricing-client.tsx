"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const plans = [
  {
    name: "Free",
    priceMonthly: "$0",
    priceAnnual: "$0",
    annualNote: "Free forever",
    description: "For solo users and early evaluation.",
    cta: "Get started",
    href: "/auth/sign-up",
    highlight: false,
    features: [
      "1 company",
      "100 invoices",
      "100 estimates",
      "2 users",
      "Basic reports",
      "Email support (48–72h)",
    ],
  },
  {
    name: "Growth",
    priceMonthly: "$39",
    priceAnnual: "$23",
    annualNote: "$276 billed yearly (40% off)",
    description: "Best value for growing teams.",
    cta: "Start Growth",
    href: "/auth/sign-up",
    highlight: true,
    features: [
      "Up to 5 companies",
      "5,000 invoices",
      "5,000 estimates",
      "Unlimited users",
      "Recurring billing",
      "Standard reports",
      "Email support (24h)",
    ],
  },
  {
    name: "Enterprise",
    priceMonthly: "$99",
    priceAnnual: "$59",
    annualNote: "$708 billed yearly (40% off)",
    description: "Advanced governance and reporting.",
    cta: "Contact sales",
    href: "/auth/sign-up",
    highlight: false,
    features: [
      "Up to 10 companies",
      "20,000 invoices",
      "20,000 estimates",
      "Unlimited users",
      "Advanced reports",
      "Custom fields",
      "Priority support + SLA",
    ],
  },
];

export default function PricingClient() {
  const [interval, setInterval] = useState<"month" | "year">("month");

  const pricing = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        displayPrice: interval === "month" ? plan.priceMonthly : plan.priceAnnual,
        displayNote:
          interval === "month"
            ? "Billed monthly"
            : `${plan.annualNote || "Billed yearly"}`,
      })),
    [interval],
  );

  return (
    <div className="space-y-14">
      <section className="space-y-6 text-center">
        <h1 className="text-3xl font-semibold md:text-4xl">Pricing</h1>
        <p className="text-sm text-neutral-600">
          Start free, then scale with a plan built for your organization.
        </p>
        <p className="text-xs text-neutral-500">
          Annual billing includes a 40% discount while we are in early access.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`rounded-full px-4 py-2 text-xs font-medium ${
              interval === "month"
                ? "bg-black text-white"
                : "border border-neutral-200 text-neutral-600"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`rounded-full px-4 py-2 text-xs font-medium ${
              interval === "year"
                ? "bg-black text-white"
                : "border border-neutral-200 text-neutral-600"
            }`}
          >
            Annual (40% off)
          </button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {pricing.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border bg-white p-6 shadow-sm ${
              plan.highlight ? "border-black shadow-md" : "border-neutral-200"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {plan.highlight ? (
                  <span className="rounded-full bg-black px-2 py-1 text-xs text-white">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-neutral-600">{plan.description}</p>
              <div className="space-y-1">
                <div className="text-3xl font-semibold">
                  {plan.displayPrice}
                  <span className="text-sm font-normal text-neutral-500">
                    /mo
                  </span>
                </div>
                <div className="text-sm text-neutral-500">
                  {plan.displayNote}
                </div>
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-neutral-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`${plan.href}?plan=${plan.name.toLowerCase()}&interval=${interval}`}
              className={`mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium ${
                plan.highlight
                  ? "bg-black text-white"
                  : "border border-neutral-200 text-neutral-900"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-neutral-50 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm font-semibold">Included in all plans</div>
            <p className="mt-2 text-sm text-neutral-600">
              Dashboard, customers, items, estimates, invoices, payments, and
              expenses.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold">Need help deciding?</div>
            <p className="mt-2 text-sm text-neutral-600">
              We can map the right plan to your number of companies and billing
              volume.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Talk to sales
            </Link>
            <Link
              href={`/auth/sign-up?plan=free&interval=${interval}`}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Start free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

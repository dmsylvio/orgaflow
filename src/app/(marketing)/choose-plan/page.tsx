"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const plans = [
  {
    name: "Free",
    priceMonthly: "$0",
    priceAnnual: "$0",
    annualNote: "Free forever",
    description: "For solo users and early evaluation.",
    cta: "Get started",
    highlight: false,
    features: [
      "1 company",
      "100 invoices",
      "100 estimates",
      "2 users",
      "Basic reports",
    ],
  },
  {
    name: "Growth",
    priceMonthly: "$39",
    priceAnnual: "$23",
    annualNote: "$276 billed yearly (40% off)",
    description: "Best value for growing teams.",
    cta: "Start Growth",
    highlight: true,
    features: [
      "Up to 5 companies",
      "5,000 invoices",
      "5,000 estimates",
      "Unlimited users",
      "Recurring billing",
      "Standard reports",
    ],
  },
  {
    name: "Enterprise",
    priceMonthly: "$99",
    priceAnnual: "$59",
    annualNote: "$708 billed yearly (40% off)",
    description: "Advanced governance and reporting.",
    cta: "Contact sales",
    highlight: false,
    features: [
      "Up to 10 companies",
      "20,000 invoices",
      "20,000 estimates",
      "Unlimited users",
      "Advanced reports",
      "Custom fields",
    ],
  },
];

function ChoosePlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get("orgId") ?? "";
  const orgName = searchParams.get("orgName") ?? "";
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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

  const handleSelect = async (planName: string) => {
    if (!orgId || !orgName) {
      router.push("/auth/sign-up");
      return;
    }

    if (planName === "free") {
      router.replace("/app");
      return;
    }

    setLoadingPlan(planName);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planName,
          interval,
          orgName,
          orgId,
        }),
      });
      const payload = (await res.json()) as { url?: string };
      if (!res.ok || !payload.url) {
        throw new Error("Checkout failed");
      }
      window.location.href = payload.url;
    } finally {
      setLoadingPlan(null);
    }
  };

  if (!orgId || !orgName) {
    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-semibold">Choose your plan</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Create an account first to select a plan.
        </p>
        <Link
          href="/auth/sign-up"
          className="mt-6 inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Go to sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-semibold md:text-4xl">Choose your plan</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Start with a plan that fits your organization.
          </p>
        </div>
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

            <button
              type="button"
              onClick={() => handleSelect(plan.name.toLowerCase())}
              disabled={loadingPlan === plan.name.toLowerCase()}
              className={`mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium ${
                plan.highlight
                  ? "bg-black text-white"
                  : "border border-neutral-200 text-neutral-900"
              }`}
            >
              {loadingPlan === plan.name.toLowerCase()
                ? "Redirecting..."
                : plan.cta}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function ChoosePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-sm text-neutral-500">Loading…</div>
        </div>
      }
    >
      <ChoosePlanContent />
    </Suspense>
  );
}

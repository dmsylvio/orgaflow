"use client";

import { Check, X } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ANNUAL_DISCOUNT_PERCENT,
  formatUsdPrice,
  getWorkspacePlanPrice,
  PLAN_TRIAL_DAYS,
} from "@/lib/subscription-plans";
import type { WorkspaceBillingInterval } from "@/schemas/workspace";

export function PricingPlans() {
  const [billingInterval, setBillingInterval] =
    useState<WorkspaceBillingInterval>("monthly");
  const isAnnual = billingInterval === "annual";

  return (
    <>
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-white p-1">
          <button
            type="button"
            aria-pressed={!isAnnual}
            onClick={() => setBillingInterval("monthly")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              isAnnual
                ? "text-muted-foreground hover:text-foreground"
                : "bg-primary text-primary-foreground "
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={isAnnual}
            onClick={() => setBillingInterval("annual")}
            className={`flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              isAnnual
                ? "bg-primary text-primary-foreground "
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                isAnnual
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-canary text-foreground"
              }`}
            >
              Save {ANNUAL_DISCOUNT_PERCENT}%
            </span>
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map(
          ({
            name,
            plan,
            description,
            cta,
            ctaHref,
            popular,
            features,
            missing,
          }) => {
            const isPaid = plan !== null;
            const annualTotal = isPaid
              ? getWorkspacePlanPrice(plan, "annual")
              : 0;
            const displayPrice = !isPaid
              ? "Free"
              : isAnnual
                ? formatUsdPrice(annualTotal)
                : formatUsdPrice(getWorkspacePlanPrice(plan, "monthly"));

            return (
              <div
                key={name}
                className={`relative flex flex-col overflow-hidden rounded-3xl ${
                  popular
                    ? "border-2 border-primary bg-white"
                    : "border-2 border-foreground/10 bg-white"
                } p-8`}
              >
                {popular && (
                  <div className="absolute right-4 top-4">
                    <div className="rounded-full bg-canary px-3 py-1 text-xs font-bold text-foreground">
                      Recommended
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">
                    {name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <div className="mb-8 rounded-full">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold tracking-[-0.03em] text-foreground">
                      {displayPrice}
                    </span>
                    {isPaid ? (
                      <span className="mb-2 text-muted-foreground">
                        {isAnnual ? "/yr" : "/mo"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {!isPaid
                      ? "No card required. Upgrade when you need more capacity."
                      : isAnnual
                        ? `Billed annually (${formatUsdPrice(annualTotal / 12)}/mo). Includes a ${PLAN_TRIAL_DAYS}-day free trial and saves ${ANNUAL_DISCOUNT_PERCENT}%.`
                        : `Billed monthly. Includes a ${PLAN_TRIAL_DAYS}-day free trial.`}
                  </p>
                </div>

                <Button
                  asChild
                  className="mb-8 rounded-full"
                  variant={popular ? "default" : "outline"}
                >
                  <NextLink href={ctaHref}>{cta}</NextLink>
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
            );
          },
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-muted px-6 py-5">
        <p className="mb-2 text-sm text-muted-foreground">
          Online card payments through Stripe are in development for the Scale
          plan.
        </p>
        <p className="text-sm text-muted-foreground">
          Need more than 10 team members?{" "}
          <NextLink
            href="/contact"
            className="font-medium text-primary hover:underline"
          >
            Contact us
          </NextLink>{" "}
          and we'll work out an arrangement.
        </p>
      </div>
    </>
  );
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    plan: null,
    description: "For freelancers and very small teams getting started.",
    cta: "Start free",
    ctaHref: "/register",
    popular: false,
    features: [
      "Up to 2 team members",
      "Up to 50 customers",
      "Up to 200 estimates",
      "Up to 200 invoices",
      "Public estimate & invoice links",
      "Email support",
    ],
    missing: [
      "Task board (Kanban)",
      "File attachments",
      "Custom branding on exports",
      "Workflow automations",
      "Advanced reports",
    ],
  },
  {
    name: "Growth",
    plan: "growth",
    description:
      "For teams that need unlimited documents, a task board, and their own branding.",
    cta: `Start ${PLAN_TRIAL_DAYS}-day trial`,
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
    missing: ["Workflow automations", "Advanced reports"],
  },
  {
    name: "Scale",
    plan: "scale",
    description:
      "For teams that want the work to start automatically, with deeper reports.",
    cta: `Start ${PLAN_TRIAL_DAYS}-day trial`,
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
      "Workflow automations",
      "Advanced reports & analytics",
      "Priority support",
    ],
    missing: [],
  },
];

interface Plan {
  name: string;
  plan: "growth" | "scale" | null;
  description: string;
  cta: string;
  ctaHref: string;
  popular: boolean;
  features: string[];
  missing: string[];
}

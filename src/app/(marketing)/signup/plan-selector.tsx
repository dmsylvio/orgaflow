"use client";

import { useMemo } from "react";

type PlanKey = "free" | "growth" | "enterprise";
type Interval = "month" | "year";

const planCopy: Record<PlanKey, {
  title: string;
  description: string;
  monthly: string;
  annual: string;
  annualNote: string;
}> = {
  free: {
    title: "Free",
    description: "For solo users and early evaluation.",
    monthly: "$0",
    annual: "$0",
    annualNote: "Free forever",
  },
  growth: {
    title: "Growth",
    description: "Best value for growing teams.",
    monthly: "$39",
    annual: "$23",
    annualNote: "$276 billed yearly (40% off)",
  },
  enterprise: {
    title: "Enterprise",
    description: "Advanced governance and reporting.",
    monthly: "$99",
    annual: "$59",
    annualNote: "$708 billed yearly (40% off)",
  },
};

type Props = {
  plan: PlanKey;
  interval: Interval;
  onPlanChange: (value: PlanKey) => void;
  onIntervalChange: (value: Interval) => void;
};

export default function PlanSelector({
  plan,
  interval,
  onPlanChange,
  onIntervalChange,
}: Props) {
  const pricing = useMemo(() => planCopy[plan], [plan]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onIntervalChange("month")}
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
          onClick={() => onIntervalChange("year")}
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            interval === "year"
              ? "bg-black text-white"
              : "border border-neutral-200 text-neutral-600"
          }`}
        >
          Annual (40% off)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(["free", "growth", "enterprise"] as PlanKey[]).map((key) => {
          const planInfo = planCopy[key];
          const isSelected = plan === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPlanChange(key)}
              className={`rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-black shadow-md"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{planInfo.title}</div>
                {key === "growth" ? (
                  <span className="rounded-full bg-black px-2 py-1 text-xs text-white">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-neutral-600">
                {planInfo.description}
              </p>
              <div className="mt-4 text-2xl font-semibold">
                {interval === "month" ? planInfo.monthly : planInfo.annual}
                <span className="text-xs font-normal text-neutral-500">
                  /mo
                </span>
              </div>
              <div className="text-xs text-neutral-500">
                {interval === "month" ? "Billed monthly" : planInfo.annualNote}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

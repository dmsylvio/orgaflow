"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

function formatPlan(plan?: string | null) {
  if (!plan) return "Free";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export default function BillingPage() {
  const billing = trpc.billing.current.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const [loading, setLoading] = useState(false);

  const onManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const current = billing.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-neutral-500">
          Manage your subscription and billing details.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-neutral-500">Current plan</div>
            <div className="text-lg font-semibold">
              {formatPlan(current?.plan)}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Status</div>
            <div className="text-sm font-medium">
              {current?.status ? current.status : "active"}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Billing</div>
            <div className="text-sm font-medium">
              {current?.interval ? `Billed ${current.interval}ly` : "Free"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {current?.stripeCustomerId ? (
            <button
              type="button"
              onClick={onManage}
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
            >
              {loading ? "Opening..." : "Manage billing"}
            </button>
          ) : (
            <a
              href="/pricing"
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Upgrade plan
            </a>
          )}
          <a
            href="/pricing"
            className="rounded border px-4 py-2 text-sm font-medium"
          >
            View pricing
          </a>
        </div>
      </div>

      {current?.currentPeriodEnd ? (
        <div className="text-sm text-neutral-500">
          Next billing date: {new Date(current.currentPeriodEnd).toDateString()}
        </div>
      ) : null}
    </div>
  );
}

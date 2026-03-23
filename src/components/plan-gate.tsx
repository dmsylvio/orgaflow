"use client";

import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/trpc/client";

type Plan = "starter" | "growth" | "scale";

const PLAN_RANK: Record<Plan, number> = { starter: 0, growth: 1, scale: 2 };

const PLAN_LABEL: Record<Plan, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

const PLAN_FEATURES: Record<Plan, string[]> = {
  starter: [],
  growth: ["Attachments", "Custom branding", "Unlimited records", "5 team members"],
  scale: [
    "Everything in Growth",
    "Workflow automations",
    "Tasks & Kanban board",
    "Stripe online payments",
    "Up to 10 team members",
    "Advanced reports",
    "Priority support",
  ],
};

function planAtLeast(actual: Plan, required: Plan): boolean {
  return PLAN_RANK[actual] >= PLAN_RANK[required];
}

// ---------------------------------------------------------------------------
// Upgrade banner shown inside a locked settings page
// ---------------------------------------------------------------------------

function UpgradeBanner({
  currentPlan,
  requiredPlan,
}: {
  currentPlan: Plan;
  requiredPlan: Plan;
}) {
  const router = useRouter();
  const trpc = useTRPC();

  const upgrade = useQuery(trpc.settings.getBilling.queryOptions());
  void upgrade; // ensure query is prefetched; we only use the router

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {PLAN_LABEL[requiredPlan]} plan required
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This feature is available on the{" "}
        <span className="font-medium text-foreground">
          Orgaflow {PLAN_LABEL[requiredPlan]}
        </span>{" "}
        plan. You are currently on the{" "}
        <span className="font-medium text-foreground">
          {PLAN_LABEL[currentPlan]}
        </span>{" "}
        plan.
      </p>

      {/* Feature list */}
      <ul className="mt-6 space-y-2 text-left">
        {PLAN_FEATURES[requiredPlan].map((f) => (
          <li
            key={f}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>

      <Button
        className="mt-8"
        onClick={() => router.push("/app/settings/billing")}
      >
        Upgrade to {PLAN_LABEL[requiredPlan]}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// usePlanCheck — use this to disable queries when plan is insufficient
// ---------------------------------------------------------------------------

/**
 * Returns whether the current org meets the required plan.
 * While billing is loading, `allowed` is `false` so queries stay disabled.
 *
 * @example
 * const { allowed } = usePlanCheck("scale");
 * const { data } = useQuery({ ...queryOptions, enabled: allowed });
 */
export function usePlanCheck(requiredPlan: Plan): { allowed: boolean } {
  const trpc = useTRPC();
  const { data: billing, isPending } = useQuery(
    trpc.settings.getBilling.queryOptions(),
  );
  if (isPending) return { allowed: false };
  // No billing record means org was created before billing was set up — treat as unrestricted.
  if (!billing) return { allowed: true };
  return { allowed: planAtLeast(billing.plan as Plan, requiredPlan) };
}

// ---------------------------------------------------------------------------
// PlanGate
// ---------------------------------------------------------------------------

/**
 * Wrap a settings section with this component to restrict it to a minimum plan.
 * Shows a loading state while the plan is fetched, then either renders children
 * or an upgrade prompt.
 */
export function PlanGate({
  requiredPlan,
  children,
}: {
  requiredPlan: Plan;
  children: React.ReactNode;
}) {
  const trpc = useTRPC();
  const { data: billing, isPending } = useQuery(
    trpc.settings.getBilling.queryOptions(),
  );

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  // No billing record — org has no subscription yet, treat as unrestricted.
  if (!billing) return <>{children}</>;

  const currentPlan = billing.plan as Plan;

  if (!planAtLeast(currentPlan, requiredPlan)) {
    return (
      <UpgradeBanner currentPlan={currentPlan} requiredPlan={requiredPlan} />
    );
  }

  return <>{children}</>;
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  HardDrive,
  Layers,
  Star,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  ANNUAL_DISCOUNT_PERCENT,
  formatWorkspacePlanPrice,
  PLAN_TRIAL_DAYS,
} from "@/lib/subscription-plans";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Plan = "starter" | "growth" | "scale";
type BillingInterval = "monthly" | "annual";

const PLAN_LABELS: Record<Plan, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

const PLAN_ORDER: Plan[] = ["starter", "growth", "scale"];

const PLAN_STORAGE_BYTES: Record<Plan, number | null> = {
  starter: null,
  growth: 1 * 1024 * 1024 * 1024, // 1 GB
  scale: 10 * 1024 * 1024 * 1024, // 10 GB
};

const PLAN_STORAGE_LABEL: Record<Plan, string> = {
  starter: "Not included",
  growth: "1 GB",
  scale: "10 GB",
};

const UPGRADE_PLAN_CONFIG: Record<
  Exclude<Plan, "starter">,
  {
    icon: React.ReactNode;
    iconBg: string;
    features: string[];
  }
> = {
  growth: {
    icon: <Star className="h-4 w-4" />,
    iconBg: "bg-violet-500/10 text-violet-600",
    features: [
      "Unlimited invoices, estimates, customers & items",
      "Up to 5 users",
      "1 GB file attachment storage",
      "Public invoice links & estimate approval",
      "Custom branding on exports",
    ],
  },
  scale: {
    icon: <Zap className="h-4 w-4" />,
    iconBg: "bg-amber-500/10 text-amber-600",
    features: [
      "Everything in Growth",
      "Up to 10 users",
      "10 GB file attachment storage",
      "Stripe online payments",
      "Workflow automations & advanced reports",
    ],
  },
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "soft";
    icon: typeof CheckCircle2;
    className?: string;
  }
> = {
  active: { label: "Active", variant: "soft", icon: CheckCircle2 },
  trialing: { label: "Trialing", variant: "soft", icon: CheckCircle2 },
  past_due: {
    label: "Past due",
    variant: "default",
    icon: AlertCircle,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  canceled: { label: "Canceled", variant: "secondary", icon: AlertCircle },
  unpaid: {
    label: "Unpaid",
    variant: "default",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  incomplete: { label: "Incomplete", variant: "secondary", icon: AlertCircle },
  incomplete_expired: {
    label: "Expired",
    variant: "secondary",
    icon: AlertCircle,
  },
  paused: { label: "Paused", variant: "secondary", icon: AlertCircle },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="mb-8" />
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-5 py-4">
      <p className="text-sm font-semibold text-foreground">{children}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File Storage Usage
// ---------------------------------------------------------------------------

/**
 * Mockup: no real storage tracking yet. Shows 0 used.
 * Replace `usedBytes` with a real query when storage tracking is implemented.
 */
function StorageUsageSection({ plan }: { plan: Plan }) {
  const limitBytes = PLAN_STORAGE_BYTES[plan];
  const usedBytes = 0; // mockup — swap with real data later

  const percent =
    limitBytes && limitBytes > 0
      ? Math.min(100, (usedBytes / limitBytes) * 100)
      : 0;

  const isWarning = percent >= 80;
  const isCritical = percent >= 95;

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          File attachment storage
        </span>
      </div>

      <div className="px-5 py-4">
        {plan === "starter" ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Not available on Starter
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Upgrade to Growth or Scale to attach files to invoices,
                estimates, and customers.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Used</span>
              <span className="text-sm font-medium text-foreground">
                {formatBytes(usedBytes)}{" "}
                <span className="text-muted-foreground">
                  / {PLAN_STORAGE_LABEL[plan]}
                </span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isCritical
                    ? "bg-destructive"
                    : isWarning
                      ? "bg-amber-500"
                      : "bg-primary",
                )}
                style={{ width: `${Math.max(percent, percent > 0 ? 2 : 0)}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {percent === 0
                ? "No files uploaded yet."
                : isCritical
                  ? "Storage almost full — consider upgrading your plan."
                  : isWarning
                    ? "Storage is getting full."
                    : `${percent.toFixed(1)}% used`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Upgrade section
// ---------------------------------------------------------------------------

function UpgradeSection({
  currentPlan,
  onUpgrade,
  isUpgradePending,
}: {
  currentPlan: Plan;
  onUpgrade: (
    plan: Exclude<Plan, "starter">,
    interval: BillingInterval,
  ) => void;
  isUpgradePending: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const upgradablePlans = PLAN_ORDER.filter(
    (p) =>
      p !== "starter" &&
      PLAN_ORDER.indexOf(p) > PLAN_ORDER.indexOf(currentPlan),
  ) as Exclude<Plan, "starter">[];

  if (upgradablePlans.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ArrowUpCircle className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Upgrade your plan
          </span>
        </div>

        {/* Billing interval toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              interval === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("annual")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors",
              interval === "annual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Annual
            <span className="font-semibold text-primary">
              -{ANNUAL_DISCOUNT_PERCENT}%
            </span>
          </button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {upgradablePlans.map((plan) => {
          const config = UPGRADE_PLAN_CONFIG[plan];
          const price = `${formatWorkspacePlanPrice(plan, interval)}${
            interval === "monthly" ? "/mo" : "/yr"
          }`;

          return (
            <div key={plan} className="flex items-start gap-4 px-5 py-5">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  config.iconBg,
                )}
              >
                {config.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {PLAN_LABELS[plan]}
                  </span>
                  <span className="text-sm text-muted-foreground">{price}</span>
                </div>
                <ul className="space-y-1">
                  {config.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                type="button"
                size="sm"
                loading={isUpgradePending}
                disabled={isUpgradePending}
                onClick={() => onUpgrade(plan, interval)}
              >
                Upgrade
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Payment failure section
// ---------------------------------------------------------------------------

function PaymentFailureSection({
  status,
  onOpenPortal,
  isPortalPending,
}: {
  status: string;
  onOpenPortal: () => void;
  isPortalPending: boolean;
}) {
  if (status !== "past_due" && status !== "unpaid") return null;

  const isPastDue = status === "past_due";

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-50 shadow-sm dark:bg-amber-950/20">
      <div className="flex items-center gap-2.5 border-b border-amber-500/20 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </div>
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          {isPastDue ? "Payment failed" : "Subscription unpaid"}
        </span>
      </div>

      <div className="px-5 py-5">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          {isPastDue
            ? "Your last payment could not be processed. Update your payment method to avoid losing access to your plan."
            : "Multiple payment attempts have failed. Update your payment method immediately to restore full access."}
        </p>
        <p className="mt-2 text-xs text-amber-700/70 dark:text-amber-400/70">
          You can update your card, view failed invoices, and retry payment
          through the Stripe billing portal.
        </p>
        <Button
          type="button"
          className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
          loading={isPortalPending}
          disabled={isPortalPending}
          onClick={onOpenPortal}
        >
          <ExternalLink className="h-4 w-4" />
          Fix payment now
        </Button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Downgrade section
// ---------------------------------------------------------------------------

function DowngradeSection({ currentPlan }: { currentPlan: Plan }) {
  if (currentPlan === "starter") return null;

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          Downgrade plan
        </span>
      </div>

      <div className="flex items-start gap-3 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            We&apos;re working on it
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Self-service plan downgrades aren&apos;t available yet. If you need
            to downgrade, please contact us and we&apos;ll take care of it
            manually before your next billing cycle.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            In the meantime, you can cancel your subscription at any time via
            the Stripe billing portal — it will remain active until the end of
            your current period.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillingSettingsPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: sub, isPending } = useQuery(
    trpc.settings.getBilling.queryOptions(),
  );

  const openPortal = useMutation(
    trpc.settings.createBillingPortalSession.mutationOptions({
      onSuccess: ({ url }) => {
        window.location.href = url;
      },
      onError: (e) =>
        toast.error("Couldn't open billing portal", { description: e.message }),
    }),
  );

  const upgrade = useMutation(
    trpc.settings.createUpgradeSession.mutationOptions({
      onSuccess: (data) => {
        if (data.type === "redirect") {
          window.location.href = data.url;
          return;
        }
        // type === "updated" (subscription updated in place)
        toast.success("Plan upgraded successfully!");
        queryClient.invalidateQueries(trpc.settings.getBilling.queryOptions());
        router.refresh();
      },
      onError: (e) =>
        toast.error("Couldn't upgrade plan", { description: e.message }),
    }),
  );

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const plan = (sub?.plan ?? "starter") as Plan;
  const status = sub?.status ?? "active";
  const billingInterval = sub?.billingInterval ?? "monthly";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const StatusIcon = statusCfg.icon;
  const hasStripe = !!sub?.stripeCustomerId;
  const priceLabel = `${formatWorkspacePlanPrice(plan, billingInterval)}${
    billingInterval === "monthly" ? "/mo" : "/yr"
  }`;

  return (
    <SettingsPage
      title="Billing & Plan"
      description="Manage your subscription, view usage, and upgrade your plan."
    >
      {/* ── Current plan ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Current plan
            </span>
          </div>
          <Badge
            className={cn("text-xs", statusCfg.className)}
            variant={statusCfg.variant}
          >
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusCfg.label}
          </Badge>
        </div>

        <div className="divide-y divide-border px-5">
          <InfoRow label="Plan" value={PLAN_LABELS[plan] ?? plan} />
          <InfoRow label="Price" value={priceLabel} />
          {sub?.status === "trialing" ? (
            <InfoRow
              label="Trial"
              value={`${PLAN_TRIAL_DAYS}-day free trial`}
            />
          ) : null}
          {sub?.currentPeriodStart || sub?.currentPeriodEnd ? (
            <>
              <InfoRow
                label="Billing period start"
                value={formatDate(sub?.currentPeriodStart)}
              />
              <InfoRow
                label="Billing period end"
                value={formatDate(sub?.currentPeriodEnd)}
              />
              {sub?.cancelAtPeriodEnd ? (
                <InfoRow
                  label="Cancels on"
                  value={
                    <span className="text-amber-600">
                      {formatDate(sub?.currentPeriodEnd)}
                    </span>
                  }
                />
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      {/* ── Plan limits ──────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <SectionHeader>Plan limits</SectionHeader>
        <div className="divide-y divide-border px-5">
          {plan === "starter" && (
            <>
              <InfoRow
                label="Invoices / Estimates / Customers / Items"
                value="Up to 50 each"
              />
              <InfoRow label="Users" value="Up to 2" />
              <InfoRow label="File attachments" value="Not included" />
            </>
          )}
          {plan === "growth" && (
            <>
              <InfoRow
                label="Invoices / Estimates / Customers / Items"
                value="Unlimited"
              />
              <InfoRow label="Users" value="Up to 5" />
              <InfoRow label="Attachment storage" value="1 GB" />
            </>
          )}
          {plan === "scale" && (
            <>
              <InfoRow
                label="Invoices / Estimates / Customers / Items"
                value="Unlimited"
              />
              <InfoRow label="Users" value="Up to 10" />
              <InfoRow label="Attachment storage" value="10 GB" />
            </>
          )}
        </div>
      </section>

      {/* ── File attachment storage usage ────────────────────────────── */}
      <StorageUsageSection plan={plan} />

      {/* ── Payment failure ──────────────────────────────────────────── */}
      <PaymentFailureSection
        status={status}
        onOpenPortal={() =>
          openPortal.mutate({ returnUrl: window.location.href })
        }
        isPortalPending={openPortal.isPending}
      />

      {/* ── Upgrade ──────────────────────────────────────────────────── */}
      <UpgradeSection
        currentPlan={plan}
        isUpgradePending={upgrade.isPending}
        onUpgrade={(targetPlan, billingInterval) =>
          upgrade.mutate({
            targetPlan,
            billingInterval,
            returnUrl:
              typeof window !== "undefined"
                ? window.location.href
                : "/app/settings/billing",
          })
        }
      />

      {/* ── Downgrade ────────────────────────────────────────────────── */}
      <DowngradeSection currentPlan={plan} />

      {/* ── Stripe billing portal ────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-foreground">
          Billing portal
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Update your payment method, download past invoices, or cancel your
          subscription at any time.
        </p>
        <Button
          type="button"
          variant="outline"
          loading={openPortal.isPending}
          disabled={openPortal.isPending || !hasStripe}
          onClick={() => openPortal.mutate({ returnUrl: window.location.href })}
        >
          <ExternalLink className="h-4 w-4" />
          Open billing portal
        </Button>
        {!hasStripe ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Not available — no active subscription found.
          </p>
        ) : null}
      </section>
    </SettingsPage>
  );
}

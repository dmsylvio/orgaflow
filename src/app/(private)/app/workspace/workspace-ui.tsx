import { Check, Layers, Star, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ANNUAL_DISCOUNT_PERCENT,
  formatWorkspacePlanPrice,
  isWorkspaceAccessible,
} from "@/lib/subscription-plans";
import { cn } from "@/lib/utils";
import type {
  WorkspaceBillingInterval,
  WorkspacePlan,
} from "@/schemas/workspace";

interface WorkspacePlanOption {
  id: WorkspacePlan;
  title: string;
  badge?: string;
  badgeVariant?: "default" | "soft" | "secondary";
  icon: React.ReactNode;
  iconColor: string;
  priceMonthly: string;
  priceAnnual: string;
  summary: string;
  limits: readonly string[];
  highlights: readonly string[];
  restrictions?: readonly string[];
}

const WORKSPACE_PLAN_OPTIONS: readonly WorkspacePlanOption[] = [
  {
    id: "starter",
    title: "Starter",
    badge: "Free",
    badgeVariant: "soft",
    icon: <Layers className="h-5 w-5" />,
    iconColor: "bg-slate-500/10 text-slate-600",
    priceMonthly: "Free",
    priceAnnual: "Free",
    summary:
      "For solo operators and lean teams that want the full billing flow with lower limits and the core CRM, estimate, and invoice toolkit.",
    limits: [
      "Up to 200 invoices and 200 estimates",
      "Up to 50 customers and 50 items",
      "Up to 2 users",
      "File attachments not included",
    ],
    highlights: [
      "Dashboard, customers, items, estimates, invoices",
      "Manual payment recording and PDF export",
    ],
    restrictions: [
      "No online Stripe payments, tasks, or automations",
      "No custom branding on exports",
    ],
  },
  {
    id: "growth",
    title: "Growth",
    icon: <Star className="h-5 w-5" />,
    iconColor: "bg-violet-500/10 text-violet-600",
    priceMonthly: formatWorkspacePlanPrice("growth", "monthly"),
    priceAnnual: formatWorkspacePlanPrice("growth", "annual"),
    summary:
      "For growing teams that need unlimited operational volume, branding, attachments, and smoother collaboration.",
    limits: [
      "Unlimited invoices, estimates, customers, and items",
      "Up to 5 users",
      "1 GB attachment storage",
    ],
    highlights: [
      "Everything in Starter plus attachments and activity timeline",
      "Public invoice links, estimate approval, custom branding",
    ],
    restrictions: ["Online Stripe payments are not included on Growth"],
  },
  {
    id: "scale",
    title: "Scale",
    badge: "Best value",
    badgeVariant: "soft",
    icon: <Zap className="h-5 w-5" />,
    iconColor: "bg-amber-500/10 text-amber-600",
    priceMonthly: formatWorkspacePlanPrice("scale", "monthly"),
    priceAnnual: formatWorkspacePlanPrice("scale", "annual"),
    summary:
      "Daily operations with online card payments, automations, tasks, advanced reporting, and higher user capacity.",
    limits: [
      "Unlimited invoices, estimates, customers, and items",
      "Up to 10 users",
      "10 GB attachment storage",
    ],
    highlights: [
      "Everything in Growth plus Stripe payments and workflow automations",
      "Automatic task creation, advanced reports, priority support",
    ],
  },
];

export function WorkspaceHero({ hasWorkspaces }: { hasWorkspaces: boolean }) {
  return (
    <header className="mb-8 text-center">
      <h1 className="app-page-title">
        {hasWorkspaces ? "Choose a workspace" : "Welcome to Orgaflow"}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {hasWorkspaces
          ? "Pick the organization you want to work in. Everything in the app is scoped to the active workspace."
          : "Create a workspace for your business to start sending estimates and invoices."}
      </p>
    </header>
  );
}

export function formatSubscriptionStatusLabel(status: string): string | null {
  if (status === "active") return null;
  const labels: Record<string, string> = {
    incomplete: "Activation pending",
    incomplete_expired: "Trial expired",
    trialing: "Trialing",
    past_due: "Past due",
    canceled: "Canceled",
    unpaid: "Unpaid",
    paused: "Paused",
  };
  return labels[status] ?? `Subscription: ${status}`;
}

export interface OrgMemberRow {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
  plan: WorkspacePlan;
  subscriptionStatus: string;
}

const PLAN_ICON_COLORS: Record<WorkspacePlan, string> = {
  starter: "bg-slate-500/10 text-slate-600",
  growth: "bg-violet-500/10 text-violet-600",
  scale: "bg-amber-500/10 text-amber-600",
};

interface OrgCardScrollProps {
  organizations: OrgMemberRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAccessOrganization: (organizationId: string) => void;
  onResumeBilling: (organizationId: string) => void;
  isAccessPending: boolean;
  isResumePending: boolean;
}

export function OrgCardScroll({
  organizations,
  selectedId,
  onSelect,
  onAccessOrganization,
  onResumeBilling,
  isAccessPending,
  isResumePending,
}: OrgCardScrollProps) {
  return (
    <section
      aria-labelledby="workspace-org-list-title"
      className="app-card mb-4 overflow-hidden"
    >
      <h2 id="workspace-org-list-title" className="sr-only">
        Organizations
      </h2>
      <ul className="divide-y divide-border">
        {organizations.map((org) => {
          const selected = selectedId === org.id;
          const canOpenWorkspace = isWorkspaceAccessible(
            org.subscriptionStatus,
          );
          const statusLabel = formatSubscriptionStatusLabel(
            org.subscriptionStatus,
          );
          const pending =
            selected && (canOpenWorkspace ? isAccessPending : isResumePending);

          return (
            <li key={org.id}>
              <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                    PLAN_ICON_COLORS[org.plan],
                  )}
                >
                  {org.name.trim()[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {org.name}
                    </span>
                    <Badge variant="secondary" className="shrink-0 text-[11px]">
                      {planLabel(org.plan)}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {statusLabel ? (
                      <span className="font-medium text-amber-600">
                        {statusLabel}
                      </span>
                    ) : (
                      org.slug
                    )}
                  </p>
                </div>
                {canOpenWorkspace ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    aria-label={`Open ${org.name}`}
                    onClick={() => {
                      onSelect(org.id);
                      onAccessOrganization(org.id);
                    }}
                    loading={pending}
                    disabled={isAccessPending}
                  >
                    Open
                  </Button>
                ) : org.isOwner ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onSelect(org.id);
                      onResumeBilling(org.id);
                    }}
                    loading={pending}
                    disabled={isResumePending}
                  >
                    Complete billing
                  </Button>
                ) : (
                  <span className="max-w-[9rem] text-right text-xs text-muted-foreground">
                    Waiting on the owner to finish billing
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface PlanScrollProps {
  billingInterval: WorkspaceBillingInterval;
  onBillingIntervalChange: (interval: WorkspaceBillingInterval) => void;
  selectedPlan: WorkspacePlan | null;
  onSelectPlan: (p: WorkspacePlan) => void;
  onCreateOrganization: () => void;
  isCreatePending: boolean;
}

export function PlanScroll({
  billingInterval,
  onBillingIntervalChange,
  selectedPlan,
  onSelectPlan,
  onCreateOrganization,
  isCreatePending,
}: PlanScrollProps) {
  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <p
          id="workspace-billing-cycle-heading"
          className="text-sm font-medium text-foreground"
        >
          Billing cycle
        </p>
        <fieldset
          className="m-0 inline-flex rounded-lg border border-border bg-card p-1"
          aria-labelledby="workspace-billing-cycle-heading"
        >
          {(["monthly", "annual"] as WorkspaceBillingInterval[]).map(
            (interval) => (
              <button
                key={interval}
                type="button"
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  billingInterval === interval
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => onBillingIntervalChange(interval)}
              >
                {interval === "monthly" ? "Monthly" : "Annual"}
                {interval === "annual" && (
                  <span
                    className={cn(
                      "ml-1.5 text-xs font-semibold",
                      billingInterval === interval
                        ? "text-primary-foreground/80"
                        : "text-emerald-600",
                    )}
                  >
                    Save {ANNUAL_DISCOUNT_PERCENT}%
                  </span>
                )}
              </button>
            ),
          )}
        </fieldset>
      </div>

      {/* Plan cards — responsive grid on desktop, scroll on mobile */}
      <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] lg:overflow-visible">
        <div className="flex w-max flex-nowrap gap-4 lg:grid lg:w-auto lg:grid-cols-3">
          {WORKSPACE_PLAN_OPTIONS.map((opt) => (
            <PlanOptionCard
              key={opt.id}
              option={opt}
              billingInterval={billingInterval}
              selected={selectedPlan === opt.id}
              onSelect={() => onSelectPlan(opt.id)}
              onCreateOrganization={onCreateOrganization}
              isCreatePending={isCreatePending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PlanOptionCardProps {
  option: WorkspacePlanOption;
  billingInterval: WorkspaceBillingInterval;
  selected: boolean;
  onSelect: () => void;
  onCreateOrganization: () => void;
  isCreatePending: boolean;
}

function planPriceDisplay(
  option: WorkspacePlanOption,
  interval: WorkspaceBillingInterval,
): string {
  return interval === "monthly" ? option.priceMonthly : option.priceAnnual;
}

function PlanOptionCard({
  option,
  billingInterval,
  selected,
  onSelect,
  onCreateOrganization,
  isCreatePending,
}: PlanOptionCardProps) {
  const buttonReset: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    padding: "1.5rem",
    paddingBottom: selected ? "0.75rem" : "1.5rem",
    boxSizing: "border-box",
    cursor: "pointer",
    textAlign: "left",
    flex: "1 1 auto",
    border: "none",
    background: "transparent",
  };

  const price = planPriceDisplay(option, billingInterval);
  const suffix =
    option.id === "starter"
      ? ""
      : billingInterval === "monthly"
        ? "/mo"
        : "/yr";

  return (
    <div
      className={cn(
        "box-border w-[min(320px,88vw)] shrink-0 rounded-xl border bg-card shadow-sm transition-colors lg:w-auto",
        selected
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${option.title} plan${selected ? ", selected" : ""}. Select this plan.`}
          style={buttonReset}
        >
          {/* Header */}
          <div className="mb-4 flex w-full items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  selected
                    ? option.iconColor
                    : "bg-muted text-muted-foreground",
                )}
              >
                {option.icon}
              </span>
              <span className="text-base font-bold text-foreground">
                {option.title}
              </span>
            </div>
            {option.badge ? (
              <Badge
                variant={option.badgeVariant ?? "default"}
                className="shrink-0"
              >
                {option.badge}
              </Badge>
            ) : null}
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {price}
              </span>
              <span className="text-sm text-muted-foreground">{suffix}</span>
            </div>
          </div>

          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
            {option.summary}
          </p>

          <Separator className="mb-5" />

          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Limits
          </p>
          <ul className="mb-5 space-y-2">
            {option.limits.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {line}
              </li>
            ))}
          </ul>

          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Included
          </p>
          <ul className="mb-2 space-y-2">
            {option.highlights.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {line}
              </li>
            ))}
          </ul>

          {option.restrictions?.length ? (
            <ul className="mt-3 space-y-1">
              {option.restrictions.map((line) => (
                <li key={line} className="text-xs text-muted-foreground/70">
                  — {line}
                </li>
              ))}
            </ul>
          ) : null}
        </button>

        {selected ? (
          <div className="px-6 pb-6 pt-0">
            <Button
              type="button"
              className="w-full"
              onClick={onCreateOrganization}
              loading={isCreatePending}
              disabled={isCreatePending}
            >
              {option.id === "starter"
                ? "Create free workspace"
                : "Start trial"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function planLabel(plan: WorkspacePlan): string {
  if (plan === "starter") return "Starter";
  if (plan === "growth") return "Growth";
  return "Scale";
}

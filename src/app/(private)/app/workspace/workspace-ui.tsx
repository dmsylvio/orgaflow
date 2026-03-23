import { Check, Layers, Star, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    badgeVariant: "secondary",
    icon: <Layers className="h-5 w-5" />,
    iconColor: "bg-slate-500/10 text-slate-600",
    priceMonthly: "$0",
    priceAnnual: "$0",
    summary:
      "Try Orgaflow and run a small operation: core CRM, estimates, invoices, manual payments, PDFs, and basic reporting.",
    limits: [
      "Up to 50 invoices, estimates, customers, and items",
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
    priceMonthly: "$19.99",
    priceAnnual: "$214.99",
    summary:
      "For freelancers and small businesses that outgrow Starter limits and need attachments, public links, approvals, and branding.",
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
    priceMonthly: "$24.99",
    priceAnnual: "$239.99",
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

export function WorkspaceHero() {
  return (
    <header className="mb-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Workspaces
      </h1>
      <p className="max-w-xl text-base text-muted-foreground">
        Choose which organization you want to work in, or create a new one.
        Everything in the app is scoped to the active workspace.
      </p>
    </header>
  );
}

export function formatSubscriptionStatusLabel(
  status: string,
  plan: WorkspacePlan,
): string | null {
  if (plan === "starter") return null;
  if (status === "active") return null;
  const labels: Record<string, string> = {
    incomplete: "Activation pending",
    incomplete_expired: "Checkout expired",
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
  isAccessPending: boolean;
}

export function OrgCardScroll({
  organizations,
  selectedId,
  onSelect,
  onAccessOrganization,
  isAccessPending,
}: OrgCardScrollProps) {
  return (
    <fieldset
      className="mb-6 min-w-0 border-0 p-0"
      aria-labelledby="workspace-org-list-title"
    >
      <legend id="workspace-org-list-title" className="sr-only">
        Organizations
      </legend>
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => {
          const selected = selectedId === org.id;
          const statusLabel = formatSubscriptionStatusLabel(
            org.subscriptionStatus,
            org.plan,
          );
          const iconColor = PLAN_ICON_COLORS[org.plan];
          return (
            <Card
              key={org.id}
              className={cn(
                "cursor-pointer transition-all duration-200",
                selected
                  ? "border-primary shadow-md ring-2 ring-primary/20"
                  : "hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <CardContent className="p-5">
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${org.name}, ${planLabel(org.plan)} plan${statusLabel ? `, ${statusLabel}` : ""}. ${selected ? "Selected." : "Select this organization."}`}
                  className="flex w-full flex-col gap-3 border-0 bg-transparent p-0 text-left"
                  onClick={() => onSelect(org.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          iconColor,
                        )}
                      >
                        <Layers className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {org.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {planLabel(org.plan)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {org.slug}
                  </span>
                  {statusLabel ? (
                    <span className="text-xs font-medium text-amber-600">
                      {statusLabel}
                    </span>
                  ) : null}
                </button>
                {selected ? (
                  <>
                    <Separator className="my-3" />
                    <Button
                      type="button"
                      className="w-full"
                      size="sm"
                      onClick={() => onAccessOrganization(org.id)}
                      loading={isAccessPending}
                      disabled={isAccessPending}
                    >
                      Open workspace
                    </Button>
                  </>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </fieldset>
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
          className="m-0 inline-flex rounded-xl border-0 bg-muted p-1"
          aria-labelledby="workspace-billing-cycle-heading"
        >
          {(["monthly", "annual"] as WorkspaceBillingInterval[]).map(
            (interval) => (
              <button
                key={interval}
                type="button"
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-medium transition-all",
                  billingInterval === interval
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => onBillingIntervalChange(interval)}
              >
                {interval === "monthly" ? "Monthly" : "Annual"}
                {interval === "annual" && (
                  <span className="ml-1.5 text-xs font-semibold text-primary">
                    Save 10%
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
      ? "forever"
      : billingInterval === "monthly"
        ? "/mo"
        : "/yr";

  return (
    <div
      className={cn(
        "box-border w-[min(320px,88vw)] shrink-0 rounded-xl border bg-card transition-all duration-200 lg:w-auto",
        selected
          ? "border-primary shadow-md ring-2 ring-primary/20"
          : "border-border hover:border-primary/30 hover:shadow-sm",
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
                  "flex h-9 w-9 items-center justify-center rounded-xl",
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

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Limits
          </p>
          <ul className="mb-5 space-y-2">
            {option.limits.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {line}
              </li>
            ))}
          </ul>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Included
          </p>
          <ul className="mb-2 space-y-2">
            {option.highlights.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
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
              Create organization
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

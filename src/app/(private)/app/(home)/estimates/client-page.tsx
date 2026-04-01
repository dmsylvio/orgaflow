"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useCanViewPrices } from "@/hooks/use-can-view-prices";
import { EstimateActionsDropdown } from "./estimate-actions-dropdown";
import {
  type EstimateStatus,
  EstimateStatusBadge,
  formatEstimateDate,
  PageShell,
} from "./estimate-ui";

type EstimateRecord = {
  id: string;
  estimateNumber: string;
  status: EstimateStatus;
  estimateDate: string;
  expiryDate: string | null;
  notes: string | null;
  subTotal: string | null;
  total: string | null;
  tax: string | null;
  createdAt: Date;
  customer: {
    id: string;
    displayName: string;
    email: string | null;
  };
  currency: NonNullable<CurrencyFormat>;
  itemCount: number;
};

type EstimateFilter = "ALL" | "DRAFT" | "SENT";

function EstimateRow({
  estimate,
  canViewPrices,
  isDeleting,
  isConverting,
  isUpdatingStatus,
  onConvertToInvoice,
  onSetStatus,
  onDelete,
}: {
  estimate: EstimateRecord;
  canViewPrices: boolean;
  isDeleting: boolean;
  isConverting: boolean;
  isUpdatingStatus: boolean;
  onConvertToInvoice: () => void;
  onSetStatus: (status: EstimateStatus, successMessage: string) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-2 align-top">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {estimate.estimateNumber}
          </p>
          {estimate.notes ? (
            <p className="line-clamp-1 max-w-[24ch] text-xs text-muted-foreground">
              {estimate.notes}
            </p>
          ) : null}
        </div>
      </td>
      <td className="px-2 py-3 align-top">
        <EstimateStatusBadge status={estimate.status} />
      </td>
      <td className="px-2 py-3 align-top">
        <div className="space-y-1">
          <p className="text-sm text-foreground">
            {estimate.customer.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {estimate.itemCount} item{estimate.itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </td>
      <td className="px-2 py-3 align-top text-sm text-foreground">
        {formatEstimateDate(estimate.estimateDate) ?? "Not set"}
      </td>
      <td className="px-2 py-3 align-top text-sm text-foreground">
        {formatEstimateDate(estimate.expiryDate) ?? "No expiry"}
      </td>
      {canViewPrices ? (
        <td className="px-2 py-3 align-top text-sm font-medium text-foreground">
          {formatCurrencyDisplay(estimate.total, estimate.currency)}
        </td>
      ) : null}
      <td className="py-3 pl-2 pr-4 align-top">
        <div className="flex justify-end">
          <EstimateActionsDropdown
            estimateId={estimate.id}
            estimateNumber={estimate.estimateNumber}
            customerEmail={estimate.customer.email}
            isDeleting={isDeleting}
            isConverting={isConverting}
            isUpdatingStatus={isUpdatingStatus}
            onConvertToInvoice={onConvertToInvoice}
            onSetStatus={onSetStatus}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}

export default function EstimatesPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<EstimateFilter>("ALL");
  const { estimate: canViewPrices } = useCanViewPrices();

  const { data: estimates = [], isPending: estimatesPending } = useQuery(
    trpc.estimates.list.queryOptions(),
  );
  const { data: usage, isPending: usagePending } = useQuery(
    trpc.estimates.getUsage.queryOptions(),
  );
  const { data: meta = null, isPending: metaPending } = useQuery(
    trpc.estimates.getFormMeta.queryOptions(),
  );

  const deleteEstimate = useMutation(
    trpc.estimates.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.estimates.list.queryOptions());
        queryClient.invalidateQueries(trpc.estimates.getUsage.queryOptions());
        queryClient.invalidateQueries(
          trpc.estimates.getFormMeta.queryOptions(),
        );
        toast.success("Estimate deleted.");
      },
      onError: (error) =>
        toast.error("Couldn't delete estimate.", {
          description: error.message,
        }),
    }),
  );

  const setEstimateStatus = useMutation(
    trpc.estimates.setStatus.mutationOptions({
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries(trpc.estimates.list.queryOptions());
        queryClient.invalidateQueries(
          trpc.estimates.getById.queryOptions({ id: variables.id }),
        );
      },
      onError: (error) =>
        toast.error("Couldn't update estimate.", {
          description: error.message,
        }),
    }),
  );

  const convertToInvoice = useMutation(
    trpc.invoices.createFromEstimate.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(trpc.invoices.list.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getUsage.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getFormMeta.queryOptions());
        queryClient.invalidateQueries(
          trpc.invoices.getById.queryOptions({ id: created.id }),
        );

        toast.success("Invoice created.", {
          description: `${created.invoiceNumber} created from estimate.`,
        });

        router.push(`/app/invoices/${created.id}`);
      },
      onError: (error) =>
        toast.error("Couldn't convert estimate to invoice.", {
          description: error.message,
        }),
    }),
  );

  if (estimatesPending || usagePending || metaPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const totalEstimateValue = canViewPrices
    ? estimates.reduce((sum, estimate) => sum + Number(estimate.total ?? 0), 0)
    : null;
  const draftCount = estimates.filter(
    (estimate) => estimate.status === "DRAFT",
  ).length;
  const sentCount = estimates.filter(
    (estimate) => estimate.status === "SENT",
  ).length;
  const canCreate = usage?.canCreate ?? true;
  const hasDependencies = Boolean(meta?.defaultCurrency);
  const filteredEstimates = (() => {
    if (activeFilter === "DRAFT") {
      return estimates.filter((estimate) => estimate.status === "DRAFT");
    }

    if (activeFilter === "SENT") {
      return estimates.filter((estimate) => estimate.status === "SENT");
    }

    return estimates;
  })();
  const filterTabs: Array<{
    value: EstimateFilter;
    label: string;
    count: number;
  }> = [
    { value: "ALL", label: "All", count: estimates.length },
    { value: "DRAFT", label: "Draft", count: draftCount },
    { value: "SENT", label: "Sent", count: sentCount },
  ];

  return (
    <PageShell
      title="Estimates"
      description="Create and track client-facing estimates using your customer and item catalogs."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Total estimates
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {usage?.total ?? estimates.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Draft
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {draftCount}
              </p>
            </div>
            {canViewPrices ? (
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Pipeline value
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {formatCurrencyDisplay(
                    (totalEstimateValue ?? 0).toFixed(3),
                    meta?.defaultCurrency ?? null,
                  )}
                </p>
              </div>
            ) : null}
          </div>

          {canCreate && hasDependencies ? (
            <Button type="button" asChild>
              <NextLink href="/app/estimates/create">
                <Plus className="h-4 w-4" />
                New Estimate
              </NextLink>
            </Button>
          ) : (
            <Button type="button" disabled>
              <Plus className="h-4 w-4" />
              New Estimate
            </Button>
          )}
        </div>

        {!canCreate ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            You reached the estimate limit for your current plan.
            {usage?.limit
              ? ` Starter allows up to ${usage.limit} estimates.`
              : null}
          </div>
        ) : null}

        {!meta?.defaultCurrency ? (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Set a default currency in Settings before creating estimates.
          </div>
        ) : null}

        {estimates.length > 0 ? (
          <div
            role="tablist"
            aria-label="Estimate status filters"
            className="flex w-full gap-2 overflow-x-auto rounded-2xl border border-border bg-muted/20 p-2"
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeFilter === tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={cn(
                  "inline-flex min-w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  activeFilter === tab.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {estimates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No estimates yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first estimate to start sharing pricing with clients.
            </p>
          </div>
        ) : filteredEstimates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No {activeFilter.toLowerCase()} estimates
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another filter or create a new estimate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Estimate
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Customer
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Estimate date
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Expiry
                  </th>
                  {canViewPrices ? (
                    <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                      Total
                    </th>
                  ) : null}
                  <th className="py-3 pl-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEstimates.map((estimate) => (
                  <EstimateRow
                    key={estimate.id}
                    estimate={estimate}
                    canViewPrices={canViewPrices}
                    isDeleting={
                      deleteEstimate.isPending &&
                      deleteEstimate.variables?.id === estimate.id
                    }
                    isConverting={
                      convertToInvoice.isPending &&
                      convertToInvoice.variables?.estimateId === estimate.id
                    }
                    isUpdatingStatus={
                      setEstimateStatus.isPending &&
                      setEstimateStatus.variables?.id === estimate.id
                    }
                    onConvertToInvoice={() =>
                      convertToInvoice.mutate({ estimateId: estimate.id })
                    }
                    onSetStatus={(status, successMessage) =>
                      setEstimateStatus.mutate(
                        { id: estimate.id, status },
                        {
                          onSuccess: () => toast.success(successMessage),
                        },
                      )
                    }
                    onDelete={() => deleteEstimate.mutate({ id: estimate.id })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}

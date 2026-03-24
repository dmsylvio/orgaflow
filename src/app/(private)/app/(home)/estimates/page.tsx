"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";
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
  subTotal: string;
  total: string;
  tax: string;
  createdAt: Date;
  customer: {
    id: string;
    displayName: string;
  };
  currency: NonNullable<CurrencyFormat>;
  itemCount: number;
};

function EstimateCard({
  estimate,
  deletePendingId,
  onDelete,
}: {
  estimate: EstimateRecord;
  deletePendingId: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {estimate.estimateNumber}
            </p>
            <EstimateStatusBadge status={estimate.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {estimate.customer.displayName}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold text-foreground">
            {formatCurrencyDisplay(estimate.total, estimate.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {estimate.itemCount} item{estimate.itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Estimate date
          </p>
          <p className="mt-1 text-foreground">
            {formatEstimateDate(estimate.estimateDate) ?? "Not set"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Expiry
          </p>
          <p className="mt-1 text-foreground">
            {formatEstimateDate(estimate.expiryDate) ?? "No expiry"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Subtotal
          </p>
          <p className="mt-1 text-foreground">
            {formatCurrencyDisplay(estimate.subTotal, estimate.currency)}
          </p>
        </div>
      </div>

      {estimate.notes ? (
        <div className="mt-4 rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {estimate.notes}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <NextLink href={`/app/estimates/${estimate.id}`}>
            <FileText className="h-4 w-4" />
            View
          </NextLink>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <NextLink href={`/app/estimates/edit?id=${estimate.id}`}>
            <Pencil className="h-4 w-4" />
            Edit
          </NextLink>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={deletePendingId === estimate.id}
          onClick={() => onDelete(estimate.id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function EstimatesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

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

  if (estimatesPending || usagePending || metaPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const totalEstimateValue = estimates.reduce(
    (sum, estimate) => sum + Number(estimate.total),
    0,
  );
  const draftCount = estimates.filter(
    (estimate) => estimate.status === "DRAFT",
  ).length;
  const canCreate = usage?.canCreate ?? true;
  const hasDependencies =
    (meta?.customers.length ?? 0) > 0 &&
    (meta?.items.length ?? 0) > 0 &&
    Boolean(meta?.defaultCurrency);

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
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Pipeline value
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatCurrencyDisplay(
                  totalEstimateValue.toFixed(3),
                  meta?.defaultCurrency ?? null,
                )}
              </p>
            </div>
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

        {(meta?.customers.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Add at least one customer before creating an estimate.
          </div>
        ) : null}

        {(meta?.items.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Add at least one item in your catalog before creating an estimate.
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
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {estimates.map((estimate) => (
              <EstimateCard
                key={estimate.id}
                estimate={estimate}
                deletePendingId={
                  deleteEstimate.isPending
                    ? (deleteEstimate.variables?.id ?? null)
                    : null
                }
                onDelete={(id) => deleteEstimate.mutate({ id })}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

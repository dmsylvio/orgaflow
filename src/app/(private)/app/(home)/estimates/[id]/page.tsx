"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { useTRPC } from "@/trpc/client";
import {
  EstimateStatusBadge,
  formatEstimateDate,
  PageShell,
} from "../estimate-ui";

export default function EstimateDetailPage() {
  const trpc = useTRPC();
  const params = useParams<{ id: string }>();
  const estimateId = params.id;

  const { data: estimate, isPending } = useQuery({
    ...trpc.estimates.getById.queryOptions({ id: estimateId }),
    enabled: Boolean(estimateId),
  });

  if (isPending || !estimate) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <PageShell
      title={estimate.estimateNumber}
      description="Review estimate details, totals, notes, and line items."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <EstimateStatusBadge status={estimate.status} />
            <span className="text-sm text-muted-foreground">
              {estimate.customer.displayName}
            </span>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <NextLink href="/app/estimates">
                <ArrowLeft className="h-4 w-4" />
                Back
              </NextLink>
            </Button>
            <Button type="button" asChild>
              <NextLink href={`/app/estimates/edit?id=${estimate.id}`}>
                <Pencil className="h-4 w-4" />
                Edit
              </NextLink>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Estimate date
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatEstimateDate(estimate.estimateDate)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Expiry
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatEstimateDate(estimate.expiryDate) ?? "No expiry"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Subtotal
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatCurrencyDisplay(estimate.subTotal, estimate.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Total
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatCurrencyDisplay(estimate.total, estimate.currency)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Line items
            </h2>
            <p className="text-sm text-muted-foreground">
              {estimate.items.length} item
              {estimate.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {estimate.items.map((item) => (
              <div key={item.id} className="rounded-xl bg-muted/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrencyDisplay(item.total, estimate.currency)}
                  </p>
                </div>

                <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    Qty:{" "}
                    <span className="text-foreground">{item.quantity}</span>
                  </div>
                  <div>
                    Unit price:{" "}
                    <span className="text-foreground">
                      {formatCurrencyDisplay(item.price, estimate.currency)}
                    </span>
                  </div>
                  <div>
                    Unit:{" "}
                    <span className="text-foreground">
                      {item.unitName ?? "No unit"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {estimate.items.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              This estimate has no line items.
            </p>
          ) : null}

          <Separator className="my-5" />

          <div className="ml-auto max-w-sm space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrencyDisplay(estimate.subTotal, estimate.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Tax</span>
              <span className="font-medium text-foreground">
                {formatCurrencyDisplay(estimate.tax, estimate.currency)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrencyDisplay(estimate.total, estimate.currency)}
              </span>
            </div>
          </div>
        </div>

        {estimate.notes ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {estimate.notes}
            </p>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

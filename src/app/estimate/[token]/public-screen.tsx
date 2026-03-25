"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, FileText, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { useTRPC } from "@/trpc/client";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "No expiration";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function EstimatePublicScreen({ token }: { token: string }) {
  const trpc = useTRPC();

  const { data, isPending } = useQuery(
    trpc.estimates.getPublicByToken.queryOptions(token),
  );

  if (isPending || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4">
        <Spinner className="size-5 text-primary" label="Loading estimate" />
      </div>
    );
  }

  if (data.status === "invalid") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
        <Card className="w-full max-w-xl shadow-md">
          <CardHeader className="space-y-3">
            <Badge variant="soft" className="w-fit gap-1.5">
              <TriangleAlert className="h-3.5 w-3.5" />
              Invalid link
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Estimate link not found
              </CardTitle>
              <CardDescription>
                This estimate link is invalid or has been disabled. Ask the
                sender for a new link.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (data.status === "expired") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
        <Card className="w-full max-w-xl shadow-md">
          <CardHeader className="space-y-3">
            <Badge variant="destructive" className="w-fit gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Link expired
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                This estimate link has expired
              </CardTitle>
              <CardDescription>
                It expired on {formatDateTime(data.expiresAt)}. Ask the sender
                to resend the estimate.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { estimate, expiresAt } = data;

  return (
    <div className="min-h-dvh bg-muted/20 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="shadow-md">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="soft" className="w-fit gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Estimate
              </Badge>

              <div className="text-xs text-muted-foreground">
                {expiresAt ? (
                  <>Link expires {formatDateTime(expiresAt)}</>
                ) : (
                  <>No link expiration</>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {estimate.estimateNumber}
              </CardTitle>
              <CardDescription>{estimate.organization.name}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Estimate date
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(estimate.estimateDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Expiry
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(estimate.expiryDate)}
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
                          {item.unitName ?? "—"}
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
                    {formatCurrencyDisplay(
                      estimate.subTotal,
                      estimate.currency,
                    )}
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
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link
            className="text-primary underline"
            target="_blank"
            href="https://orgaflow.dev"
          >
            Orgaflow
          </Link>{" "}
          platform.
        </p>
      </div>
    </div>
  );
}

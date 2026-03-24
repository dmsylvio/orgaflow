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
  formatInvoiceDate,
  type InvoiceStatus,
  InvoiceStatusBadge,
  PageShell,
} from "./invoice-ui";

type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string | null;
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

function InvoiceCard({
  invoice,
  deletePendingId,
  onDelete,
}: {
  invoice: InvoiceRecord;
  deletePendingId: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {invoice.invoiceNumber}
            </p>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.customer.displayName}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold text-foreground">
            {formatCurrencyDisplay(invoice.total, invoice.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {invoice.itemCount} item{invoice.itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Invoice date
          </p>
          <p className="mt-1 text-foreground">
            {formatInvoiceDate(invoice.invoiceDate) ?? "Not set"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Due date
          </p>
          <p className="mt-1 text-foreground">
            {formatInvoiceDate(invoice.dueDate) ?? "No due date"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Subtotal
          </p>
          <p className="mt-1 text-foreground">
            {formatCurrencyDisplay(invoice.subTotal, invoice.currency)}
          </p>
        </div>
      </div>

      {invoice.notes ? (
        <div className="mt-4 rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {invoice.notes}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <NextLink href={`/app/invoices/${invoice.id}`}>
            <FileText className="h-4 w-4" />
            View
          </NextLink>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <NextLink href={`/app/invoices/edit?id=${invoice.id}`}>
            <Pencil className="h-4 w-4" />
            Edit
          </NextLink>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={deletePendingId === invoice.id}
          onClick={() => onDelete(invoice.id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: invoices = [], isPending: invoicesPending } = useQuery(
    trpc.invoices.list.queryOptions(),
  );
  const { data: usage, isPending: usagePending } = useQuery(
    trpc.invoices.getUsage.queryOptions(),
  );
  const { data: meta = null, isPending: metaPending } = useQuery(
    trpc.invoices.getFormMeta.queryOptions(),
  );

  const deleteInvoice = useMutation(
    trpc.invoices.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.invoices.list.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getUsage.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getFormMeta.queryOptions());
        toast.success("Invoice deleted.");
      },
      onError: (error) =>
        toast.error("Couldn't delete invoice.", {
          description: error.message,
        }),
    }),
  );

  if (invoicesPending || usagePending || metaPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const totalInvoiceValue = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0,
  );
  const draftCount = invoices.filter(
    (invoice) => invoice.status === "DRAFT",
  ).length;
  const canCreate = usage?.canCreate ?? true;
  const hasDependencies =
    (meta?.customers.length ?? 0) > 0 &&
    (meta?.items.length ?? 0) > 0 &&
    Boolean(meta?.defaultCurrency);

  return (
    <PageShell
      title="Invoices"
      description="Create and track invoices using your customer and item catalogs."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Total invoices
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {usage?.total ?? invoices.length}
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
                Billed value
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatCurrencyDisplay(
                  totalInvoiceValue.toFixed(3),
                  meta?.defaultCurrency ?? null,
                )}
              </p>
            </div>
          </div>

          {canCreate && hasDependencies ? (
            <Button type="button" asChild>
              <NextLink href="/app/invoices/create">
                <Plus className="h-4 w-4" />
                New Invoice
              </NextLink>
            </Button>
          ) : (
            <Button type="button" disabled>
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          )}
        </div>

        {!canCreate ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            You reached the invoice limit for your current plan.
            {usage?.limit
              ? ` Starter allows up to ${usage.limit} invoices.`
              : null}
          </div>
        ) : null}

        {!meta?.defaultCurrency ? (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Set a default currency in Settings before creating invoices.
          </div>
        ) : null}

        {(meta?.customers.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Add at least one customer before creating an invoice.
          </div>
        ) : null}

        {(meta?.items.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Add at least one item in your catalog before creating an invoice.
          </div>
        ) : null}

        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No invoices yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first invoice to start billing clients.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                deletePendingId={
                  deleteInvoice.isPending
                    ? (deleteInvoice.variables?.id ?? null)
                    : null
                }
                onDelete={(id) => deleteInvoice.mutate({ id })}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

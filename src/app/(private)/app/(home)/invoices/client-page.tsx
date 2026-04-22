"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TablePagination } from "@/components/ui/table-pagination";
import { useCanViewPrices } from "@/hooks/use-can-view-prices";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { richTextToPlainText } from "@/lib/rich-text";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { InvoiceActionsDropdown } from "./invoice-actions-dropdown";
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

type InvoiceFilter = "ALL" | "DRAFT" | "SENT" | "DUE";

const PAGE_SIZE = 20;

function InvoiceRow({
  invoice,
  canViewPrices,
  isDeleting,
  isCloning,
  isUpdatingStatus,
  onClone,
  onSetStatus,
  onDelete,
}: {
  invoice: InvoiceRecord;
  canViewPrices: boolean;
  isDeleting: boolean;
  isCloning: boolean;
  isUpdatingStatus: boolean;
  onClone: () => void;
  onSetStatus: (status: InvoiceStatus, successMessage: string) => void;
  onDelete: () => void;
}) {
  const notesPreview = richTextToPlainText(invoice.notes);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-2 align-top">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-foreground">
            {invoice.invoiceNumber}
          </p>
          {notesPreview ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {notesPreview}
            </p>
          ) : null}
        </div>
      </td>
      <td className="px-2 py-3 align-top">
        <InvoiceStatusBadge status={invoice.status} />
      </td>
      <td className="px-2 py-3 align-top">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-foreground">
            {invoice.customer.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {invoice.itemCount} item{invoice.itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </td>
      <td className="px-2 py-3 align-top text-sm whitespace-nowrap text-foreground">
        {formatInvoiceDate(invoice.invoiceDate) ?? "Not set"}
      </td>
      <td className="px-2 py-3 align-top text-sm whitespace-nowrap text-foreground">
        {formatInvoiceDate(invoice.dueDate) ?? "No due date"}
      </td>
      {canViewPrices ? (
        <td className="px-2 py-3 align-top text-sm font-medium whitespace-nowrap text-foreground">
          {formatCurrencyDisplay(invoice.total ?? "", invoice.currency)}
        </td>
      ) : null}
      <td className="py-3 pl-2 pr-4 align-top">
        <div className="flex justify-end">
          <InvoiceActionsDropdown
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            customerEmail={invoice.customer.email}
            isDeleting={isDeleting}
            isCloning={isCloning}
            isUpdatingStatus={isUpdatingStatus}
            onClone={onClone}
            onSetStatus={onSetStatus}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}

export default function InvoicesPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { invoice: canViewPrices } = useCanViewPrices();
  const [activeFilter, setActiveFilter] = useState<InvoiceFilter>("ALL");
  const [page, setPage] = useState(1);

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

  const setInvoiceStatus = useMutation(
    trpc.invoices.setStatus.mutationOptions({
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries(trpc.invoices.list.queryOptions());
        queryClient.invalidateQueries(
          trpc.invoices.getById.queryOptions({ id: variables.id }),
        );
      },
      onError: (error) =>
        toast.error("Couldn't update invoice.", {
          description: error.message,
        }),
    }),
  );

  const cloneInvoice = useMutation(
    trpc.invoices.clone.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(trpc.invoices.list.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getUsage.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getFormMeta.queryOptions());
        queryClient.invalidateQueries(
          trpc.invoices.getById.queryOptions({ id: created.id }),
        );

        toast.success("Invoice cloned.", {
          description: `${created.invoiceNumber} is ready in draft status.`,
        });

        router.push(`/app/invoices/${created.id}`);
      },
      onError: (error) =>
        toast.error("Couldn't clone invoice.", {
          description: error.message,
        }),
    }),
  );

  const totalInvoiceValue = canViewPrices
    ? invoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0)
    : null;
  const draftCount = invoices.filter(
    (invoice) => invoice.status === "DRAFT",
  ).length;
  const sentCount = invoices.filter(
    (invoice) => invoice.status === "SENT",
  ).length;
  const dueCount = invoices.filter((invoice) =>
    Boolean(invoice.dueDate),
  ).length;
  const canCreate = usage?.canCreate ?? true;
  const hasDependencies = Boolean(meta?.defaultCurrency);
  const filteredInvoices = (() => {
    if (activeFilter === "DRAFT") {
      return invoices.filter((invoice) => invoice.status === "DRAFT");
    }

    if (activeFilter === "SENT") {
      return invoices.filter((invoice) => invoice.status === "SENT");
    }

    if (activeFilter === "DUE") {
      return invoices.filter((invoice) => Boolean(invoice.dueDate));
    }

    return invoices;
  })();
  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const paginatedInvoices = filteredInvoices.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const filterTabs: Array<{
    value: InvoiceFilter;
    label: string;
    count: number;
  }> = [
    { value: "ALL", label: "All", count: invoices.length },
    { value: "DRAFT", label: "Draft", count: draftCount },
    { value: "SENT", label: "Sent", count: sentCount },
    { value: "DUE", label: "Due", count: dueCount },
  ];

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (invoicesPending || usagePending || metaPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

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
            {canViewPrices ? (
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Billed value
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {formatCurrencyDisplay(
                    (totalInvoiceValue ?? 0).toFixed(3),
                    meta?.defaultCurrency ?? null,
                  )}
                </p>
              </div>
            ) : null}
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

        {invoices.length > 0 ? (
          <div
            role="tablist"
            aria-label="Invoice status filters"
            className="flex w-full flex-wrap gap-2 rounded-2xl border border-border bg-muted/20 p-2"
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeFilter === tab.value}
                onClick={() => {
                  setActiveFilter(tab.value);
                  setPage(1);
                }}
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
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No {activeFilter.toLowerCase()} invoices
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another filter or create a new invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-[18%] py-3 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Invoice
                  </th>
                  <th className="w-[12%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Status
                  </th>
                  <th className="w-[22%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Customer
                  </th>
                  <th className="w-[14%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Invoice date
                  </th>
                  <th className="w-[14%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Due date
                  </th>
                  {canViewPrices ? (
                    <th className="w-[12%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                      Total
                    </th>
                  ) : null}
                  <th className="w-16 py-3 pl-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    canViewPrices={canViewPrices}
                    isDeleting={
                      deleteInvoice.isPending &&
                      deleteInvoice.variables?.id === invoice.id
                    }
                    isCloning={
                      cloneInvoice.isPending &&
                      cloneInvoice.variables?.id === invoice.id
                    }
                    isUpdatingStatus={
                      setInvoiceStatus.isPending &&
                      setInvoiceStatus.variables?.id === invoice.id
                    }
                    onClone={() => cloneInvoice.mutate({ id: invoice.id })}
                    onSetStatus={(status, successMessage) =>
                      setInvoiceStatus.mutate(
                        { id: invoice.id, status },
                        {
                          onSuccess: () => toast.success(successMessage),
                        },
                      )
                    }
                    onDelete={() => deleteInvoice.mutate({ id: invoice.id })}
                  />
                ))}
              </tbody>
            </table>
            <TablePagination
              totalCount={filteredInvoices.length}
              page={safePage}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="invoices"
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Layers,
  Paperclip,
  Pencil,
  Tag,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";
import { useCanViewPrices } from "@/hooks/use-can-view-prices";
import { EditExpenseDialog, formatBytes } from "../edit-dialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Info card
// ---------------------------------------------------------------------------

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground/70">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExpenseDetailPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const expenseId = params.id;
  const { expense: canViewPrices } = useCanViewPrices();

  const [editOpen, setEditOpen] = useState(false);

  const { data: expense, isPending } = useQuery({
    ...trpc.expenses.getById.queryOptions({ id: expenseId }),
    enabled: Boolean(expenseId),
  });

  const { data: categories = [] } = useQuery(
    trpc.expenses.listCategories.queryOptions(),
  );
  const { data: customers = [] } = useQuery(
    trpc.expenses.listCustomers.queryOptions(),
  );
  const { data: paymentModes = [] } = useQuery(
    trpc.expenses.listPaymentModes.queryOptions(),
  );
  const { data: orgCurrency = null } = useQuery(
    trpc.expenses.getDefaultCurrency.queryOptions(),
  );

  const deleteFile = useMutation(
    trpc.expenses.deleteFile.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.expenses.getById.queryOptions({ id: expenseId }),
        ),
      onError: (e) =>
        toast.error("Couldn't delete file", { description: e.message }),
    }),
  );

  if (isPending || !expense) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const currency = expense.currencyCode
    ? {
        id: expense.currencyCode,
        code: expense.currencyCode,
        symbol: expense.currencySymbol ?? "",
        precision: expense.currencyPrecision ?? 2,
        thousandSeparator: expense.currencyThousandSeparator ?? ",",
        decimalSeparator: expense.currencyDecimalSeparator ?? ".",
        swapCurrencySymbol: expense.currencySwapSymbol ?? false,
      }
    : orgCurrency;

  return (
    <div className="w-full p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Expense
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(expense.expenseDate)}
        </p>
      </div>

      <Separator className="mb-8" />

      <div className="space-y-6">
        {/* Amount + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {canViewPrices ? (
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {formatCurrencyDisplay(expense.amount, currency)}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <NextLink href="/app/expenses">
                <ArrowLeft className="h-4 w-4" />
                Back
              </NextLink>
            </Button>
            <Button type="button" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={Calendar}
            label="Date"
            value={formatDate(expense.expenseDate)}
          />
          <InfoCard
            icon={Tag}
            label="Category"
            value={expense.categoryName ?? "—"}
          />
          <InfoCard
            icon={User}
            label="Customer"
            value={expense.customerDisplayName ?? "—"}
          />
          <InfoCard
            icon={Wallet}
            label="Payment mode"
            value={expense.paymentModeName ?? "—"}
          />
        </div>

        {/* Notes */}
        {expense.notes ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Notes</h2>
            </div>
            <div
              className="prose prose-sm mt-3 max-w-none text-muted-foreground"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted internal content
              dangerouslySetInnerHTML={{ __html: expense.notes }}
            />
          </div>
        ) : null}

        {/* Receipts */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Receipts & Attachments
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {expense.files.length} file
              {expense.files.length !== 1 ? "s" : ""}
            </span>
          </div>

          {expense.files.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No files attached. Open Edit to upload receipts.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {expense.files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={file.storageKey}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-sm font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {file.fileName}
                  </a>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(file.fileSize)}
                  </span>
                  <button
                    type="button"
                    disabled={deleteFile.isPending}
                    onClick={() => deleteFile.mutate({ fileId: file.id })}
                    className="shrink-0 rounded p-1 text-muted-foreground/50 hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      {editOpen && (
        <EditExpenseDialog
          expense={{
            id: expense.id,
            amount: expense.amount,
            expenseDate: expense.expenseDate,
            notes: expense.notes,
            categoryId: expense.categoryId,
            customerId: expense.customerId,
            paymentModeId: expense.paymentModeId,
            currencyId: expense.currencyId,
            createdAt: expense.createdAt,
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() =>
            queryClient.invalidateQueries(
              trpc.expenses.getById.queryOptions({ id: expenseId }),
            )
          }
          orgCurrency={currency}
          categories={categories}
          customers={customers}
          paymentModes={paymentModes}
        />
      )}
    </div>
  );
}

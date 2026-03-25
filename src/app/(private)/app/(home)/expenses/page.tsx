"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Spinner } from "@/components/ui/spinner";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import {
  EditExpenseDialog,
  type ExpenseRecord,
  PendingReceiptField,
  uploadFile,
} from "./edit-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrgCurrency = CurrencyFormat;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Form fields (Create only — Edit lives in edit-dialog.tsx)
// ---------------------------------------------------------------------------

function CreateFormFields({
  amount,
  setAmount,
  expenseDate,
  setExpenseDate,
  notes,
  setNotes,
  categoryId,
  setCategoryId,
  customerId,
  setCustomerId,
  paymentModeId,
  setPaymentModeId,
  orgCurrency,
  categories,
  customers,
  paymentModes,
  pendingFiles,
  setPendingFiles,
}: {
  amount: string;
  setAmount: (v: string) => void;
  expenseDate: string;
  setExpenseDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  customerId: string;
  setCustomerId: (v: string) => void;
  paymentModeId: string;
  setPaymentModeId: (v: string) => void;
  orgCurrency: OrgCurrency | null;
  categories: { id: string; name: string }[];
  customers: { id: string; displayName: string }[];
  paymentModes: { id: string; name: string }[];
  pendingFiles: File[];
  setPendingFiles: (files: File[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="ef-category">Category</Label>
        <select
          id="ef-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ef-date">Date *</Label>
        <Input
          id="ef-date"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ef-amount">Amount *</Label>
        <CurrencyInput
          id="ef-amount"
          currency={orgCurrency}
          value={amount}
          onValueChange={setAmount}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ef-customer">
          Customer{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <select
          id="ef-customer"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— None —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ef-mode">Payment Mode</Label>
        <select
          id="ef-mode"
          value={paymentModeId}
          onChange={(e) => setPaymentModeId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— None —</option>
          {paymentModes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-3 space-y-1.5">
        <Label>
          Notes{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <RichTextEditor
          value={notes}
          onChange={setNotes}
          placeholder="Additional notes…"
          className="min-h-28"
        />
      </div>

      <div className="sm:col-span-3 space-y-1.5">
        <Label>
          Receipt{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <PendingReceiptField
          pendingFiles={pendingFiles}
          onChange={setPendingFiles}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateExpenseDialog({
  open,
  onOpenChange,
  onSuccess,
  orgCurrency,
  categories,
  customers,
  paymentModes,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  orgCurrency: OrgCurrency | null;
  categories: { id: string; name: string }[];
  customers: { id: string; displayName: string }[];
  paymentModes: { id: string; name: string }[];
}) {
  const trpc = useTRPC();
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentModeId, setPaymentModeId] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  function reset() {
    setAmount("");
    setExpenseDate(today());
    setNotes("");
    setCategoryId("");
    setCustomerId("");
    setPaymentModeId("");
    setPendingFiles([]);
  }

  const create = useMutation(
    trpc.expenses.create.mutationOptions({
      onSuccess: async (data) => {
        if (pendingFiles.length > 0) {
          setUploading(true);
          try {
            for (const file of pendingFiles) {
              await uploadFile(file, "expense", data.id);
            }
          } catch {
            toast.error("Expense saved, but some files failed to upload.");
          } finally {
            setUploading(false);
          }
        }
        onSuccess();
        onOpenChange(false);
        reset();
        toast.success("Expense added.");
      },
      onError: (e) =>
        toast.error("Couldn't add expense", { description: e.message }),
    }),
  );

  const isBusy = create.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <CreateFormFields
            amount={amount}
            setAmount={setAmount}
            expenseDate={expenseDate}
            setExpenseDate={setExpenseDate}
            notes={notes}
            setNotes={setNotes}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            customerId={customerId}
            setCustomerId={setCustomerId}
            paymentModeId={paymentModeId}
            setPaymentModeId={setPaymentModeId}
            orgCurrency={orgCurrency}
            categories={categories}
            customers={customers}
            paymentModes={paymentModes}
            pendingFiles={pendingFiles}
            setPendingFiles={setPendingFiles}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={isBusy}
            disabled={isBusy || !amount.trim() || !expenseDate}
            onClick={() =>
              create.mutate({
                amount,
                expenseDate,
                notes: notes || null,
                categoryId: categoryId || null,
                customerId: customerId || null,
                paymentModeId: paymentModeId || null,
              })
            }
          >
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function ExpenseRow({
  expense,
  categoryName,
  customerName,
  paymentModeName,
  currency,
  onEdit,
  onDelete,
  isDeletePending,
}: {
  expense: ExpenseRecord;
  categoryName?: string;
  customerName?: string;
  paymentModeName?: string;
  currency: OrgCurrency | null;
  onEdit: (e: ExpenseRecord) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}) {
  return (
    <tr className="group border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-2 text-sm text-muted-foreground whitespace-nowrap">
        <NextLink
          href={`/app/expenses/${expense.id}`}
          className="hover:text-foreground hover:underline underline-offset-2"
        >
          {formatDate(expense.expenseDate)}
        </NextLink>
      </td>
      <td className="py-3 px-2 text-sm font-medium text-foreground whitespace-nowrap">
        <NextLink
          href={`/app/expenses/${expense.id}`}
          className="hover:underline underline-offset-2"
        >
          {formatCurrencyDisplay(expense.amount, currency)}
        </NextLink>
      </td>
      <td className="py-3 px-2 text-sm text-muted-foreground">
        {categoryName ?? <span className="italic opacity-40">—</span>}
      </td>
      <td className="py-3 px-2 text-sm text-muted-foreground">
        {customerName ?? <span className="italic opacity-40">—</span>}
      </td>
      <td className="py-3 px-2 text-sm text-muted-foreground">
        {paymentModeName ?? <span className="italic opacity-40">—</span>}
      </td>
      <td className="py-3 pl-2 pr-4 w-20">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(expense)}
            className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Delete"
            disabled={isDeletePending}
            onClick={() => onDelete(expense.id)}
            className={cn(
              "rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-destructive",
              isDeletePending && "opacity-40",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExpensesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: expenseList = [], isLoading } = useQuery(
    trpc.expenses.list.queryOptions(),
  );
  const { data: orgCurrency = null } = useQuery(
    trpc.expenses.getDefaultCurrency.queryOptions(),
  );
  const { data: categories = [] } = useQuery(
    trpc.expenses.listCategories.queryOptions(),
  );
  const { data: customers = [] } = useQuery(
    trpc.expenses.listCustomers.queryOptions(),
  );
  const { data: paymentModes = [] } = useQuery(
    trpc.expenses.listPaymentModes.queryOptions(),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseRecord | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const customerMap = new Map(customers.map((c) => [c.id, c.displayName]));
  const modeMap = new Map(paymentModes.map((m) => [m.id, m.name]));

  function invalidate() {
    queryClient.invalidateQueries(trpc.expenses.list.queryOptions());
  }

  const remove = useMutation(
    trpc.expenses.delete.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Expense deleted.");
      },
      onError: (e) =>
        toast.error("Couldn't delete", { description: e.message }),
    }),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const totalAmount = expenseList.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0,
  );

  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your organization&apos;s expenses.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {expenseList.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Total Expenses
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatCurrencyDisplay(totalAmount, orgCurrency)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Records
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {expenseList.length}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {expenseList.length} record{expenseList.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {expenseList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No expenses recorded yet. Click &ldquo;Add Expense&rdquo; to get
              started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Date
                  </th>
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Amount
                  </th>
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Category
                  </th>
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Customer
                  </th>
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Payment Mode
                  </th>
                  <th className="py-2 pl-2 pr-4 w-20" />
                </tr>
              </thead>
              <tbody>
                {expenseList.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    categoryName={
                      expense.categoryId
                        ? categoryMap.get(expense.categoryId)
                        : undefined
                    }
                    customerName={
                      expense.customerId
                        ? customerMap.get(expense.customerId)
                        : undefined
                    }
                    paymentModeName={
                      expense.paymentModeId
                        ? modeMap.get(expense.paymentModeId)
                        : undefined
                    }
                    currency={orgCurrency}
                    onEdit={setEditTarget}
                    onDelete={(id) => remove.mutate({ id })}
                    isDeletePending={remove.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateExpenseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={invalidate}
        orgCurrency={orgCurrency}
        categories={categories}
        customers={customers}
        paymentModes={paymentModes}
      />

      {editTarget ? (
        <EditExpenseDialog
          expense={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          onSuccess={invalidate}
          orgCurrency={orgCurrency}
          categories={categories}
          customers={customers}
          paymentModes={paymentModes}
        />
      ) : null}
    </div>
  );
}

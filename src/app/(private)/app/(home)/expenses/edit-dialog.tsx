"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Paperclip, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
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
import type { CurrencyFormat } from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExpenseRecord = {
  id: string;
  amount: string | null;
  expenseDate: string;
  notes: string | null;
  categoryId: string | null;
  customerId: string | null;
  paymentModeId: string | null;
  currencyId: string | null;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadFile(
  file: File,
  resourceType: string,
  resourceId: string,
): Promise<{
  id: string;
  fileName: string;
  storageKey: string;
  fileSize: number;
  mimeType: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("resourceType", resourceType);
  formData.append("resourceId", resourceId);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Upload failed");
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// PendingReceiptField — no expenseId yet (Create dialog)
// ---------------------------------------------------------------------------

export function PendingReceiptField({
  pendingFiles,
  onChange,
}: {
  pendingFiles: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    onChange([...pendingFiles, ...Array.from(selected)]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(pendingFiles.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.svg,.webp,.docx,.zip"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <Upload className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">Upload Receipt</p>
          <p className="text-xs text-muted-foreground">
            PDF, PNG, JPG, SVG, DOCX, ZIP — max 25 MB
          </p>
        </div>
      </button>
      {pendingFiles.length > 0 && (
        <ul className="space-y-1.5">
          {pendingFiles.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FullReceiptField — with expenseId (Edit dialog)
// ---------------------------------------------------------------------------

export function FullReceiptField({ expenseId }: { expenseId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const filesQuery = useQuery(
    trpc.expenses.listFiles.queryOptions({ expenseId }),
  );

  const deleteFile = useMutation(
    trpc.expenses.deleteFile.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.expenses.listFiles.queryOptions({ expenseId }),
        ),
      onError: (e) =>
        toast.error("Couldn't delete file", { description: e.message }),
    }),
  );

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        await uploadFile(file, "expense", expenseId);
      }
      await queryClient.invalidateQueries(
        trpc.expenses.listFiles.queryOptions({ expenseId }),
      );
      toast.success("File uploaded.");
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const files = filesQuery.data ?? [];

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.svg,.webp,.docx,.zip"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50 disabled:opacity-60"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          {uploading ? (
            <Spinner className="h-4 w-4 text-primary" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Uploading…" : "Upload Receipt"}
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, PNG, JPG, SVG, DOCX, ZIP — max 25 MB
          </p>
        </div>
      </button>

      {filesQuery.isLoading && (
        <div className="flex justify-center py-2">
          <Spinner className="h-4 w-4 text-primary" />
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {file.mimeType.startsWith("image/") ? (
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <a
                href={file.storageKey}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-foreground underline-offset-2 hover:underline"
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
                className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExpenseFormFields
// ---------------------------------------------------------------------------

function ExpenseFormFields({
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
  receiptSlot,
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
  orgCurrency: CurrencyFormat | null;
  categories: { id: string; name: string }[];
  customers: { id: string; displayName: string }[];
  paymentModes: { id: string; name: string }[];
  receiptSlot: React.ReactNode;
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
        {receiptSlot}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditExpenseDialog
// ---------------------------------------------------------------------------

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  onSuccess,
  orgCurrency,
  categories,
  customers,
  paymentModes,
}: {
  expense: ExpenseRecord;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  orgCurrency: CurrencyFormat | null;
  categories: { id: string; name: string }[];
  customers: { id: string; displayName: string }[];
  paymentModes: { id: string; name: string }[];
}) {
  const trpc = useTRPC();
  const [amount, setAmount] = useState(expense.amount ?? "");
  const [expenseDate, setExpenseDate] = useState(expense.expenseDate);
  const [notes, setNotes] = useState(expense.notes ?? "");
  const [categoryId, setCategoryId] = useState(expense.categoryId ?? "");
  const [customerId, setCustomerId] = useState(expense.customerId ?? "");
  const [paymentModeId, setPaymentModeId] = useState(
    expense.paymentModeId ?? "",
  );

  const update = useMutation(
    trpc.expenses.update.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Expense updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update expense", { description: e.message }),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <ExpenseFormFields
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
            receiptSlot={<FullReceiptField expenseId={expense.id} />}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={update.isPending}
            disabled={update.isPending || !amount.trim() || !expenseDate}
            onClick={() =>
              update.mutate({
                id: expense.id,
                amount,
                expenseDate,
                notes: notes || null,
                categoryId: categoryId || null,
                customerId: customerId || null,
                paymentModeId: paymentModeId || null,
              })
            }
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

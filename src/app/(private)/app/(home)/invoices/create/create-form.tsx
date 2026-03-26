"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, FileText, Paperclip, Percent, Plus, Trash2, Upload, X } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CustomerPicker } from "@/components/ui/customer-picker";
import { Input } from "@/components/ui/input";
import { ItemPicker } from "@/components/ui/item-picker";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { NativeSelect } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";
import { formatBytes, uploadFile } from "../../expenses/edit-dialog";

type DraftItem = {
  id: string;
  itemId: string;
  quantity: string;
  unitPrice: string;
};

function makeDraftItem(): DraftItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: "",
    quantity: "1",
    unitPrice: "",
  };
}

function makeTaxRow(taxId = "") {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taxId,
  };
}

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateInputValue(): string {
  return formatDateInputValue(new Date());
}

function addDaysToDateInputValue(value: string, days: number): string {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return "";
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return formatDateInputValue(date);
}

export function CreateInvoiceForm() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: meta = null, isPending: metaPending } = useQuery(
    trpc.invoices.getFormMeta.queryOptions(),
  );
  const { data: usage, isPending: usagePending } = useQuery(
    trpc.invoices.getUsage.queryOptions(),
  );
  const { data: itemOptions = [], isPending: itemsPending } = useQuery(
    trpc.items.list.queryOptions(),
  );

  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(getTodayDateInputValue);
  const [dueDate, setDueDate] = useState(() =>
    addDaysToDateInputValue(getTodayDateInputValue(), 7),
  );
  const [dueDateTouched, setDueDateTouched] = useState(false);
  const [notes, setNotes] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([makeDraftItem()]);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [summaryTaxRows, setSummaryTaxRows] = useState<
    { key: string; taxId: string }[]
  >([]);

  const create = useMutation(
    trpc.invoices.create.mutationOptions({
      onSuccess: async (created) => {
        queryClient.invalidateQueries(trpc.invoices.list.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getUsage.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getFormMeta.queryOptions());
        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            await uploadFile(file, "invoice", created.id).catch(() => null);
          }
        }
        toast.success("Invoice created.", {
          description: `${created.invoiceNumber} is ready in draft status.`,
        });
        router.push(`/app/invoices/${created.id}`);
      },
      onError: (error) =>
        toast.error("Couldn't create invoice.", {
          description: error.message,
        }),
    }),
  );

  const itemsById = useMemo(
    () => new Map(itemOptions.map((item) => [item.id, item])),
    [itemOptions],
  );

  const taxTypesById = useMemo(
    () => new Map((meta?.taxTypes ?? []).map((t) => [t.id, t])),
    [meta?.taxTypes],
  );

  const { subTotal, taxRows, grandTotal } = useMemo(() => {
    let sub = 0;
    for (const item of draftItems) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) continue;
      sub += quantity * unitPrice;
    }

    const discountInputVal = Number(discountValue) || 0;
    const rawDiscount =
      discountType === "fixed"
        ? discountInputVal
        : sub * (discountInputVal / 100);
    const discount = Math.min(rawDiscount, sub);
    const discounted = sub - discount;

    const rows = summaryTaxRows.map(({ key, taxId }) => {
      const taxType = taxTypesById.get(taxId);
      const amount = taxType ? discounted * (Number(taxType.percent) / 100) : 0;
      return { key, taxId, taxType, amount };
    });
    const taxTotal = rows.reduce((sum, r) => sum + r.amount, 0);

    return {
      subTotal: sub,
      discountAmount: discount,
      taxRows: rows,
      grandTotal: discounted + taxTotal,
    };
  }, [draftItems, discountValue, discountType, summaryTaxRows, taxTypesById]);

  function updateDraftItem(
    id: string,
    updater: (current: DraftItem) => DraftItem,
  ) {
    setDraftItems((current) =>
      current.map((item) => (item.id === id ? updater(item) : item)),
    );
  }

  function handleCatalogItemChange(id: string, itemId: string) {
    const catalogItem = itemsById.get(itemId);
    updateDraftItem(id, (current) => ({
      ...current,
      itemId,
      unitPrice: catalogItem?.price ?? current.unitPrice,
    }));
  }

  function addDraftItem() {
    setDraftItems((current) => [...current, makeDraftItem()]);
  }

  function removeDraftItem(id: string) {
    setDraftItems((current) => {
      if (current.length === 1) return [makeDraftItem()];
      return current.filter((item) => item.id !== id);
    });
  }

  function addTax() {
    setSummaryTaxRows((prev) => [...prev, makeTaxRow()]);
  }

  function updateTaxId(key: string, taxId: string) {
    setSummaryTaxRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, taxId } : row)),
    );
  }

  function removeTax(key: string) {
    setSummaryTaxRows((prev) => prev.filter((row) => row.key !== key));
  }

  function handleInvoiceDateChange(value: string) {
    setInvoiceDate(value);

    if (!dueDateTouched) {
      setDueDate(addDaysToDateInputValue(value, 7));
    }
  }

  function handleDueDateChange(value: string) {
    setDueDate(value);
    setDueDateTouched(true);
  }

  if (metaPending || usagePending || itemsPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const validDraftItems = draftItems.filter((item) => item.itemId);
  const canCreate = usage?.canCreate ?? true;
  const hasDependencies = Boolean(meta?.defaultCurrency);

  if (!canCreate || !hasDependencies || !meta) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
          {!canCreate
            ? `You reached the invoice limit for your current plan${usage?.limit ? ` (${usage.limit})` : ""}.`
            : "This organization still needs a default currency before you can create invoices."}
        </div>
        <Button type="button" variant="outline" asChild>
          <NextLink href="/app/invoices">Back to invoices</NextLink>
        </Button>
      </div>
    );
  }

  const currency = meta.defaultCurrency;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-8 mt-6 mb-8">
        <div className="max-h-[173px] col-span-12 lg:col-span-5 pr-0">
          <CustomerPicker
            id="create-invoice-customer"
            value={customerId}
            onValueChange={setCustomerId}
            required
          />
        </div>
        <div className="grid gap-y-6 gap-x-4 grid-cols-1 md:grid-cols-2 col-span-12 lg:col-span-7">
          <div className="relative w-full text-left">
            <Label htmlFor="create-invoice-date">Invoice date</Label>
            <Input
              id="create-invoice-date"
              type="date"
              value={invoiceDate}
              onChange={(event) => handleInvoiceDateChange(event.target.value)}
            />
          </div>
          <div className="relative w-full text-left">
            <Label htmlFor="create-due-date">
              Due date{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="create-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => handleDueDateChange(event.target.value)}
            />
          </div>
          <div className="relative w-full text-left">
            <Label>Invoice number</Label>
            <Input value={meta.nextInvoiceNumber} disabled />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Line items
            </h2>
            <p className="text-xs text-muted-foreground">
              Invoices on this screen use catalog items only.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDraftItem}
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          {draftItems.map((draftItem, index) => {
            const catalogItem = draftItem.itemId
              ? itemsById.get(draftItem.itemId)
              : null;
            const lineTotal =
              Number(draftItem.quantity || 0) *
              Number(draftItem.unitPrice || 0);

            return (
              <div key={draftItem.id}>
                {index > 0 && <hr className="my-4 border-border" />}
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_140px_220px_auto]">
                  <div className="space-y-1.5">
                    <Label htmlFor={`create-item-${draftItem.id}`}>
                      Item {index + 1}
                    </Label>
                    <ItemPicker
                      id={`create-item-${draftItem.id}`}
                      value={draftItem.itemId}
                      onValueChange={(itemId) =>
                        handleCatalogItemChange(draftItem.id, itemId)
                      }
                    />
                    {catalogItem?.description ? (
                      <p className="text-xs text-muted-foreground">
                        {catalogItem.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`create-qty-${draftItem.id}`}>Qty</Label>
                    <Input
                      id={`create-qty-${draftItem.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={draftItem.quantity}
                      onChange={(event) =>
                        updateDraftItem(draftItem.id, (current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`create-price-${draftItem.id}`}>
                      Unit price
                    </Label>
                    <CurrencyInput
                      id={`create-price-${draftItem.id}`}
                      currency={currency}
                      value={draftItem.unitPrice}
                      onValueChange={(value) =>
                        updateDraftItem(draftItem.id, (current) => ({
                          ...current,
                          unitPrice: value,
                        }))
                      }
                    />
                    {catalogItem?.unitName ? (
                      <p className="text-xs text-muted-foreground">
                        Unit: {catalogItem.unitName}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-end justify-between gap-3 xl:flex-col xl:items-end">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                        Line total
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatCurrencyDisplay(
                          Number.isFinite(lineTotal)
                            ? lineTotal.toFixed(3)
                            : "0",
                          currency,
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDraftItem(draftItem.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Tabs defaultValue="notes">
          <TabsList>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="files">
              Files
              {pendingFiles.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
                  {pendingFiles.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="Add a note that will travel with this invoice."
            />
          </TabsContent>

          <TabsContent value="files" className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".png,.jpg,.jpeg,.gif,.webp"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files ?? []);
                if (selected.length) setPendingFiles((prev) => [...prev, ...selected]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Add Attachment</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP — max 25 MB</p>
              </div>
            </button>

            {pendingFiles.length > 0 && (
              <ul className="space-y-1.5">
                {pendingFiles.map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    {file.type.startsWith("image/") ? (
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-foreground">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {pendingFiles.length === 0 && (
              <p className="text-xs text-muted-foreground">Files will be uploaded when you save the invoice.</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Summary</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Sub Total</span>
              <span className="font-medium text-foreground">
                {formatCurrencyDisplay(subTotal.toFixed(3), currency)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-muted-foreground">Discount</span>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-24 text-xs"
                  placeholder="0"
                />
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-sm">
                  <NativeSelect
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "fixed" | "percentage")
                    }
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    aria-label="Discount type: fixed amount or percentage"
                    title={
                      discountType === "fixed"
                        ? "Fixed amount"
                        : "Percentage"
                    }
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                  </NativeSelect>
                  {discountType === "fixed" ? (
                    <DollarSign
                      className="pointer-events-none h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                  ) : (
                    <Percent
                      className="pointer-events-none h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            </div>

            {taxRows.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-1">
                  <NativeSelect
                    value={row.taxId}
                    onChange={(e) => updateTaxId(row.key, e.target.value)}
                    className="flex-1 text-xs"
                  >
                    <option value="">Select tax</option>
                    {meta.taxTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.percent}%)
                      </option>
                    ))}
                  </NativeSelect>
                  <button
                    type="button"
                    onClick={() => removeTax(row.key)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <span className="shrink-0 font-medium text-foreground">
                  {formatCurrencyDisplay(row.amount.toFixed(3), currency)}
                </span>
              </div>
            ))}

            {meta.taxTypes.length > 0 ? (
              <button
                type="button"
                onClick={addTax}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                Add Tax
              </button>
            ) : null}

            <hr className="border-border" />

            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                Total Amount
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrencyDisplay(grandTotal.toFixed(3), currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <NextLink href="/app/invoices">Cancel</NextLink>
        </Button>
        <Button
          type="button"
          loading={create.isPending}
          disabled={
            create.isPending ||
            !customerId ||
            !invoiceDate ||
            validDraftItems.length === 0
          }
          onClick={() =>
            create.mutate({
              customerId,
              invoiceDate,
              dueDate: dueDate || null,
              notes: notes || null,
              items: validDraftItems.map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice || "0",
              })),
              discount: discountValue || null,
              discountFixed: discountType === "fixed",
              taxIds: summaryTaxRows.map((r) => r.taxId).filter(Boolean),
            })
          }
        >
          Create Invoice
        </Button>
      </div>
    </div>
  );
}

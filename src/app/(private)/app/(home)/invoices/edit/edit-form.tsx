"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Percent, Plus, Trash2, X } from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CustomerPicker } from "@/components/ui/customer-picker";
import { Input } from "@/components/ui/input";
import { ItemPicker } from "@/components/ui/item-picker";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { NativeSelect } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";
import { formatInvoiceDate, InvoiceStatusBadge } from "../invoice-ui";

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

export function EditInvoiceForm() {
  const trpc = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const invoiceId = searchParams.get("id") ?? "";

  const { data: meta = null, isPending: metaPending } = useQuery(
    trpc.invoices.getFormMeta.queryOptions(),
  );
  const { data: itemOptions = [], isPending: itemsPending } = useQuery(
    trpc.items.list.queryOptions(),
  );
  const { data: invoice, isPending: invoicePending } = useQuery({
    ...trpc.invoices.getById.queryOptions({ id: invoiceId }),
    enabled: Boolean(invoiceId),
  });

  const [initializedForId, setInitializedForId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([makeDraftItem()]);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [summaryTaxRows, setSummaryTaxRows] = useState<
    { key: string; taxId: string }[]
  >([]);

  useEffect(() => {
    if (!invoice || initializedForId === invoice.id) {
      return;
    }

    setCustomerId(invoice.customer.id);
    setInvoiceDate(invoice.invoiceDate);
    setDueDate(invoice.dueDate ?? "");
    setNotes(invoice.notes ?? "");
    setDraftItems(
      invoice.items.length > 0
        ? invoice.items.map((item) => ({
            id: item.id,
            itemId: item.itemId ?? "",
            quantity: item.quantity,
            unitPrice: item.price,
          }))
        : [makeDraftItem()],
    );
    if (invoice.discount) {
      setDiscountValue(invoice.discount);
      setDiscountType(invoice.discountFixed ? "fixed" : "percentage");
    }
    setInitializedForId(invoice.id);
  }, [initializedForId, invoice]);

  const update = useMutation(
    trpc.invoices.update.mutationOptions({
      onSuccess: () => {
        if (!invoiceId) return;

        queryClient.invalidateQueries(trpc.invoices.list.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getUsage.queryOptions());
        queryClient.invalidateQueries(trpc.invoices.getFormMeta.queryOptions());
        queryClient.invalidateQueries(
          trpc.invoices.getById.queryOptions({ id: invoiceId }),
        );
        toast.success("Invoice updated.");
        router.push(`/app/invoices/${invoiceId}`);
      },
      onError: (error) =>
        toast.error("Couldn't update invoice.", {
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

  const displayCurrency = invoice?.currency ?? meta?.defaultCurrency ?? null;

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

  if (!invoiceId) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
          Pick an invoice from the list first so this page knows what to edit.
        </div>
        <Button type="button" variant="outline" asChild>
          <NextLink href="/app/invoices">Back to invoices</NextLink>
        </Button>
      </div>
    );
  }

  if (
    metaPending ||
    itemsPending ||
    invoicePending ||
    !invoice ||
    !meta ||
    !displayCurrency
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const validDraftItems = draftItems.filter((item) => item.itemId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {invoice.invoiceNumber}
            </p>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatInvoiceDate(invoice.invoiceDate)}
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <NextLink href={`/app/invoices/${invoice.id}`}>Cancel</NextLink>
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-8 mt-6 mb-8">
        <div className="max-h-[173px] col-span-12 lg:col-span-5 pr-0">
          <CustomerPicker
            id="edit-invoice-customer"
            value={customerId}
            onValueChange={setCustomerId}
            required
          />
        </div>

        <div className="grid gap-y-6 gap-x-4 grid-cols-1 md:grid-cols-2 col-span-12 lg:col-span-7">
          <div className="relative w-full text-left">
            <Label htmlFor="edit-invoice-date">Invoice date</Label>
            <Input
              id="edit-invoice-date"
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
            />
          </div>

          <div className="relative w-full text-left">
            <Label htmlFor="edit-due-date">
              Due date{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="edit-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

          <div className="relative w-full text-left">
            <Label>Invoice number</Label>
            <Input value={invoice.invoiceNumber} disabled />
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
              Update the invoice using your current catalog items.
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
                    <Label htmlFor={`edit-item-${draftItem.id}`}>
                      Item {index + 1}
                    </Label>
                    <ItemPicker
                      id={`edit-item-${draftItem.id}`}
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
                    <Label htmlFor={`edit-qty-${draftItem.id}`}>Qty</Label>
                    <Input
                      id={`edit-qty-${draftItem.id}`}
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
                    <Label htmlFor={`edit-price-${draftItem.id}`}>
                      Unit price
                    </Label>
                    <CurrencyInput
                      id={`edit-price-${draftItem.id}`}
                      currency={displayCurrency}
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
                          displayCurrency,
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
        <div className="space-y-1.5">
          <Label>
            Notes{" "}
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <RichTextEditor value={notes} onChange={setNotes} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Summary</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Sub Total</span>
              <span className="font-medium text-foreground">
                {formatCurrencyDisplay(subTotal.toFixed(3), displayCurrency)}
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
                  {formatCurrencyDisplay(
                    row.amount.toFixed(3),
                    displayCurrency,
                  )}
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
                {formatCurrencyDisplay(grandTotal.toFixed(3), displayCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <NextLink href={`/app/invoices/${invoice.id}`}>Cancel</NextLink>
        </Button>
        <Button
          type="button"
          loading={update.isPending}
          disabled={
            update.isPending ||
            !customerId ||
            !invoiceDate ||
            validDraftItems.length === 0
          }
          onClick={() =>
            update.mutate({
              id: invoice.id,
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
          Save Changes
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
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
import { EstimateStatusBadge, formatEstimateDate } from "../estimate-ui";

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

export function EditEstimateForm() {
  const trpc = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const estimateId = searchParams.get("id") ?? "";

  const { data: meta = null, isPending: metaPending } = useQuery(
    trpc.estimates.getFormMeta.queryOptions(),
  );
  const { data: itemOptions = [], isPending: itemsPending } = useQuery(
    trpc.items.list.queryOptions(),
  );
  const { data: estimate, isPending: estimatePending } = useQuery({
    ...trpc.estimates.getById.queryOptions({ id: estimateId }),
    enabled: Boolean(estimateId),
  });

  const [initializedForId, setInitializedForId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [estimateDate, setEstimateDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
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
    if (!estimate || initializedForId === estimate.id) {
      return;
    }

    setCustomerId(estimate.customer.id);
    setEstimateDate(estimate.estimateDate);
    setExpiryDate(estimate.expiryDate ?? "");
    setNotes(estimate.notes ?? "");
    setDraftItems(
      estimate.items.length > 0
        ? estimate.items.map((item) => ({
            id: item.id,
            itemId: item.itemId ?? "",
            quantity: item.quantity,
            unitPrice: item.price,
          }))
        : [makeDraftItem()],
    );
    if (estimate.discount) {
      setDiscountValue(estimate.discount);
      setDiscountType(estimate.discountFixed ? "fixed" : "percentage");
    }
    setInitializedForId(estimate.id);
  }, [estimate, initializedForId]);

  const update = useMutation(
    trpc.estimates.update.mutationOptions({
      onSuccess: () => {
        if (!estimateId) return;

        queryClient.invalidateQueries(trpc.estimates.list.queryOptions());
        queryClient.invalidateQueries(trpc.estimates.getUsage.queryOptions());
        queryClient.invalidateQueries(
          trpc.estimates.getFormMeta.queryOptions(),
        );
        queryClient.invalidateQueries(
          trpc.estimates.getById.queryOptions({ id: estimateId }),
        );
        toast.success("Estimate updated.");
        router.push(`/app/estimates/${estimateId}`);
      },
      onError: (error) =>
        toast.error("Couldn't update estimate.", {
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

  const displayCurrency = estimate?.currency ?? meta?.defaultCurrency ?? null;

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

  if (!estimateId) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
          Pick an estimate from the list first so this page knows what to edit.
        </div>
        <Button type="button" variant="outline" asChild>
          <NextLink href="/app/estimates">Back to estimates</NextLink>
        </Button>
      </div>
    );
  }

  if (
    metaPending ||
    itemsPending ||
    estimatePending ||
    !estimate ||
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
              {estimate.estimateNumber}
            </p>
            <EstimateStatusBadge status={estimate.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatEstimateDate(estimate.estimateDate)}
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <NextLink href={`/app/estimates/${estimate.id}`}>Cancel</NextLink>
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-1.5 lg:col-span-5">
          <Label htmlFor="edit-estimate-customer">Customer</Label>
          <CustomerPicker
            id="edit-estimate-customer"
            value={customerId}
            onValueChange={setCustomerId}
            required
          />
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-estimate-date">Estimate date</Label>
              <Input
                id="edit-estimate-date"
                type="date"
                value={estimateDate}
                onChange={(event) => setEstimateDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-expiry-date">
                Expiry date{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="edit-expiry-date"
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Estimate number</Label>
              <Input value={estimate.estimateNumber} disabled />
            </div>
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
              Update the estimate using your current catalog items.
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
                <NativeSelect
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(e.target.value as "fixed" | "percentage")
                  }
                  className="w-28 text-xs"
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </NativeSelect>
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
          <NextLink href={`/app/estimates/${estimate.id}`}>Cancel</NextLink>
        </Button>
        <Button
          type="button"
          loading={update.isPending}
          disabled={
            update.isPending ||
            !customerId ||
            !estimateDate ||
            validDraftItems.length === 0
          }
          onClick={() =>
            update.mutate({
              id: estimate.id,
              customerId,
              estimateDate,
              expiryDate: expiryDate || null,
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

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Percent, Plus, Trash2, X } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CustomerPicker } from "@/components/ui/customer-picker";
import { Input } from "@/components/ui/input";
import { ItemPicker } from "@/components/ui/item-picker";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";
import {
  FREQUENCY_LABELS,
  RECURRING_FREQUENCIES,
} from "@/schemas/recurring-invoice";
import {
  formatNextRun,
  FrequencyLabel,
  PageShell,
  RecurringStatusBadge,
} from "../../recurring-invoice-ui";

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

export function EditRecurringInvoiceForm({ id }: { id: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: template, isPending: templatePending } = useQuery(
    trpc.recurringInvoices.getById.queryOptions({ id }),
  );
  const { data: meta = null, isPending: metaPending } = useQuery(
    trpc.recurringInvoices.getFormMeta.queryOptions(),
  );
  const { data: itemOptions = [], isPending: itemsPending } = useQuery(
    trpc.items.list.queryOptions(),
  );
  const { data: generatedInvoices = [] } = useQuery(
    trpc.recurringInvoices.listGeneratedInvoices.queryOptions({ templateId: id }),
  );

  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [frequency, setFrequency] = useState<string>(RECURRING_FREQUENCIES[2]);
  const [startDate, setStartDate] = useState("");
  const [limitType, setLimitType] = useState<"none" | "date" | "count">("none");
  const [limitDate, setLimitDate] = useState("");
  const [limitCount, setLimitCount] = useState("");
  const [dueDaysOffset, setDueDaysOffset] = useState("");
  const [sendAutomatically, setSendAutomatically] = useState(false);
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([makeDraftItem()]);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [summaryTaxRows, setSummaryTaxRows] = useState<{ key: string; taxId: string }[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!template || initialized) return;
    setName(template.name);
    setCustomerId(template.customer.id);
    setFrequency(template.frequency);
    setStartDate(template.startDate);
    setLimitType(template.limitType as "none" | "date" | "count");
    setLimitDate(template.limitDate ?? "");
    setLimitCount(template.limitCount !== null ? String(template.limitCount) : "");
    setDueDaysOffset(
      template.dueDaysOffset !== null ? String(template.dueDaysOffset) : "",
    );
    setSendAutomatically(template.sendAutomatically);
    setNotes(template.notes ?? "");
    if (template.items.length > 0) {
      setDraftItems(
        template.items.map((item) => ({
          id: item.id,
          itemId: item.itemId ?? "",
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      );
    }
    if (template.discount) {
      setDiscountValue(template.discount);
      setDiscountType(template.discountFixed ? "fixed" : "percentage");
    }
    setInitialized(true);
  }, [template, initialized]);

  const update = useMutation(
    trpc.recurringInvoices.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.recurringInvoices.list.queryOptions());
        queryClient.invalidateQueries(
          trpc.recurringInvoices.getById.queryOptions({ id }),
        );
        toast.success("Recurring invoice updated.");
        router.push("/app/recurring-invoices");
      },
      onError: (error) =>
        toast.error("Couldn't update recurring invoice.", { description: error.message }),
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
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      if (!Number.isFinite(qty) || !Number.isFinite(price)) continue;
      sub += qty * price;
    }
    const discountInputVal = Number(discountValue) || 0;
    const rawDiscount =
      discountType === "fixed" ? discountInputVal : sub * (discountInputVal / 100);
    const discount = Math.min(rawDiscount, sub);
    const discounted = sub - discount;
    const rows = summaryTaxRows.map(({ key, taxId }) => {
      const taxType = taxTypesById.get(taxId);
      const amount = taxType ? discounted * (Number(taxType.percent) / 100) : 0;
      return { key, taxId, taxType, amount };
    });
    const taxTotal = rows.reduce((sum, r) => sum + r.amount, 0);
    return { subTotal: sub, taxRows: rows, grandTotal: discounted + taxTotal };
  }, [draftItems, discountValue, discountType, summaryTaxRows, taxTypesById]);

  function updateDraftItem(draftId: string, updater: (c: DraftItem) => DraftItem) {
    setDraftItems((current) =>
      current.map((item) => (item.id === draftId ? updater(item) : item)),
    );
  }

  function handleCatalogItemChange(draftId: string, catalogItemId: string) {
    const catalogItem = itemsById.get(catalogItemId);
    updateDraftItem(draftId, (current) => ({
      ...current,
      itemId: catalogItemId,
      unitPrice: catalogItem?.price ?? current.unitPrice,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = draftItems.filter((item) => item.itemId);
    if (validItems.length === 0) {
      toast.error("Add at least one item.");
      return;
    }
    update.mutate({
      id,
      name,
      customerId,
      frequency: frequency as (typeof RECURRING_FREQUENCIES)[number],
      startDate,
      limitType,
      limitDate: limitType === "date" ? limitDate || null : null,
      limitCount:
        limitType === "count" && limitCount ? Number(limitCount) : null,
      dueDaysOffset: dueDaysOffset ? Number(dueDaysOffset) : null,
      sendAutomatically,
      notes: notes || null,
      items: validItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || "0",
      })),
      discount: discountValue || null,
      discountFixed: discountType === "fixed",
      taxIds: summaryTaxRows.map((r) => r.taxId).filter(Boolean),
    });
  }

  if (templatePending || metaPending || itemsPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  if (!template) {
    return (
      <PageShell title="Recurring Invoice">
        <p className="text-sm text-muted-foreground">Not found.</p>
      </PageShell>
    );
  }

  const currency = meta?.defaultCurrency ?? null;
  const validDraftItems = draftItems.filter((i) => i.itemId);
  const isCompleted = template.status === "completed";

  return (
    <PageShell title={template.name}>
      <div className="space-y-8">
        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-muted/10 px-5 py-3.5 text-sm">
          <RecurringStatusBadge
            status={template.status as "active" | "on_hold" | "completed"}
          />
          <span className="text-muted-foreground">
            Frequency:{" "}
            <span className="font-medium text-foreground">
              <FrequencyLabel
                frequency={template.frequency as Parameters<typeof FrequencyLabel>[0]["frequency"]}
              />
            </span>
          </span>
          <span className="text-muted-foreground">
            Next run:{" "}
            <span className="font-medium text-foreground">
              {isCompleted ? "—" : formatNextRun(template.nextRunAt)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Generated:{" "}
            <span className="font-medium text-foreground">
              {template.generatedCount} invoice
              {template.generatedCount !== 1 ? "s" : ""}
            </span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-5">
              <CustomerPicker
                id="ri-edit-customer"
                value={customerId}
                onValueChange={setCustomerId}
                required
              />
            </div>

            <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-7">
              <div className="md:col-span-2">
                <Label htmlFor="ri-edit-name">Template name</Label>
                <Input
                  id="ri-edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="ri-edit-frequency">Frequency</Label>
                <NativeSelect
                  id="ri-edit-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  {RECURRING_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {FREQUENCY_LABELS[f]}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div>
                <Label htmlFor="ri-edit-start-date">Start date</Label>
                <Input
                  id="ri-edit-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="ri-edit-limit-type">Limit by</Label>
                <NativeSelect
                  id="ri-edit-limit-type"
                  value={limitType}
                  onChange={(e) =>
                    setLimitType(e.target.value as "none" | "date" | "count")
                  }
                >
                  <option value="none">No limit</option>
                  <option value="date">End date</option>
                  <option value="count">Number of invoices</option>
                </NativeSelect>
              </div>

              {limitType === "date" && (
                <div>
                  <Label htmlFor="ri-edit-limit-date">End date</Label>
                  <Input
                    id="ri-edit-limit-date"
                    type="date"
                    value={limitDate}
                    onChange={(e) => setLimitDate(e.target.value)}
                    required
                  />
                </div>
              )}

              {limitType === "count" && (
                <div>
                  <Label htmlFor="ri-edit-limit-count">Max invoices</Label>
                  <Input
                    id="ri-edit-limit-count"
                    type="number"
                    min="1"
                    step="1"
                    value={limitCount}
                    onChange={(e) => setLimitCount(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="ri-edit-due-offset">
                  Due days offset{" "}
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="ri-edit-due-offset"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 30"
                  value={dueDaysOffset}
                  onChange={(e) => setDueDaysOffset(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Send automatically */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <input
              id="ri-edit-send-auto"
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
              checked={sendAutomatically}
              onChange={(e) => setSendAutomatically(e.target.checked)}
            />
            <label htmlFor="ri-edit-send-auto" className="text-sm text-foreground">
              Send automatically
              <span className="ml-1 text-xs text-muted-foreground">
                — email the invoice to the customer when it is generated
              </span>
            </label>
          </div>

          {/* Line items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Line items</h2>
                <p className="text-xs text-muted-foreground">
                  Items from your catalog will be copied to each generated invoice.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDraftItems((prev) => [...prev, makeDraftItem()])
                }
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
                  Number(draftItem.quantity || 0) * Number(draftItem.unitPrice || 0);

                return (
                  <div key={draftItem.id}>
                    {index > 0 && <hr className="my-4 border-border" />}
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_140px_220px_auto]">
                      <div className="space-y-1.5">
                        <Label htmlFor={`ri-edit-item-${draftItem.id}`}>
                          Item {index + 1}
                        </Label>
                        <ItemPicker
                          id={`ri-edit-item-${draftItem.id}`}
                          value={draftItem.itemId}
                          onValueChange={(catalogId) =>
                            handleCatalogItemChange(draftItem.id, catalogId)
                          }
                        />
                        {catalogItem?.description ? (
                          <p className="text-xs text-muted-foreground">
                            {catalogItem.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`ri-edit-qty-${draftItem.id}`}>Qty</Label>
                        <Input
                          id={`ri-edit-qty-${draftItem.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={draftItem.quantity}
                          onChange={(e) =>
                            updateDraftItem(draftItem.id, (c) => ({
                              ...c,
                              quantity: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`ri-edit-price-${draftItem.id}`}>
                          Unit price
                        </Label>
                        <CurrencyInput
                          id={`ri-edit-price-${draftItem.id}`}
                          currency={currency}
                          value={draftItem.unitPrice}
                          onValueChange={(value) =>
                            updateDraftItem(draftItem.id, (c) => ({
                              ...c,
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
                          onClick={() =>
                            setDraftItems((prev) => {
                              if (prev.length === 1) return [makeDraftItem()];
                              return prev.filter((i) => i.id !== draftItem.id);
                            })
                          }
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

          {/* Notes + Summary */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-1.5">
              <Label htmlFor="ri-edit-notes">Notes</Label>
              <Textarea
                id="ri-edit-notes"
                rows={5}
                placeholder="Add a note that will travel with each generated invoice."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

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
                          setDiscountType(
                            e.target.value as "fixed" | "percentage",
                          )
                        }
                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                        aria-label="Discount type"
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
                        onChange={(e) =>
                          setSummaryTaxRows((prev) =>
                            prev.map((r) =>
                              r.key === row.key
                                ? { ...r, taxId: e.target.value }
                                : r,
                            ),
                          )
                        }
                        className="flex-1 text-xs"
                      >
                        <option value="">Select tax</option>
                        {(meta?.taxTypes ?? []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.percent}%)
                          </option>
                        ))}
                      </NativeSelect>
                      <button
                        type="button"
                        onClick={() =>
                          setSummaryTaxRows((prev) =>
                            prev.filter((r) => r.key !== row.key),
                          )
                        }
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

                {(meta?.taxTypes ?? []).length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSummaryTaxRows((prev) => [...prev, makeTaxRow()])
                    }
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <NextLink href="/app/recurring-invoices">Cancel</NextLink>
            </Button>
            <Button
              type="submit"
              loading={update.isPending}
              disabled={
                update.isPending || !name || !customerId || validDraftItems.length === 0
              }
            >
              Save changes
            </Button>
          </div>
        </form>

        {/* Generated invoices */}
        {generatedInvoices.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Generated invoices ({generatedInvoices.length})
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 pl-4 pr-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Invoice #
                    </th>
                    <th className="px-2 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Date
                    </th>
                    <th className="px-2 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Total
                    </th>
                    <th className="py-3 pl-2 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {generatedInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0">
                      <td className="py-3 pl-4 pr-2 text-sm font-medium text-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-2 py-3 text-sm text-foreground">
                        {inv.invoiceDate}
                      </td>
                      <td className="px-2 py-3 text-sm text-foreground">
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right text-sm font-medium text-foreground">
                        {formatCurrencyDisplay(inv.total, currency)}
                      </td>
                      <td className="py-3 pl-2 pr-4">
                        <NextLink
                          href={`/app/invoices/${inv.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          View →
                        </NextLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

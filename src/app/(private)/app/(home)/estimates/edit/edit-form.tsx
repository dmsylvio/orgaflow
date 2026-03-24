"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
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

export function EditEstimateForm() {
  const trpc = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const estimateId = searchParams.get("id") ?? "";

  const { data: meta = null, isPending: metaPending } = useQuery(
    trpc.estimates.getFormMeta.queryOptions(),
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
    () => new Map((meta?.items ?? []).map((item) => [item.id, item])),
    [meta?.items],
  );

  const displayCurrency = estimate?.currency ?? meta?.defaultCurrency ?? null;

  const total = useMemo(() => {
    return draftItems.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
        return sum;
      }

      return sum + quantity * unitPrice;
    }, 0);
  }, [draftItems]);

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
      if (current.length === 1) {
        return [makeDraftItem()];
      }

      return current.filter((item) => item.id !== id);
    });
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

        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <NextLink href={`/app/estimates/${estimate.id}`}>Cancel</NextLink>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-estimate-customer">Customer</Label>
          <NativeSelect
            id="edit-estimate-customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Select a customer</option>
            {meta.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.displayName}
              </option>
            ))}
          </NativeSelect>
        </div>

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
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="edit-expiry-date"
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-estimate-currency">Currency</Label>
          <Input
            id="edit-estimate-currency"
            value={displayCurrency.code}
            disabled
          />
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

        {draftItems.map((draftItem, index) => {
          const catalogItem = draftItem.itemId
            ? itemsById.get(draftItem.itemId)
            : null;
          const lineTotal =
            Number(draftItem.quantity || 0) * Number(draftItem.unitPrice || 0);

          return (
            <div
              key={draftItem.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_140px_220px_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor={`edit-item-${draftItem.id}`}>
                    Item {index + 1}
                  </Label>
                  <NativeSelect
                    id={`edit-item-${draftItem.id}`}
                    value={draftItem.itemId}
                    onChange={(event) =>
                      handleCatalogItemChange(draftItem.id, event.target.value)
                    }
                  >
                    <option value="">Select an item</option>
                    {meta.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </NativeSelect>
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
                        Number.isFinite(lineTotal) ? lineTotal.toFixed(3) : "0",
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-1.5">
          <Label htmlFor="edit-estimate-notes">
            Notes{" "}
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="edit-estimate-notes"
            rows={5}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Summary</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrencyDisplay(total.toFixed(3), displayCurrency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Tax</span>
              <span className="font-medium text-foreground">
                {formatCurrencyDisplay("0", displayCurrency)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrencyDisplay(total.toFixed(3), displayCurrency)}
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
              notes: notes.trim() || null,
              items: validDraftItems.map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice || "0",
              })),
            })
          }
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}

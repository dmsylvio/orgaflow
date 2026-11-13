"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  AttachmentDropzone,
  AttachmentList,
  DocumentDetailsGrid,
  DocumentEditorLayout,
  DocumentSummary,
  EditorField,
  EditorSection,
  LineItemsEditor,
  MobileTotalBar,
} from "@/components/app/document-editor";
import { Button } from "@/components/ui/button";
import { CustomerPicker } from "@/components/ui/customer-picker";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Spinner } from "@/components/ui/spinner";
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

export function CreateEstimateForm() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: meta = null, isPending: metaPending } = useQuery(
    trpc.estimates.getFormMeta.queryOptions(),
  );
  const { data: usage, isPending: usagePending } = useQuery(
    trpc.estimates.getUsage.queryOptions(),
  );
  const { data: itemOptions = [], isPending: itemsPending } = useQuery(
    trpc.items.list.queryOptions(),
  );

  const [customerId, setCustomerId] = useState("");
  const [estimateDate, setEstimateDate] = useState(getTodayDateInputValue);
  const [expiryDate, setExpiryDate] = useState(() =>
    addDaysToDateInputValue(getTodayDateInputValue(), 7),
  );
  const [expiryDateTouched, setExpiryDateTouched] = useState(false);
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
    trpc.estimates.create.mutationOptions({
      onSuccess: async (created) => {
        queryClient.invalidateQueries(trpc.estimates.list.queryOptions());
        queryClient.invalidateQueries(trpc.estimates.getUsage.queryOptions());
        queryClient.invalidateQueries(
          trpc.estimates.getFormMeta.queryOptions(),
        );
        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            await uploadFile(file, "estimate", created.id).catch(() => null);
          }
        }
        toast.success("Estimate created.", {
          description: `${created.estimateNumber} is ready in draft status.`,
        });
        router.push(`/app/estimates/${created.id}`);
      },
      onError: (error) =>
        toast.error("Couldn't create estimate.", {
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
    setSummaryTaxRows((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        taxId: "",
      },
    ]);
  }

  function updateTaxId(key: string, taxId: string) {
    setSummaryTaxRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, taxId } : row)),
    );
  }

  function removeTax(key: string) {
    setSummaryTaxRows((prev) => prev.filter((row) => row.key !== key));
  }

  function handleEstimateDateChange(value: string) {
    setEstimateDate(value);

    if (!expiryDateTouched) {
      setExpiryDate(addDaysToDateInputValue(value, 7));
    }
  }

  function handleExpiryDateChange(value: string) {
    setExpiryDate(value);
    setExpiryDateTouched(true);
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
            ? `You reached the estimate limit for your current plan${usage?.limit ? ` (${usage.limit})` : ""}.`
            : "This organization still needs a default currency before you can create estimates."}
        </div>
        <Button type="button" variant="outline" asChild>
          <NextLink href="/app/estimates">Back to estimates</NextLink>
        </Button>
      </div>
    );
  }

  const currency = meta.defaultCurrency;

  return (
    <DocumentEditorLayout
      summary={
        <DocumentSummary
          currency={currency}
          subTotal={subTotal}
          discountValue={discountValue}
          discountType={discountType}
          onDiscountValueChange={setDiscountValue}
          onDiscountTypeChange={setDiscountType}
          taxRows={taxRows}
          taxTypes={meta.taxTypes}
          onAddTax={addTax}
          onTaxChange={updateTaxId}
          onRemoveTax={removeTax}
          grandTotal={grandTotal}
          footer={
            <>
              <Button
                type="button"
                className="w-full"
                loading={create.isPending}
                disabled={
                  create.isPending ||
                  !customerId ||
                  !estimateDate ||
                  validDraftItems.length === 0
                }
                onClick={() =>
                  create.mutate({
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
                Create estimate
              </Button>
              <Button type="button" variant="outline" asChild>
                <NextLink href="/app/estimates">Cancel</NextLink>
              </Button>
            </>
          }
        />
      }
      mobileBar={
        <MobileTotalBar
          total={formatCurrencyDisplay(grandTotal.toFixed(3), currency)}
        >
          <Button type="button" variant="ghost" size="sm" asChild>
            <NextLink href="/app/estimates">Cancel</NextLink>
          </Button>
          <Button
            type="button"
            loading={create.isPending}
            disabled={
              create.isPending ||
              !customerId ||
              !estimateDate ||
              validDraftItems.length === 0
            }
            onClick={() =>
              create.mutate({
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
            Create estimate
          </Button>
        </MobileTotalBar>
      }
    >
      <EditorSection title="Details" description="Who it's for and when.">
        <DocumentDetailsGrid
          customer={
            <CustomerPicker
              id="create-estimate-customer"
              value={customerId}
              onValueChange={setCustomerId}
              required
            />
          }
        >
          <EditorField
            label="Estimate number"
            htmlFor="create-estimate-number"
            className="sm:col-span-2"
          >
            <Input
              id="create-estimate-number"
              value={meta.nextEstimateNumber}
              readOnly
              disabled
            />
          </EditorField>
          <EditorField label="Estimate date" htmlFor="create-estimate-date">
            <Input
              id="create-estimate-date"
              type="date"
              value={estimateDate}
              onChange={(event) => handleEstimateDateChange(event.target.value)}
            />
          </EditorField>
          <EditorField
            label="Expiry date"
            htmlFor="create-estimate-date2"
            hint="Optional"
          >
            <Input
              id="create-estimate-date2"
              type="date"
              value={expiryDate}
              onChange={(event) => handleExpiryDateChange(event.target.value)}
            />
          </EditorField>
        </DocumentDetailsGrid>
      </EditorSection>

      <EditorSection
        title="Items"
        description="Pick items from your catalog. Prices can be adjusted per estimate."
        action={
          <span className="text-xs text-muted-foreground">
            {validDraftItems.length} of {draftItems.length} selected
          </span>
        }
      >
        <LineItemsEditor
          idPrefix="create-estimate"
          items={draftItems}
          currency={currency}
          catalog={itemsById}
          onCatalogItemChange={handleCatalogItemChange}
          onQuantityChange={(id, value) =>
            updateDraftItem(id, (current) => ({ ...current, quantity: value }))
          }
          onPriceChange={(id, value) =>
            updateDraftItem(id, (current) => ({ ...current, unitPrice: value }))
          }
          onAdd={addDraftItem}
          onRemove={removeDraftItem}
        />
      </EditorSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <EditorSection
          title="Notes"
          description="Shown to your client on the estimate."
        >
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            placeholder="Add a note that will travel with this estimate."
          />
        </EditorSection>

        <EditorSection
          title="Attachments"
          description="Files are uploaded when you save the estimate."
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.gif,.webp"
            multiple
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []);
              if (selected.length) {
                setPendingFiles((prev) => [...prev, ...selected]);
              }
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <AttachmentDropzone onClick={() => fileInputRef.current?.click()} />
          <AttachmentList
            entries={pendingFiles.map((file, idx) => ({
              key: String(idx),
              name: file.name,
              size: formatBytes(file.size),
              isImage: file.type.startsWith("image/"),
            }))}
            onRemove={(key) =>
              setPendingFiles((prev) =>
                prev.filter((_, i) => String(i) !== key),
              )
            }
          />
        </EditorSection>
      </div>
    </DocumentEditorLayout>
  );
}

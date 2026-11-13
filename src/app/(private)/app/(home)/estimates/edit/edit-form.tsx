"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { EstimateStatusBadge } from "../estimate-ui";

type DraftItem = {
  id: string;
  itemId: string;
  quantity: string;
  unitPrice: string;
};

/** "2.0000" -> "2", "10.500" -> "10.5" (DB numerics come zero-padded). */
function trimDecimal(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : value;
}

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

  const { data: files = [] } = useQuery({
    ...trpc.estimates.listFiles.queryOptions({ estimateId }),
    enabled: Boolean(estimateId),
  });

  const deleteFile = useMutation(
    trpc.estimates.deleteFile.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.estimates.listFiles.queryOptions({ estimateId }),
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
        await uploadFile(file, "estimate", estimateId);
      }
      queryClient.invalidateQueries(
        trpc.estimates.listFiles.queryOptions({ estimateId }),
      );
      toast.success("File uploaded.");
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const [initializedForId, setInitializedForId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [estimateDate, setEstimateDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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
            quantity: trimDecimal(item.quantity),
            unitPrice: item.price ?? "",
          }))
        : [makeDraftItem()],
    );
    if (estimate.discount) {
      setDiscountValue(trimDecimal(estimate.discount));
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
    <DocumentEditorLayout
      summary={
        <DocumentSummary
          currency={displayCurrency}
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
                      quantity: trimDecimal(item.quantity),
                      unitPrice: item.unitPrice || "0",
                    })),
                    discount: discountValue || null,
                    discountFixed: discountType === "fixed",
                    taxIds: summaryTaxRows.map((r) => r.taxId).filter(Boolean),
                  })
                }
              >
                Save changes
              </Button>
              <Button type="button" variant="outline" asChild>
                <NextLink href={`/app/estimates/${estimate.id}`}>
                  Cancel
                </NextLink>
              </Button>
            </>
          }
        />
      }
      mobileBar={
        <MobileTotalBar
          total={formatCurrencyDisplay(grandTotal.toFixed(3), displayCurrency)}
        >
          <Button type="button" variant="ghost" size="sm" asChild>
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
                  quantity: trimDecimal(item.quantity),
                  unitPrice: item.unitPrice || "0",
                })),
                discount: discountValue || null,
                discountFixed: discountType === "fixed",
                taxIds: summaryTaxRows.map((r) => r.taxId).filter(Boolean),
              })
            }
          >
            Save changes
          </Button>
        </MobileTotalBar>
      }
    >
      <EditorSection
        title="Details"
        description="Who it's for and when."
        action={<EstimateStatusBadge status={estimate.status} />}
      >
        <DocumentDetailsGrid
          customer={
            <CustomerPicker
              id="edit-estimate-customer"
              value={customerId}
              onValueChange={setCustomerId}
              required
            />
          }
        >
          <EditorField
            label="Estimate number"
            htmlFor="edit-estimate-number"
            className="sm:col-span-2"
          >
            <Input
              id="edit-estimate-number"
              value={estimate.estimateNumber}
              readOnly
              disabled
            />
          </EditorField>
          <EditorField label="Estimate date" htmlFor="edit-estimate-date">
            <Input
              id="edit-estimate-date"
              type="date"
              value={estimateDate}
              onChange={(event) => setEstimateDate(event.target.value)}
            />
          </EditorField>
          <EditorField
            label="Expiry date"
            htmlFor="edit-estimate-date2"
            hint="Optional"
          >
            <Input
              id="edit-estimate-date2"
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
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
          idPrefix="edit-estimate"
          items={draftItems}
          currency={displayCurrency}
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

        <EditorSection title="Attachments">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.gif,.webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
          <AttachmentDropzone
            onClick={() => fileInputRef.current?.click()}
            uploading={uploading}
          />
          <AttachmentList
            entries={files.map((file) => ({
              key: file.id,
              name: file.fileName,
              size: formatBytes(file.fileSize),
              isImage: file.mimeType.startsWith("image/"),
              href: file.storageKey,
            }))}
            onRemove={(fileId) => deleteFile.mutate({ fileId })}
            removing={deleteFile.isPending}
          />
        </EditorSection>
      </div>
    </DocumentEditorLayout>
  );
}

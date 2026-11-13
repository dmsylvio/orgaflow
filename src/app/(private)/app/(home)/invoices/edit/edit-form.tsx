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
import { InvoiceStatusBadge } from "../invoice-ui";

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

  const { data: files = [] } = useQuery({
    ...trpc.invoices.listFiles.queryOptions({ invoiceId }),
    enabled: Boolean(invoiceId),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const deleteFile = useMutation(
    trpc.invoices.deleteFile.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.invoices.listFiles.queryOptions({ invoiceId }),
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
        await uploadFile(file, "invoice", invoiceId);
      }
      queryClient.invalidateQueries(
        trpc.invoices.listFiles.queryOptions({ invoiceId }),
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
            quantity: trimDecimal(item.quantity),
            unitPrice: item.price ?? "",
          }))
        : [makeDraftItem()],
    );
    if (invoice.discount) {
      setDiscountValue(trimDecimal(invoice.discount));
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
                <NextLink href={`/app/invoices/${invoice.id}`}>Cancel</NextLink>
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
        action={<InvoiceStatusBadge status={invoice.status} />}
      >
        <DocumentDetailsGrid
          customer={
            <CustomerPicker
              id="edit-invoice-customer"
              value={customerId}
              onValueChange={setCustomerId}
              required
            />
          }
        >
          <EditorField
            label="Invoice number"
            htmlFor="edit-invoice-number"
            className="sm:col-span-2"
          >
            <Input
              id="edit-invoice-number"
              value={invoice.invoiceNumber}
              readOnly
              disabled
            />
          </EditorField>
          <EditorField label="Invoice date" htmlFor="edit-invoice-date">
            <Input
              id="edit-invoice-date"
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
            />
          </EditorField>
          <EditorField
            label="Due date"
            htmlFor="edit-invoice-date2"
            hint="Optional"
          >
            <Input
              id="edit-invoice-date2"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </EditorField>
        </DocumentDetailsGrid>
      </EditorSection>

      <EditorSection
        title="Items"
        description="Pick items from your catalog. Prices can be adjusted per invoice."
        action={
          <span className="text-xs text-muted-foreground">
            {validDraftItems.length} of {draftItems.length} selected
          </span>
        }
      >
        <LineItemsEditor
          idPrefix="edit-invoice"
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
          description="Shown to your client on the invoice."
        >
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            placeholder="Add a note that will travel with this invoice."
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

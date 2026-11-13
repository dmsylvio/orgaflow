"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  FileText,
  Paperclip,
  Pencil,
  Trash2,
} from "lucide-react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { AttachmentDropzone } from "@/components/app/document-editor";
import {
  DocumentSummaryCard,
  DocumentView,
} from "@/components/app/document-view";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCanViewPrices } from "@/hooks/use-can-view-prices";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";
import { formatBytes, uploadFile } from "../../expenses/edit-dialog";
import {
  formatInvoiceDate,
  InvoiceStatusBadge,
  PageShell,
} from "../invoice-ui";

function InvoiceFilesSection({ invoiceId }: { invoiceId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const filesQuery = useQuery(
    trpc.invoices.listFiles.queryOptions({ invoiceId }),
  );

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
      await queryClient.invalidateQueries(
        trpc.invoices.listFiles.queryOptions({ invoiceId }),
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
    <section className="app-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-foreground">
          Attachments
        </h2>
        <span className="text-xs text-muted-foreground">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
      </header>

      <div className="space-y-3 px-5 py-4">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".png,.jpg,.jpeg,.gif,.webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        <AttachmentDropzone
          onClick={() => inputRef.current?.click()}
          uploading={uploading}
        />

        {filesQuery.isLoading && (
          <div className="flex justify-center py-2">
            <Spinner className="h-4 w-4 text-primary" />
          </div>
        )}

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
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
    </section>
  );
}

export default function InvoiceDetailPage() {
  const trpc = useTRPC();
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;
  const { invoice: canViewPrices } = useCanViewPrices();

  const { data: invoice, isPending } = useQuery({
    ...trpc.invoices.getById.queryOptions({ id: invoiceId }),
    enabled: Boolean(invoiceId),
  });

  if (isPending || !invoice) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center py-24">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <PageShell
      title={invoice.invoiceNumber}
      description={`Invoice for ${invoice.customer.displayName}`}
      actions={
        <Button type="button" variant="outline" size="sm" asChild>
          <NextLink href="/app/invoices">
            <ArrowLeft className="h-4 w-4" />
            All invoices
          </NextLink>
        </Button>
      }
    >
      <DocumentView
        kindLabel="Invoice"
        number={invoice.invoiceNumber}
        status={<InvoiceStatusBadge status={invoice.status} />}
        customer={{
          name: invoice.customer.displayName,
          email: invoice.customer.email,
        }}
        dates={[
          ["Invoice date", formatInvoiceDate(invoice.invoiceDate) ?? "Not set"],
          ["Due date", formatInvoiceDate(invoice.dueDate) ?? "No due date"],
        ]}
        items={invoice.items}
        currency={invoice.currency}
        canViewPrices={canViewPrices}
        totals={{
          subTotal: invoice.subTotal,
          tax: invoice.tax,
          total: invoice.total,
        }}
        notes={invoice.notes}
        attachments={<InvoiceFilesSection invoiceId={invoiceId} />}
        summary={
          <DocumentSummaryCard
            total={
              canViewPrices
                ? formatCurrencyDisplay(invoice.total ?? "", invoice.currency)
                : null
            }
            facts={[
              [
                "Status",
                <InvoiceStatusBadge key="s" status={invoice.status} />,
              ],
              ["Due", formatInvoiceDate(invoice.dueDate) ?? "No due date"],
              ["Items", String(invoice.items.length)],
            ]}
            actions={
              <>
                <Button type="button" asChild className="w-full">
                  <NextLink href={`/app/invoices/edit?id=${invoice.id}`}>
                    <Pencil className="h-4 w-4" />
                    Edit invoice
                  </NextLink>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <a href={`/api/pdf/invoice/${invoice.id}`} download>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              </>
            }
          />
        }
      />
    </PageShell>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Paperclip, Pencil, Trash2, Upload } from "lucide-react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Attachments</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".png,.jpg,.jpeg,.gif,.webp"
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
              {uploading ? "Uploading…" : "Upload Attachment"}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF, WebP — max 25 MB
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
                className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
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
    </div>
  );
}

export default function InvoiceDetailPage() {
  const trpc = useTRPC();
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;

  const { data: invoice, isPending } = useQuery({
    ...trpc.invoices.getById.queryOptions({ id: invoiceId }),
    enabled: Boolean(invoiceId),
  });

  if (isPending || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <PageShell
      title={invoice.invoiceNumber}
      description="Review invoice details, totals, notes, and line items."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <InvoiceStatusBadge status={invoice.status} />
            <span className="text-sm text-muted-foreground">
              {invoice.customer.displayName}
            </span>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <NextLink href="/app/invoices">
                <ArrowLeft className="h-4 w-4" />
                Back
              </NextLink>
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href={`/api/pdf/invoice/${invoice.id}`} download>
                <Download className="h-4 w-4" />
                PDF
              </a>
            </Button>
            <Button type="button" asChild>
              <NextLink href={`/app/invoices/edit?id=${invoice.id}`}>
                <Pencil className="h-4 w-4" />
                Edit
              </NextLink>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Invoice date
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatInvoiceDate(invoice.invoiceDate)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Due date
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatInvoiceDate(invoice.dueDate) ?? "No due date"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Subtotal
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatCurrencyDisplay(invoice.subTotal, invoice.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Total
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatCurrencyDisplay(invoice.total, invoice.currency)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Line items
            </h2>
            <p className="text-sm text-muted-foreground">
              {invoice.items.length} item{invoice.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {invoice.items.map((item) => (
              <div key={item.id} className="rounded-xl bg-muted/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrencyDisplay(item.total, invoice.currency)}
                  </p>
                </div>

                <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    Qty:{" "}
                    <span className="text-foreground">{item.quantity}</span>
                  </div>
                  <div>
                    Unit price:{" "}
                    <span className="text-foreground">
                      {formatCurrencyDisplay(item.price, invoice.currency)}
                    </span>
                  </div>
                  <div>
                    Unit:{" "}
                    <span className="text-foreground">
                      {item.unitName ?? "No unit"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {invoice.items.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              This invoice has no line items.
            </p>
          ) : null}

          <Separator className="my-5" />

          <div className="ml-auto max-w-sm space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrencyDisplay(invoice.subTotal, invoice.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Tax</span>
              <span className="font-medium text-foreground">
                {formatCurrencyDisplay(invoice.tax, invoice.currency)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrencyDisplay(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {invoice.notes}
            </p>
          </div>
        ) : null}

        <InvoiceFilesSection invoiceId={invoiceId} />
      </div>
    </PageShell>
  );
}

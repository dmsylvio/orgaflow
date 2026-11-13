"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
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
  EstimateStatusBadge,
  formatEstimateDate,
  PageShell,
} from "../estimate-ui";

function EstimateFilesSection({ estimateId }: { estimateId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const filesQuery = useQuery(
    trpc.estimates.listFiles.queryOptions({ estimateId }),
  );

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

  const toggleVisibility = useMutation(
    trpc.estimates.toggleFileVisibility.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.estimates.listFiles.queryOptions({ estimateId }),
        ),
      onError: (e) =>
        toast.error("Couldn't update visibility", { description: e.message }),
    }),
  );

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        await uploadFile(file, "estimate", estimateId);
      }
      await queryClient.invalidateQueries(
        trpc.estimates.listFiles.queryOptions({ estimateId }),
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

                {/* Toggle visibilidade pública */}
                <button
                  type="button"
                  title={
                    file.isPublic
                      ? "Visible to client — click to hide"
                      : "Hidden from client — click to show"
                  }
                  disabled={toggleVisibility.isPending}
                  onClick={() =>
                    toggleVisibility.mutate({
                      fileId: file.id,
                      isPublic: !file.isPublic,
                    })
                  }
                  className="shrink-0 rounded p-0.5 transition-colors disabled:opacity-40"
                >
                  {file.isPublic ? (
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={deleteFile.isPending}
                  onClick={() => deleteFile.mutate({ fileId: file.id })}
                  className="shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            <Eye className="mr-1 inline h-3 w-3 text-primary" />
            Visible files are shown on the public estimate link.
          </p>
        )}
      </div>
    </section>
  );
}

export default function EstimateDetailPage() {
  const trpc = useTRPC();
  const params = useParams<{ id: string }>();
  const estimateId = params.id;
  const { estimate: canViewPrices } = useCanViewPrices();

  const { data: estimate, isPending } = useQuery({
    ...trpc.estimates.getById.queryOptions({ id: estimateId }),
    enabled: Boolean(estimateId),
  });

  if (isPending || !estimate) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <PageShell
      title={estimate.estimateNumber}
      description={`Estimate for ${estimate.customer.displayName}`}
      actions={
        <Button type="button" variant="outline" size="sm" asChild>
          <NextLink href="/app/estimates">
            <ArrowLeft className="h-4 w-4" />
            All estimates
          </NextLink>
        </Button>
      }
    >
      <DocumentView
        kindLabel="Estimate"
        number={estimate.estimateNumber}
        status={<EstimateStatusBadge status={estimate.status} />}
        customer={{
          name: estimate.customer.displayName,
          email: estimate.customer.email,
        }}
        dates={[
          [
            "Estimate date",
            formatEstimateDate(estimate.estimateDate) ?? "Not set",
          ],
          [
            "Expiry date",
            formatEstimateDate(estimate.expiryDate) ?? "No expiry",
          ],
        ]}
        items={estimate.items}
        currency={estimate.currency}
        canViewPrices={canViewPrices}
        totals={{
          subTotal: estimate.subTotal,
          tax: estimate.tax,
          total: estimate.total,
        }}
        notes={estimate.notes}
        attachments={<EstimateFilesSection estimateId={estimateId} />}
        summary={
          <DocumentSummaryCard
            total={
              canViewPrices
                ? formatCurrencyDisplay(estimate.total ?? "", estimate.currency)
                : null
            }
            facts={[
              [
                "Status",
                <EstimateStatusBadge key="s" status={estimate.status} />,
              ],
              [
                "Expires",
                formatEstimateDate(estimate.expiryDate) ?? "No expiry",
              ],
              ["Items", String(estimate.items.length)],
            ]}
            actions={
              <>
                <Button type="button" asChild className="w-full">
                  <NextLink href={`/app/estimates/edit?id=${estimate.id}`}>
                    <Pencil className="h-4 w-4" />
                    Edit estimate
                  </NextLink>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <a href={`/api/pdf/estimate/${estimate.id}`} download>
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

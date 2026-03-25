"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RichTextContent,
  RichTextEditor,
} from "@/components/ui/rich-text-editor";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "No expiration";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Quantities are stored with fixed decimals; trim trailing zeros for display. */
function formatQuantityDisplay(quantity: string): string {
  const s = quantity.trim();
  if (!s) return s;
  if (!s.includes(".")) return s;
  const trimmed = s.replace(/0+$/, "").replace(/\.$/, "");
  return trimmed.length > 0 ? trimmed : "0";
}

// ---------------------------------------------------------------------------
// Attachment carousel
// ---------------------------------------------------------------------------

type FileItem = {
  id: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
};

function AttachmentCarousel({ files }: { files: FileItem[] }) {
  const [index, setIndex] = useState(0);
  if (files.length === 0) return null;

  const file = files[index];
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Attachments</h2>
        <span className="text-xs text-muted-foreground">
          {index + 1} / {files.length}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/30">
        {isImage ? (
          // biome-ignore lint/performance/noImgElement: public user-uploaded image
          <img
            src={file.storageKey}
            alt={file.fileName}
            className="max-h-96 w-full object-contain"
          />
        ) : isPdf ? (
          <iframe
            src={file.storageKey}
            title={file.fileName}
            className="h-96 w-full"
          />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileText className="h-10 w-10" />
            <p className="text-sm">{file.fileName}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <a
          href={file.storageKey}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate text-sm text-foreground underline-offset-2 hover:underline"
        >
          {file.fileName}
        </a>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatBytes(file.fileSize)}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={index === files.length - 1}
            onClick={() => setIndex((i) => i + 1)}
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject modal
// ---------------------------------------------------------------------------

function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reject Estimate</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground">
            Please let us know why you are rejecting this estimate (optional).
          </p>
          <RichTextEditor
            value={reason}
            onChange={setReason}
            placeholder="Reason for rejection…"
            className="mt-3 w-full"
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            disabled={isPending}
            onClick={() => onConfirm(reason)}
          >
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function EstimatePublicScreen({ token }: { token: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data, isPending } = useQuery(
    trpc.estimates.getPublicByToken.queryOptions(token),
  );

  const approve = useMutation(
    trpc.estimates.approvePublic.mutationOptions({
      onSuccess: () => {
        toast.success("Estimate approved. Thank you!");
        queryClient.invalidateQueries(
          trpc.estimates.getPublicByToken.queryOptions(token),
        );
      },
      onError: (e) =>
        toast.error("Could not approve estimate", { description: e.message }),
    }),
  );

  const reject = useMutation(
    trpc.estimates.rejectPublic.mutationOptions({
      onSuccess: () => {
        setRejectOpen(false);
        toast.success("Estimate rejected.");
        queryClient.invalidateQueries(
          trpc.estimates.getPublicByToken.queryOptions(token),
        );
      },
      onError: (e) =>
        toast.error("Could not reject estimate", { description: e.message }),
    }),
  );

  if (isPending || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4">
        <Spinner className="size-5 text-primary" label="Loading estimate" />
      </div>
    );
  }

  if (data.status === "invalid") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
        <Card className="w-full max-w-xl shadow-md">
          <CardHeader className="space-y-3">
            <Badge variant="soft" className="w-fit gap-1.5">
              <TriangleAlert className="h-3.5 w-3.5" />
              Invalid link
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Estimate link not found
              </CardTitle>
              <CardDescription>
                This estimate link is invalid or has been disabled. Ask the
                sender for a new link.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (data.status === "expired") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
        <Card className="w-full max-w-xl shadow-md">
          <CardHeader className="space-y-3">
            <Badge variant="destructive" className="w-fit gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Link expired
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                This estimate link has expired
              </CardTitle>
              <CardDescription>
                It expired on {formatDateTime(data.expiresAt)}. Ask the sender
                to resend the estimate.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { estimate, expiresAt } = data;
  const canDecide = estimate.status === "SENT" || estimate.status === "VIEWED";

  return (
    <div className="min-h-dvh bg-muted/20 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="shadow-md">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="soft" className="w-fit gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Estimate
              </Badge>

              <div className="text-xs text-muted-foreground">
                {expiresAt ? (
                  <>Link expires {formatDateTime(expiresAt)}</>
                ) : (
                  <span>No link expiration</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {estimate.estimateNumber}
              </CardTitle>
              <CardDescription>{estimate.organization.name}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Already decided banner */}
            {estimate.status === "APPROVED" && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  You approved this estimate.
                </p>
              </div>
            )}

            {estimate.status === "REJECTED" && (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    You rejected this estimate.
                  </p>
                </div>
                {estimate.rejectionReason ? (
                  <div className="space-y-1 pl-8 text-sm text-red-700 dark:text-red-400">
                    <p className="font-medium">Reason</p>
                    <RichTextContent
                      html={estimate.rejectionReason}
                      className="text-red-700 dark:text-red-400 prose-headings:text-red-800 prose-headings:dark:text-red-300"
                    />
                  </div>
                ) : null}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Estimate date
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(estimate.estimateDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Expiry
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(estimate.expiryDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Subtotal
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatCurrencyDisplay(estimate.subTotal, estimate.currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Total
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatCurrencyDisplay(estimate.total, estimate.currency)}
                </p>
              </div>
            </div>

            {/* Attachments carousel */}
            {estimate.files.length > 0 && (
              <AttachmentCarousel files={estimate.files} />
            )}

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Line items
                </h2>
                <p className="text-sm text-muted-foreground">
                  {estimate.items.length} item
                  {estimate.items.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {estimate.items.map((item) => (
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
                        {formatCurrencyDisplay(item.total, estimate.currency)}
                      </p>
                    </div>

                    <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                      <div>
                        Qty:{" "}
                        <span className="text-foreground">
                          {formatQuantityDisplay(item.quantity)}
                        </span>
                      </div>
                      <div>
                        Unit price:{" "}
                        <span className="text-foreground">
                          {formatCurrencyDisplay(item.price, estimate.currency)}
                        </span>
                      </div>
                      <div>
                        Unit:{" "}
                        <span className="text-foreground">
                          {item.unitName ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {estimate.items.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  This estimate has no line items.
                </p>
              ) : null}

              <Separator className="my-5" />

              <div className="ml-auto max-w-sm space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">
                    {formatCurrencyDisplay(
                      estimate.subTotal,
                      estimate.currency,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-medium text-foreground">
                    {formatCurrencyDisplay(estimate.tax, estimate.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrencyDisplay(estimate.total, estimate.currency)}
                  </span>
                </div>
              </div>
            </div>

            {estimate.notes ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {estimate.notes}
                </p>
              </div>
            ) : null}

            {/* Approve / Reject actions */}
            {canDecide && (
              <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={approve.isPending || reject.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => approve.mutate(token)}
                  loading={approve.isPending}
                  disabled={approve.isPending || reject.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link
            className="text-primary underline"
            target="_blank"
            href="https://orgaflow.dev"
          >
            Orgaflow
          </Link>{" "}
          platform.
        </p>
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        isPending={reject.isPending}
        onConfirm={(reason) => reject.mutate({ token, reason })}
      />
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  ImageIcon,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatQuantityDisplay(quantity: string): string {
  const s = quantity.trim();
  if (!s || !s.includes(".")) return s;
  const trimmed = s.replace(/0+$/, "").replace(/\.$/, "");
  return trimmed.length > 0 ? trimmed : "0";
}

// ---------------------------------------------------------------------------
// File grid
// ---------------------------------------------------------------------------

type FileItem = {
  id: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
};

function FileCard({ file }: { file: FileItem }) {
  const isImage = file.mimeType.startsWith("image/");

  return (
    <a
      href={file.storageKey}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md"
    >
      {/* Preview area */}
      <div className="flex h-36 items-center justify-center overflow-hidden bg-muted/40">
        {isImage ? (
          // biome-ignore lint/performance/noImgElement: public user-uploaded image
          <img
            src={file.storageKey}
            alt={file.fileName}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
            {file.mimeType === "application/pdf" ? (
              <FileText className="h-10 w-10" />
            ) : (
              <ImageIcon className="h-10 w-10" />
            )}
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {file.fileName}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatBytes(file.fileSize)}
          </p>
        </div>
        <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
      </div>
    </a>
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
            This message will be sent back to the sender.
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
// Error / state screens
// ---------------------------------------------------------------------------

function StateScreen({
  icon: Icon,
  iconClass,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
          <Icon className={`h-7 w-7 ${iconClass}`} />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="mt-8 text-xs text-muted-foreground/50">
          Powered by{" "}
          <Link
            className="text-primary underline underline-offset-2"
            target="_blank"
            href="https://orgaflow.dev"
          >
            Orgaflow
          </Link>
        </p>
      </div>
    </div>
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
      <StateScreen
        icon={TriangleAlert}
        iconClass="text-amber-500"
        title="Estimate link not found"
        description="This estimate link is invalid or has been disabled. Ask the sender for a new link."
      />
    );
  }

  if (data.status === "expired") {
    return (
      <StateScreen
        icon={CalendarClock}
        iconClass="text-rose-500"
        title="This link has expired"
        description={`It expired on ${formatDateTime(data.expiresAt)}. Ask the sender to resend the estimate.`}
      />
    );
  }

  const { estimate, expiresAt } = data;
  const canDecide = estimate.status === "SENT" || estimate.status === "VIEWED";

  return (
    <>
      {/* Page — add bottom padding when sticky bar is shown */}
      <div
        className={`min-h-dvh bg-muted/20 px-4 py-10 ${canDecide ? "pb-36" : ""}`}
      >
        <div className="mx-auto w-full max-w-3xl space-y-5">

          {/* ── Header ────────────────────────────────────────── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Estimate
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {estimate.estimateNumber}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {estimate.organization.name}
              </p>
            </div>
            {expiresAt && (
              <p className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                Link expires {formatDateTime(expiresAt)}
              </p>
            )}
          </div>

          {/* ── Decision banners ──────────────────────────────── */}
          {estimate.status === "APPROVED" && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  You approved this estimate
                </p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                  The sender has been notified of your approval.
                </p>
              </div>
            </div>
          )}

          {estimate.status === "REJECTED" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 dark:border-rose-900 dark:bg-rose-950/50">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                    You rejected this estimate
                  </p>
                  <p className="text-xs text-rose-700/80 dark:text-rose-400/80">
                    The sender has been notified.
                  </p>
                </div>
              </div>
              {estimate.rejectionReason && (
                <div className="ml-8 mt-3 rounded-xl border border-rose-200/60 bg-rose-100/50 px-4 py-3 dark:border-rose-800 dark:bg-rose-900/30">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                    Your reason
                  </p>
                  <RichTextContent
                    html={estimate.rejectionReason}
                    className="text-sm text-rose-800 dark:text-rose-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Summary cards ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Date
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {formatDate(estimate.estimateDate)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Expires
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {formatDate(estimate.expiryDate)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Subtotal
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {formatCurrencyDisplay(estimate.subTotal, estimate.currency)}
              </p>
            </div>
            {/* Total — highlighted */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                Total
              </p>
              <p className="mt-1.5 text-base font-bold text-primary">
                {formatCurrencyDisplay(estimate.total, estimate.currency)}
              </p>
            </div>
          </div>

          {/* ── Attachments ───────────────────────────────────── */}
          {estimate.files.length > 0 && (
            <div className="rounded-2xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Attachments
                </h2>
                <span className="text-xs text-muted-foreground">
                  {estimate.files.length} file
                  {estimate.files.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {estimate.files.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            </div>
          )}

          {/* ── Line items ────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-background">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border px-5 py-3 sm:grid-cols-[1fr_80px_100px_100px]">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Item
              </p>
              <p className="hidden text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 sm:block">
                Qty
              </p>
              <p className="hidden text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 sm:block">
                Unit price
              </p>
              <p className="text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Total
              </p>
            </div>

            {estimate.items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No line items.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {estimate.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 sm:grid-cols-[1fr_80px_100px_100px]"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      {/* Mobile: show qty + price inline */}
                      <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                        {formatQuantityDisplay(item.quantity)}
                        {item.unitName ? ` ${item.unitName}` : ""} ×{" "}
                        {formatCurrencyDisplay(item.price, estimate.currency)}
                      </p>
                    </div>
                    <p className="hidden self-center text-right text-sm text-muted-foreground sm:block">
                      {formatQuantityDisplay(item.quantity)}
                      {item.unitName && (
                        <span className="ml-1 text-xs text-muted-foreground/60">
                          {item.unitName}
                        </span>
                      )}
                    </p>
                    <p className="hidden self-center text-right text-sm text-muted-foreground sm:block">
                      {formatCurrencyDisplay(item.price, estimate.currency)}
                    </p>
                    <p className="self-center text-right text-sm font-semibold text-foreground">
                      {formatCurrencyDisplay(item.total, estimate.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-border px-5 py-4">
              <div className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">
                    {formatCurrencyDisplay(estimate.subTotal, estimate.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-medium text-foreground">
                    {formatCurrencyDisplay(estimate.tax, estimate.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span className="text-base text-primary">
                    {formatCurrencyDisplay(estimate.total, estimate.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notes ─────────────────────────────────────────── */}
          {estimate.notes && (
            <div className="rounded-2xl border border-border bg-background px-5 py-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Notes
              </h2>
              <RichTextContent
                html={estimate.notes}
                className="text-sm text-muted-foreground"
              />
            </div>
          )}

          {/* ── Footer ────────────────────────────────────────── */}
          <p className="pb-2 text-center text-xs text-muted-foreground/50">
            Powered by{" "}
            <Link
              className="text-primary/70 underline underline-offset-2 hover:text-primary"
              target="_blank"
              href="https://orgaflow.dev"
            >
              Orgaflow
            </Link>
          </p>
        </div>
      </div>

      {/* ── Sticky action bar ─────────────────────────────────── */}
      {canDecide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 text-center">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Ready to respond?
              </p>
              <p className="text-xs text-muted-foreground">
                Approve to proceed, or reject with a reason.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRejectOpen(true)}
                disabled={approve.isPending || reject.isPending}
                className="gap-2"
              >
                <XCircle className="h-4 w-4 text-rose-500" />
                Reject
              </Button>
              <Button
                onClick={() => approve.mutate(token)}
                loading={approve.isPending}
                disabled={approve.isPending || reject.isPending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Estimate
              </Button>
            </div>
          </div>
        </div>
      )}

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        isPending={reject.isPending}
        onConfirm={(reason) => reject.mutate({ token, reason })}
      />
    </>
  );
}

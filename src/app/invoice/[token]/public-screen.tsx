"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Download, FileText, ImageIcon, Receipt, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import { useTRPC } from "@/trpc/client";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
      <div className="flex h-32 items-center justify-center overflow-hidden bg-muted/40">
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
              <FileText className="h-9 w-9" />
            ) : (
              <ImageIcon className="h-9 w-9" />
            )}
          </div>
        )}
      </div>
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

export function InvoicePublicScreen({ token }: { token: string }) {
  const trpc = useTRPC();

  const { data, isPending } = useQuery(
    trpc.invoices.getPublicByToken.queryOptions(token),
  );

  if (isPending || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4">
        <Spinner className="size-5 text-primary" label="Loading invoice" />
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
                Invoice link not found
              </CardTitle>
              <CardDescription>
                This invoice link is invalid or has been disabled. Ask the
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
                This invoice link has expired
              </CardTitle>
              <CardDescription>
                It expired on {formatDateTime(data.expiresAt)}. Ask the sender
                to resend the invoice.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { invoice, expiresAt } = data;

  return (
    <div className="min-h-dvh bg-muted/20 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="shadow-md">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="soft" className="w-fit gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Invoice
              </Badge>

              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  {expiresAt ? (
                    <>Link expires {formatDateTime(expiresAt)}</>
                  ) : (
                    <>No link expiration</>
                  )}
                </div>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a
                    href={`/api/pdf/invoice/public/${token}`}
                    download={`${invoice.invoiceNumber}.pdf`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {invoice.invoiceNumber}
              </CardTitle>
              <CardDescription>{invoice.organization.name}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Invoice date
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(invoice.invoiceDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Due date
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(invoice.dueDate)}
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
                  {invoice.items.length} item
                  {invoice.items.length !== 1 ? "s" : ""}
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
                          {item.unitName ?? "—"}
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

            {invoice.files && invoice.files.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Attachments
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {invoice.files.length} file
                    {invoice.files.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {invoice.files.map((file) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              </div>
            ) : null}

            {invoice.notes ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {invoice.notes}
                </p>
              </div>
            ) : null}
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
    </div>
  );
}

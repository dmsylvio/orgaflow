"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, RefreshCw } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";
import type { RecurringFrequency } from "@/schemas/recurring-invoice";
import {
  formatNextRun,
  FrequencyLabel,
  PageShell,
  type RecurringStatus,
  RecurringStatusBadge,
} from "./recurring-invoice-ui";

type TemplateRecord = {
  id: string;
  name: string;
  frequency: RecurringFrequency;
  status: RecurringStatus;
  nextRunAt: Date;
  generatedCount: number;
  sendAutomatically: boolean;
  subTotal: string;
  total: string;
  createdAt: Date;
  customer: { id: string; displayName: string };
  currency: NonNullable<CurrencyFormat>;
  itemCount: number;
};

function ActionsDropdown({
  template,
  onSetStatus,
  onDelete,
  isDeleting,
  isUpdatingStatus,
}: {
  template: TemplateRecord;
  onSetStatus: (status: "active" | "on_hold") => void;
  onDelete: () => void;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
}) {
  const isCompleted = template.status === "completed";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={isDeleting || isUpdatingStatus}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <NextLink href={`/app/recurring-invoices/${template.id}/edit`}>
            Edit
          </NextLink>
        </DropdownMenuItem>
        {!isCompleted && (
          <>
            {template.status === "active" ? (
              <DropdownMenuItem
                onSelect={() => onSetStatus("on_hold")}
                disabled={isUpdatingStatus}
              >
                Pause
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => onSetStatus("active")}
                disabled={isUpdatingStatus}
              >
                Resume
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onDelete}
          disabled={isDeleting}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function RecurringInvoicesClientPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: templates = [], isPending } = useQuery(
    trpc.recurringInvoices.list.queryOptions(),
  );
  const { data: meta = null } = useQuery(
    trpc.recurringInvoices.getFormMeta.queryOptions(),
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const deleteTemplate = useMutation(
    trpc.recurringInvoices.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.recurringInvoices.list.queryOptions(),
        );
        toast.success("Recurring invoice deleted.");
        setDeletingId(null);
      },
      onError: (error) => {
        toast.error("Couldn't delete recurring invoice.", {
          description: error.message,
        });
        setDeletingId(null);
      },
    }),
  );

  const setStatus = useMutation(
    trpc.recurringInvoices.setStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.recurringInvoices.list.queryOptions(),
        );
        setUpdatingStatusId(null);
      },
      onError: (error) => {
        toast.error("Couldn't update status.", { description: error.message });
        setUpdatingStatusId(null);
      },
    }),
  );

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const hasDependencies = Boolean(meta?.defaultCurrency);
  const activeCount = templates.filter((t) => t.status === "active").length;
  const pausedCount = templates.filter((t) => t.status === "on_hold").length;
  const completedCount = templates.filter((t) => t.status === "completed").length;

  return (
    <PageShell
      title="Recurring Invoices"
      description="Automatically generate invoices on a recurring schedule."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Active
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {activeCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Paused
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {pausedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Completed
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {completedCount}
              </p>
            </div>
          </div>

          {hasDependencies ? (
            <Button type="button" asChild>
              <NextLink href="/app/recurring-invoices/create">
                <Plus className="h-4 w-4" />
                New Recurring Invoice
              </NextLink>
            </Button>
          ) : (
            <Button type="button" disabled>
              <Plus className="h-4 w-4" />
              New Recurring Invoice
            </Button>
          )}
        </div>

        {!hasDependencies ? (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Set a default currency in Settings before creating recurring invoices.
          </div>
        ) : null}

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 py-16 text-center">
            <RefreshCw className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No recurring invoices yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a recurring invoice to automate your billing.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 pl-4 pr-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Name
                  </th>
                  <th className="px-2 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-2 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-2 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Frequency
                  </th>
                  <th className="px-2 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next Run
                  </th>
                  <th className="px-2 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Generated
                  </th>
                  <th className="px-2 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total
                  </th>
                  <th className="py-3 pl-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr
                    key={template.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pl-4 pr-2 align-top">
                      <NextLink
                        href={`/app/recurring-invoices/${template.id}/edit`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {template.name}
                      </NextLink>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <RecurringStatusBadge status={template.status} />
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">
                          {template.customer.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {template.itemCount} item
                          {template.itemCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top text-sm text-foreground">
                      <FrequencyLabel frequency={template.frequency} />
                    </td>
                    <td className="px-2 py-3 align-top text-sm text-foreground">
                      {template.status === "completed"
                        ? "—"
                        : formatNextRun(template.nextRunAt)}
                    </td>
                    <td className="px-2 py-3 align-top text-sm text-foreground">
                      {template.generatedCount}
                    </td>
                    <td className="px-2 py-3 align-top text-sm font-medium text-foreground">
                      {formatCurrencyDisplay(template.total, template.currency)}
                    </td>
                    <td className="py-3 pl-2 pr-4 align-top">
                      <div className="flex justify-end">
                        <ActionsDropdown
                          template={template}
                          isDeleting={deletingId === template.id}
                          isUpdatingStatus={updatingStatusId === template.id}
                          onSetStatus={(status) => {
                            setUpdatingStatusId(template.id);
                            setStatus.mutate({ id: template.id, status });
                          }}
                          onDelete={() => {
                            setDeletingId(template.id);
                            deleteTemplate.mutate({ id: template.id });
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}

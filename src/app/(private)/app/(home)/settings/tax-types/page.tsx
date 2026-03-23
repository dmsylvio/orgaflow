"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="mb-8" />
      {children}
    </div>
  );
}

type TaxType = {
  id: string;
  name: string;
  percent: string;
  compoundTax: boolean;
};

function TaxRow({
  tax,
  onDelete,
  isDeletePending,
}: {
  tax: TaxType;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}) {
  return (
    <tr className="group border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-2">
        <span className="text-sm font-medium text-foreground">{tax.name}</span>
      </td>
      <td className="py-3 px-2 text-center">
        {tax.compoundTax ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Yes
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        )}
      </td>
      <td className="py-3 px-2 text-right">
        <span className="text-sm text-foreground">{tax.percent}%</span>
      </td>
      <td className="py-3 pl-2 pr-4">
        <div className="flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Delete"
            disabled={isDeletePending}
            onClick={() => onDelete(tax.id)}
            className={cn(
              "rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-destructive",
              isDeletePending && "opacity-40",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddTaxRow({
  onAdd,
  onCancel,
  isPending,
}: {
  onAdd: (data: {
    name: string;
    percent: number;
    compoundTax: boolean;
  }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("");
  const [compoundTax, setCompoundTax] = useState(false);

  const canSubmit = name.trim().length > 0 && percent.trim().length > 0;

  return (
    <tr className="border-t border-border bg-muted/30">
      <td className="py-2 pl-4 pr-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. VAT"
          className="h-8 text-sm"
          autoFocus
        />
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center justify-center">
          <Switch checked={compoundTax} onCheckedChange={setCompoundTax} />
        </div>
      </td>
      <td className="py-2 px-2">
        <Input
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          placeholder="0.00"
          type="number"
          min={0}
          max={100}
          step={0.001}
          className="h-8 text-sm text-right"
        />
      </td>
      <td className="py-2 pl-2 pr-4">
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            size="sm"
            loading={isPending}
            disabled={isPending || !canSubmit}
            onClick={() =>
              onAdd({
                name: name.trim(),
                percent: Number(percent),
                compoundTax,
              })
            }
          >
            Add
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function TaxTypesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery(
    trpc.settings.listTaxTypes.queryOptions(),
  );

  const [showAdd, setShowAdd] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries(trpc.settings.listTaxTypes.queryOptions());
  }

  const updateTaxPerItem = useMutation(
    trpc.settings.updateTaxPerItem.mutationOptions({
      onSuccess: invalidate,
      onError: (e) =>
        toast.error("Couldn't update setting", { description: e.message }),
    }),
  );

  const create = useMutation(
    trpc.settings.createTaxType.mutationOptions({
      onSuccess: () => {
        invalidate();
        setShowAdd(false);
        toast.success("Tax type added.");
      },
      onError: (e) =>
        toast.error("Couldn't add tax type", { description: e.message }),
    }),
  );

  const remove = useMutation(
    trpc.settings.deleteTaxType.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Tax type removed.");
      },
      onError: (e) =>
        toast.error("Couldn't delete", { description: e.message }),
    }),
  );

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const taxPerItem = data?.taxPerItem ?? false;

  return (
    <SettingsPage
      title="Tax Types"
      description="Add or remove taxes as you please. Taxes can be applied to individual items or to the whole invoice."
    >
      <div className="space-y-6">
        {/* Tax types table */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              {items.length} tax type{items.length !== 1 ? "s" : ""}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAdd(true)}
              disabled={showAdd}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {items.length === 0 && !showAdd ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No tax types yet. Add one above.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold text-muted-foreground">
                    Tax Name
                  </th>
                  <th className="py-2 px-2 text-center text-xs font-semibold text-muted-foreground">
                    Compound Tax
                  </th>
                  <th className="py-2 px-2 text-right text-xs font-semibold text-muted-foreground">
                    Percent
                  </th>
                  <th className="py-2 pl-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <TaxRow
                    key={t.id}
                    tax={t}
                    onDelete={(id) => remove.mutate({ id })}
                    isDeletePending={remove.isPending}
                  />
                ))}
                {showAdd ? (
                  <AddTaxRow
                    isPending={create.isPending}
                    onAdd={(d) => create.mutate(d)}
                    onCancel={() => setShowAdd(false)}
                  />
                ) : null}
              </tbody>
            </table>
          )}
        </div>

        {/* Tax Per Item toggle */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="tax-per-item" className="text-sm font-medium">
                Tax Per Item
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable this if you want to add taxes to individual invoice
                items. By default, taxes are added directly to the invoice.
              </p>
            </div>
            <Switch
              id="tax-per-item"
              checked={taxPerItem}
              onCheckedChange={(v) =>
                updateTaxPerItem.mutate({ taxPerItem: v })
              }
              disabled={updateTaxPerItem.isPending}
            />
          </div>
        </div>
      </div>
    </SettingsPage>
  );
}

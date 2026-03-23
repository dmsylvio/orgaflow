"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
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

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateTaxDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("");
  const [compoundTax, setCompoundTax] = useState(false);
  const trpc = useTRPC();

  const create = useMutation(
    trpc.settings.createTaxType.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        setName("");
        setPercent("");
        setCompoundTax(false);
        toast.success("Tax type added.");
      },
      onError: (e) =>
        toast.error("Couldn't add tax type", { description: e.message }),
    }),
  );

  const canSubmit = name.trim().length > 0 && percent.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tax Type</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-name">Tax Name</Label>
            <Input
              id="ct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VAT"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-percent">Percent (%)</Label>
            <Input
              id="ct-percent"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              type="number"
              min={0}
              max={100}
              step={0.001}
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="ct-compound" className="text-sm font-medium">
                Compound Tax
              </Label>
              <p className="text-xs text-muted-foreground">
                Apply this tax on top of other taxes.
              </p>
            </div>
            <Switch
              id="ct-compound"
              checked={compoundTax}
              onCheckedChange={setCompoundTax}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={create.isPending}
            disabled={create.isPending || !canSubmit}
            onClick={() =>
              create.mutate({
                name: name.trim(),
                percent: Number(percent),
                compoundTax,
              })
            }
          >
            Add Tax Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Dialog
// ---------------------------------------------------------------------------

function EditTaxDialog({
  tax,
  open,
  onOpenChange,
  onSuccess,
}: {
  tax: TaxType;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(tax.name);
  const [percent, setPercent] = useState(tax.percent);
  const [compoundTax, setCompoundTax] = useState(tax.compoundTax);
  const trpc = useTRPC();

  const update = useMutation(
    trpc.settings.updateTaxType.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Tax type updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update tax type", { description: e.message }),
    }),
  );

  const canSubmit = name.trim().length > 0 && String(percent).trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tax Type</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="et-name">Tax Name</Label>
            <Input
              id="et-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="et-percent">Percent (%)</Label>
            <Input
              id="et-percent"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              type="number"
              min={0}
              max={100}
              step={0.001}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="et-compound" className="text-sm font-medium">
                Compound Tax
              </Label>
              <p className="text-xs text-muted-foreground">
                Apply this tax on top of other taxes.
              </p>
            </div>
            <Switch
              id="et-compound"
              checked={compoundTax}
              onCheckedChange={setCompoundTax}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={update.isPending}
            disabled={update.isPending || !canSubmit}
            onClick={() =>
              update.mutate({
                id: tax.id,
                name: name.trim(),
                percent: Number(percent),
                compoundTax,
              })
            }
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function TaxRow({
  tax,
  onDelete,
  isDeletePending,
  onEdit,
}: {
  tax: TaxType;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  onEdit: (tax: TaxType) => void;
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
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(tax)}
            className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TaxTypesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery(
    trpc.settings.listTaxTypes.queryOptions(),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TaxType | null>(null);

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
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              {items.length} tax type{items.length !== 1 ? "s" : ""}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {items.length === 0 ? (
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
                    onEdit={setEditTarget}
                    onDelete={(id) => remove.mutate({ id })}
                    isDeletePending={remove.isPending}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

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

      <CreateTaxDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={invalidate}
      />

      {editTarget ? (
        <EditTaxDialog
          tax={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          onSuccess={invalidate}
        />
      ) : null}
    </SettingsPage>
  );
}

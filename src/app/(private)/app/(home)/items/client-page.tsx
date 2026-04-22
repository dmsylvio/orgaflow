"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { NativeSelect } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";
import { useCanViewPrices } from "@/hooks/use-can-view-prices";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type ItemRecord = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  unitId: string | null;
  unitName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UnitOption = {
  id: string;
  name: string;
};

const PAGE_SIZE = 25;

function PageShell({
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

function ItemDialog({
  open,
  onOpenChange,
  item,
  units,
  currency,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  item: ItemRecord | null;
  units: UnitOption[];
  currency: CurrencyFormat;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const isEditing = Boolean(item);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unitId, setUnitId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(item?.name ?? "");
    setPrice(item?.price ?? "");
    setUnitId(item?.unitId ?? "");
    setDescription(item?.description ?? "");
  }, [item, open]);

  const create = useMutation(
    trpc.items.create.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Item added.", {
          description: `${name.trim()} is now available in your catalog.`,
        });
      },
      onError: (error) =>
        toast.error("Couldn't add item.", { description: error.message }),
    }),
  );

  const update = useMutation(
    trpc.items.update.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Item updated.", {
          description: `${name.trim()} was updated successfully.`,
        });
      },
      onError: (error) =>
        toast.error("Couldn't update item.", { description: error.message }),
    }),
  );

  const isPending = create.isPending || update.isPending;

  function handleSubmit() {
    const payload = {
      name: name.trim(),
      price: price.trim(),
      unitId: unitId || null,
      description: description.trim() || null,
    };

    if (isEditing && item) {
      update.mutate({
        id: item.id,
        ...payload,
      });
      return;
    }

    create.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Website design"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-unit">Unit</Label>
              <NativeSelect
                id="item-unit"
                value={unitId}
                onChange={(event) => setUnitId(event.target.value)}
              >
                <option value="">No unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-price">Price</Label>
            <CurrencyInput
              id="item-price"
              currency={currency}
              value={price}
              onValueChange={setPrice}
            />
            <p className="text-xs text-muted-foreground">
              Saved in your organization default currency
              {currency ? ` (${currency.code}).` : "."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-description">
              Description{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="item-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short note to help your team reuse this item later."
              rows={4}
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
            loading={isPending}
            disabled={isPending || !name.trim() || !price.trim()}
            onClick={handleSubmit}
          >
            {isEditing ? "Save Changes" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemRow({
  item,
  currency,
  canViewPrices,
  isDeletePending,
  onEdit,
  onDelete,
}: {
  item: ItemRecord;
  currency: CurrencyFormat;
  canViewPrices: boolean;
  isDeletePending: boolean;
  onEdit: (item: ItemRecord) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="group border-b border-border last:border-0">
      <td className="w-[32%] py-3 pl-4 pr-2 align-top">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            Updated {new Date(item.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </td>
      <td className="w-[16%] px-2 py-3 align-top">
        <span className="text-sm text-muted-foreground">
          {item.unitName ?? <span className="italic opacity-40">No unit</span>}
        </span>
      </td>
      {canViewPrices ? (
        <td className="w-[18%] px-2 py-3 align-top">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {formatCurrencyDisplay(item.price ?? "", currency)}
            </p>
            {currency ? (
              <p className="text-xs text-muted-foreground">{currency.code}</p>
            ) : null}
          </div>
        </td>
      ) : null}
      <td className="px-2 py-3 align-top">
        <span className="text-sm text-muted-foreground">
          {item.description ? (
            item.description
          ) : (
            <span className="italic opacity-40">No description</span>
          )}
        </span>
      </td>
      <td className="w-24 py-3 pl-2 pr-4 align-top">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Edit item"
            onClick={() => onEdit(item)}
            className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Delete item"
            disabled={isDeletePending}
            onClick={() => onDelete(item.id)}
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

export default function ItemsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
  const [page, setPage] = useState(1);
  const { item: canViewPrices } = useCanViewPrices();

  const { data: items = [], isPending } = useQuery(
    trpc.items.list.queryOptions(),
  );
  const { data: units = [] } = useQuery(trpc.items.listUnits.queryOptions());
  const { data: currency = null } = useQuery(
    trpc.items.getDefaultCurrency.queryOptions(),
  );
  const { data: usage } = useQuery(trpc.items.getUsage.queryOptions());

  const deleteItem = useMutation(
    trpc.items.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.items.list.queryOptions());
        toast.success("Item removed.", {
          description: "The item was removed from your catalog.",
        });
      },
      onError: (error) =>
        toast.error("Couldn't delete item.", { description: error.message }),
    }),
  );

  function invalidateItems() {
    void queryClient.invalidateQueries(trpc.items.list.queryOptions());
    void queryClient.invalidateQueries(trpc.items.getUsage.queryOptions());
  }

  const usageLabel =
    usage?.limit === null
      ? `Unlimited items on the ${usage?.plan ?? "current"} plan.`
      : `${usage?.total ?? items.length} of ${usage?.limit ?? 50} items used on Starter.`;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = items.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <>
      <PageShell
        title="Items"
        description="Build a reusable catalog of products and services for your team."
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usageLabel}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                disabled={usage ? !usage.canCreate : false}
                onClick={() => {
                  setEditingItem(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>

            {usage && !usage.canCreate ? (
              <div className="border-b border-border bg-amber-500/5 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  Item limit reached
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You reached the limit of {usage.limit} items on Starter.
                  Upgrade your workspace to Growth or Scale to keep adding
                  products and services.
                </p>
              </div>
            ) : null}

            {items.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm font-medium text-foreground">
                  No items yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first product or service to speed up future estimates
                  and invoices.
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  disabled={usage ? !usage.canCreate : false}
                  onClick={() => {
                    setEditingItem(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create first item
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                          Name
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                          Unit
                        </th>
                        {canViewPrices ? (
                          <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                            Price
                          </th>
                        ) : null}
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                          Description
                        </th>
                        <th className="py-3 pl-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          currency={currency}
                          canViewPrices={canViewPrices}
                          isDeletePending={deleteItem.isPending}
                          onEdit={(nextItem) => {
                            setEditingItem(nextItem);
                            setIsDialogOpen(true);
                          }}
                          onDelete={(id) => deleteItem.mutate({ id })}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  totalCount={items.length}
                  page={safePage}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  itemLabel="items"
                />
              </>
            )}
          </div>
        </div>
      </PageShell>

      <ItemDialog
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          setIsDialogOpen(nextOpen);
          if (!nextOpen) {
            setEditingItem(null);
          }
        }}
        item={editingItem}
        units={units}
        currency={currency}
        onSuccess={invalidateItems}
      />
    </>
  );
}

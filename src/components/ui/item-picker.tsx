"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Package, Plus, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type ItemFormState = {
  name: string;
  price: string;
  unitId: string;
  description: string;
};

const EMPTY_FORM: ItemFormState = {
  name: "",
  price: "",
  unitId: "",
  description: "",
};

interface ItemPickerProps {
  value: string;
  onValueChange: (id: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ItemPicker({
  value,
  onValueChange,
  id,
  placeholder = "Select an item",
  disabled = false,
}: ItemPickerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: items = [] } = useQuery(trpc.items.list.queryOptions());
  const { data: units = [] } = useQuery({
    ...trpc.items.listUnits.queryOptions(),
    enabled: addOpen,
  });
  const { data: currency = null } = useQuery({
    ...trpc.items.getDefaultCurrency.queryOptions(),
    enabled: addOpen,
  });
  const { data: usage } = useQuery(trpc.items.getUsage.queryOptions());

  const selected = items.find((item) => item.id === value) ?? null;

  const filtered = useMemo(() => {
    if (!search.trim()) return items;

    const query = search.toLowerCase();

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query) ||
        (item.unitName ?? "").toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  const create = useMutation(
    trpc.items.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries(trpc.items.list.queryOptions());
        queryClient.invalidateQueries(trpc.items.getUsage.queryOptions());
        queryClient.invalidateQueries(
          trpc.estimates.getFormMeta.queryOptions(),
        );
        queryClient.invalidateQueries(trpc.invoices.getFormMeta.queryOptions());
        onValueChange(result.id);
        setAddOpen(false);
        setForm(EMPTY_FORM);
        setSearch("");
        toast.success("Item created.", {
          description: `${result.name} is now available in your catalog.`,
        });
      },
      onError: (error) =>
        toast.error("Couldn't create item.", {
          description: error.message,
        }),
    }),
  );

  function handleSelect(itemId: string) {
    onValueChange(itemId);
    setOpen(false);
    setSearch("");
  }

  function handleClear(event: React.MouseEvent) {
    event.stopPropagation();
    onValueChange("");
  }

  function openAdd() {
    setForm({
      ...EMPTY_FORM,
      name: search.trim(),
    });
    setOpen(false);
    setAddOpen(true);
  }

  function handleSaveAdd() {
    if (!form.name.trim() || !form.price.trim()) {
      return;
    }

    create.mutate({
      name: form.name.trim(),
      price: form.price.trim(),
      unitId: form.unitId || null,
      description: form.description.trim() || null,
    });
  }

  const canCreate = usage?.canCreate ?? true;

  return (
    <>
      <PopoverPrimitive.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setTimeout(() => searchRef.current?.focus(), 0);
          }
        }}
      >
        <div className="relative">
          <PopoverPrimitive.Trigger asChild>
            <button
              id={id}
              type="button"
              disabled={disabled}
              aria-expanded={open}
              className={cn(
                "flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "hover:bg-muted/30",
                disabled && "cursor-not-allowed opacity-50",
                open && "ring-2 ring-ring",
                selected && "pr-10",
              )}
            >
              <span className="mr-2 text-muted-foreground">
                <Package className="h-4 w-4" />
              </span>
              <span
                className={cn(
                  "truncate",
                  selected ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {selected?.name ?? placeholder}
              </span>
            </button>
          </PopoverPrimitive.Trigger>

          {selected ? (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors",
                "hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive",
              )}
              title="Remove selection"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className={cn(
              "z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-card shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            )}
          >
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search items"
                  className={cn(
                    "block h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm",
                    "placeholder:text-muted-foreground",
                    "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring",
                  )}
                />
              </div>
            </div>

            <ul className="max-h-80 overflow-auto">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No items found.
                </li>
              ) : (
                filtered.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0",
                        "hover:bg-accent focus:bg-accent focus:outline-none",
                        item.id === value && "bg-accent/60",
                      )}
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        {item.id === value ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        {item.description ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          {item.unitName ? (
                            <span>Unit: {item.unitName}</span>
                          ) : null}
                          <span>Price: {item.price}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div className="border-t border-border p-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                disabled={!canCreate}
                onClick={openAdd}
              >
                <Plus className="h-4 w-4" />
                {search.trim()
                  ? `Create "${search.trim()}"`
                  : "Create new item"}
              </Button>
              {!canCreate && usage?.limit ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Item limit reached for the current plan ({usage.limit}).
                </p>
              ) : null}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Item</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="space-y-1.5">
                <Label htmlFor="item-picker-name">Name</Label>
                <Input
                  id="item-picker-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Website design"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-picker-unit">Unit</Label>
                <NativeSelect
                  id="item-picker-unit"
                  value={form.unitId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unitId: event.target.value,
                    }))
                  }
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
              <Label htmlFor="item-picker-price">Price</Label>
              {currency ? (
                <CurrencyInput
                  id="item-picker-price"
                  currency={currency}
                  value={form.price}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      price: value,
                    }))
                  }
                />
              ) : (
                <Input
                  id="item-picker-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-picker-description">
                Description{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="item-picker-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="A short note to help your team reuse this item later."
                rows={4}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={create.isPending}
              disabled={
                create.isPending || !form.name.trim() || !form.price.trim()
              }
              onClick={handleSaveAdd}
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

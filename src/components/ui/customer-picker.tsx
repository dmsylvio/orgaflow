"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, User, UserPlus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type CustomerFormState = {
  displayName: string;
  email: string;
  phone: string;
};

const EMPTY_FORM: CustomerFormState = {
  displayName: "",
  email: "",
  phone: "",
};

interface CustomerPickerProps {
  value: string;
  onValueChange: (id: string) => void;
  id?: string;
  required?: boolean;
}

export function CustomerPicker({
  value,
  onValueChange,
  id,
  required,
}: CustomerPickerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: customers = [] } = useQuery(trpc.customers.list.queryOptions());

  const selected = customers.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const create = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries(trpc.customers.list.queryOptions());
        onValueChange(result.id);
        setAddOpen(false);
        setForm(EMPTY_FORM);
        toast.success("Customer created.");
      },
      onError: (error) =>
        toast.error("Couldn't create customer.", {
          description: error.message,
        }),
    }),
  );

  const update = useMutation(
    trpc.customers.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.customers.list.queryOptions());
        setEditOpen(false);
        setForm(EMPTY_FORM);
        toast.success("Customer updated.");
      },
      onError: (error) =>
        toast.error("Couldn't update customer.", {
          description: error.message,
        }),
    }),
  );

  function handleSelect(customerId: string) {
    onValueChange(customerId);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onValueChange("");
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setOpen(false);
    setSearch("");
    setAddOpen(true);
  }

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation();
    if (!selected) return;
    setForm({
      displayName: selected.displayName,
      email: selected.email ?? "",
      phone: selected.phone ?? "",
    });
    setEditOpen(true);
  }

  function handleSaveAdd() {
    if (!form.displayName.trim()) return;
    create.mutate({
      displayName: form.displayName,
      email: form.email || null,
      phone: form.phone || null,
    });
  }

  function handleSaveEdit() {
    if (!selected || !form.displayName.trim()) return;
    update.mutate({
      id: selected.id,
      displayName: form.displayName,
      email: form.email || null,
      phone: form.phone || null,
    });
  }

  function getInitial(name: string) {
    return name.trim()[0]?.toUpperCase() ?? "?";
  }

  return (
    <>
      <PopoverPrimitive.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setTimeout(() => searchRef.current?.focus(), 0);
        }}
      >
        <div className="relative">
          <PopoverPrimitive.Trigger asChild>
            <button
              id={id}
              type="button"
              aria-expanded={open}
              className={cn(
                "w-full min-h-[170px] rounded-md border border-input bg-card transition-colors",
                "flex flex-col items-center justify-center gap-3 px-4 py-6",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "hover:bg-muted/40",
                open && "ring-2 ring-ring",
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>

              {selected ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {selected.displayName}
                  </p>
                  {selected.primaryContactName ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {selected.primaryContactName}
                    </p>
                  ) : null}
                  {selected.phone ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {selected.phone}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  Select Customer
                  {required ? (
                    <span className="ml-1 text-destructive">*</span>
                  ) : null}
                </p>
              )}
            </button>
          </PopoverPrimitive.Trigger>

          {selected ? (
            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              <button
                type="button"
                onClick={openEdit}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground",
                )}
                title="Edit customer"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  "hover:bg-destructive/10 hover:text-destructive",
                )}
                title="Remove selection"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
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
            {/* Search */}
            <div className="m-4">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
                )}
              />
            </div>

            {/* List */}
            <ul className="flex max-h-80 flex-col overflow-auto border-t border-border">
              {filtered.length === 0 ? (
                <li className="px-6 py-4 text-center text-sm text-muted-foreground">
                  No customers found.
                </li>
              ) : (
                filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center border-b border-border px-6 py-2",
                        "hover:bg-accent focus:bg-accent focus:outline-none",
                        c.id === value && "bg-accent/50",
                      )}
                    >
                      <span className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold text-foreground">
                        {getInitial(c.displayName)}
                      </span>
                      <div className="flex flex-col justify-center text-left">
                        <p className="text-sm font-normal leading-tight text-foreground">
                          {c.displayName}
                        </p>
                        {c.primaryContactName ? (
                          <p className="text-xs text-muted-foreground">
                            {c.primaryContactName}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>

            {/* Add new customer */}
            <button
              type="button"
              onClick={openAdd}
              className={cn(
                "flex h-10 w-full items-center justify-center gap-3 border-t border-border bg-muted px-4",
                "transition-colors hover:bg-muted/80 focus:outline-none focus:bg-muted/80",
              )}
            >
              <UserPlus className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Add New Customer</span>
            </button>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp-add-name">Display name</Label>
              <Input
                id="cp-add-name"
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
                placeholder="Acme Corp"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-add-email">
                Email{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="cp-add-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="contact@acme.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-add-phone">
                Phone{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="cp-add-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+1 555 000 0000"
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
              disabled={create.isPending || !form.displayName.trim()}
              onClick={handleSaveAdd}
            >
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-name">Display name</Label>
              <Input
                id="cp-edit-name"
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-email">
                Email{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="cp-edit-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-edit-phone">
                Phone{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="cp-edit-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={update.isPending}
              disabled={update.isPending || !form.displayName.trim()}
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

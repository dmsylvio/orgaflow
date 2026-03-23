"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type CustomerRecord = {
  id: string;
  displayName: string;
  primaryContactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  prefix: string | null;
  name: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  zipCode: string | null;
  addressPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CustomerFormState = {
  displayName: string;
  primaryContactName: string;
  email: string;
  phone: string;
  website: string;
  prefix: string;
  name: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
  addressPhone: string;
};

const EMPTY_FORM: CustomerFormState = {
  displayName: "",
  primaryContactName: "",
  email: "",
  phone: "",
  website: "",
  prefix: "",
  name: "",
  state: "",
  city: "",
  address: "",
  zipCode: "",
  addressPhone: "",
};

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

function toFormState(customer: CustomerRecord | null): CustomerFormState {
  if (!customer) return EMPTY_FORM;

  return {
    displayName: customer.displayName ?? "",
    primaryContactName: customer.primaryContactName ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    website: customer.website ?? "",
    prefix: customer.prefix ?? "",
    name: customer.name ?? "",
    state: customer.state ?? "",
    city: customer.city ?? "",
    address: customer.address ?? "",
    zipCode: customer.zipCode ?? "",
    addressPhone: customer.addressPhone ?? "",
  };
}

function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  customer: CustomerRecord | null;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const isEditing = Boolean(customer);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(customer));
  }, [customer, open]);

  function updateField<Key extends keyof CustomerFormState>(
    key: Key,
    value: CustomerFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const create = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Customer added.", {
          description: `${form.displayName.trim()} is now in your customer list.`,
        });
      },
      onError: (error) =>
        toast.error("Couldn't add customer.", { description: error.message }),
    }),
  );

  const update = useMutation(
    trpc.customers.update.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Customer updated.", {
          description: `${form.displayName.trim()} was updated successfully.`,
        });
      },
      onError: (error) =>
        toast.error("Couldn't update customer.", {
          description: error.message,
        }),
    }),
  );

  const isPending = create.isPending || update.isPending;

  function handleSubmit() {
    const payload = {
      displayName: form.displayName.trim(),
      primaryContactName: form.primaryContactName,
      email: form.email,
      phone: form.phone,
      website: form.website,
      prefix: form.prefix,
      name: form.name,
      state: form.state,
      city: form.city,
      address: form.address,
      zipCode: form.zipCode,
      addressPhone: form.addressPhone,
    };

    if (customer) {
      update.mutate({
        id: customer.id,
        ...payload,
      });
      return;
    }

    create.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customer-display-name">Display name</Label>
                <Input
                  id="customer-display-name"
                  value={form.displayName}
                  onChange={(event) =>
                    updateField("displayName", event.target.value)
                  }
                  placeholder="e.g. Acme Studio"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-primary-contact">
                  Primary contact
                </Label>
                <Input
                  id="customer-primary-contact"
                  value={form.primaryContactName}
                  onChange={(event) =>
                    updateField("primaryContactName", event.target.value)
                  }
                  placeholder="e.g. Sarah Johnson"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-website">Website</Label>
                <Input
                  id="customer-website"
                  value={form.website}
                  onChange={(event) =>
                    updateField("website", event.target.value)
                  }
                  placeholder="orgaflow.app"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customer-prefix">Legal prefix</Label>
                <Input
                  id="customer-prefix"
                  value={form.prefix}
                  onChange={(event) =>
                    updateField("prefix", event.target.value)
                  }
                  placeholder="e.g. LLC"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-legal-name">Legal name</Label>
                <Input
                  id="customer-legal-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="e.g. Acme Studio LLC"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-address">Address</Label>
              <Textarea
                id="customer-address"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Street, number, suite"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="customer-city">City</Label>
                <Input
                  id="customer-city"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-state">State</Label>
                <Input
                  id="customer-state"
                  value={form.state}
                  onChange={(event) => updateField("state", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-zip-code">ZIP code</Label>
                <Input
                  id="customer-zip-code"
                  value={form.zipCode}
                  onChange={(event) =>
                    updateField("zipCode", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-address-phone">Address phone</Label>
              <Input
                id="customer-address-phone"
                value={form.addressPhone}
                onChange={(event) =>
                  updateField("addressPhone", event.target.value)
                }
                placeholder="Optional phone for billing/location details"
              />
            </div>
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
            disabled={isPending || !form.displayName.trim()}
            onClick={handleSubmit}
          >
            {isEditing ? "Save Changes" : "Add Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatCustomerLocation(customer: CustomerRecord) {
  return [customer.city, customer.state, customer.zipCode]
    .filter(Boolean)
    .join(", ");
}

function CustomerRow({
  customer,
  isDeletePending,
  onEdit,
  onDelete,
}: {
  customer: CustomerRecord;
  isDeletePending: boolean;
  onEdit: (customer: CustomerRecord) => void;
  onDelete: (id: string) => void;
}) {
  const location = formatCustomerLocation(customer);

  return (
    <tr className="group border-b border-border last:border-0">
      <td className="w-[28%] py-3 pl-4 pr-2 align-top">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {customer.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            Updated {new Date(customer.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </td>
      <td className="w-[22%] px-2 py-3 align-top">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{customer.primaryContactName ?? "No contact"}</p>
          <p>{customer.email ?? customer.phone ?? "No contact details"}</p>
        </div>
      </td>
      <td className="w-[22%] px-2 py-3 align-top">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{location || "No location"}</p>
          <p>
            {customer.addressPhone ?? customer.website ?? "No extra details"}
          </p>
        </div>
      </td>
      <td className="px-2 py-3 align-top">
        <span className="text-sm text-muted-foreground">
          {customer.address ? (
            customer.address
          ) : (
            <span className="italic opacity-40">No address</span>
          )}
        </span>
      </td>
      <td className="w-24 py-3 pl-2 pr-4 align-top">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Edit customer"
            onClick={() => onEdit(customer)}
            className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Delete customer"
            disabled={isDeletePending}
            onClick={() => onDelete(customer.id)}
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

export default function CustomersPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(
    null,
  );

  const { data: customers = [], isPending } = useQuery(
    trpc.customers.list.queryOptions(),
  );
  const { data: usage } = useQuery(trpc.customers.getUsage.queryOptions());

  const deleteCustomer = useMutation(
    trpc.customers.delete.mutationOptions({
      onSuccess: () => {
        invalidateCustomers();
        toast.success("Customer removed.", {
          description: "The customer was removed from your organization.",
        });
      },
      onError: (error) =>
        toast.error("Couldn't delete customer.", {
          description: error.message,
        }),
    }),
  );

  function invalidateCustomers() {
    void queryClient.invalidateQueries(trpc.customers.list.queryOptions());
    void queryClient.invalidateQueries(trpc.customers.getUsage.queryOptions());
  }

  const usageLabel =
    usage?.limit === null
      ? `Unlimited customers on the ${usage?.plan ?? "current"} plan.`
      : `${usage?.total ?? customers.length} of ${usage?.limit ?? 50} customers used on Starter.`;

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
        title="Customers"
        description="Keep customer records organized so estimates, invoices, and payments are faster to manage."
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {customers.length} customer{customers.length === 1 ? "" : "s"}
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
                  setEditingCustomer(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add customer
              </Button>
            </div>

            {usage && !usage.canCreate ? (
              <div className="border-b border-border bg-amber-500/5 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  Customer limit reached
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You reached the limit of {usage.limit} customers on Starter.
                  Upgrade your workspace to Growth or Scale to keep adding
                  customers.
                </p>
              </div>
            ) : null}

            {customers.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm font-medium text-foreground">
                  No customers yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first customer to start building estimates, invoices,
                  and payments around real contacts.
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  disabled={usage ? !usage.canCreate : false}
                  onClick={() => {
                    setEditingCustomer(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create first customer
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Customer
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Contact
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Location
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Address
                      </th>
                      <th className="py-3 pl-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <CustomerRow
                        key={customer.id}
                        customer={customer}
                        isDeletePending={deleteCustomer.isPending}
                        onEdit={(nextCustomer) => {
                          setEditingCustomer(nextCustomer);
                          setIsDialogOpen(true);
                        }}
                        onDelete={(id) => deleteCustomer.mutate({ id })}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageShell>

      <CustomerDialog
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          setIsDialogOpen(nextOpen);
          if (!nextOpen) {
            setEditingCustomer(null);
          }
        }}
        customer={editingCustomer}
        onSuccess={invalidateCustomers}
      />
    </>
  );
}

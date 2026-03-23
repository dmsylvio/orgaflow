"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
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

type PaymentMode = {
  id: string;
  name: string;
  isDefault: boolean;
};

function DataRow({
  mode,
  onSetDefault,
  onDelete,
  isDefaultPending,
  isDeletePending,
}: {
  mode: PaymentMode;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isDefaultPending: boolean;
  isDeletePending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(mode.name);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const update = useMutation(
    trpc.settings.updatePaymentMode.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.listPaymentModes.queryOptions(),
        );
        setEditing(false);
        toast.success("Payment mode updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update", { description: e.message }),
    }),
  );

  return (
    <tr className="group border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-2">
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter")
                update.mutate({ id: mode.id, name: name.trim() });
              if (e.key === "Escape") {
                setName(mode.name);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span className="text-sm font-medium text-foreground">
            {mode.name}
          </span>
        )}
      </td>
      <td className="py-3 px-2">
        {mode.isDefault ? (
          <Badge variant="soft" className="text-xs">
            Default
          </Badge>
        ) : null}
      </td>
      <td className="py-3 pl-2 pr-4">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                loading={update.isPending}
                disabled={update.isPending || !name.trim()}
                onClick={() => update.mutate({ id: mode.id, name: name.trim() })}
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setName(mode.name);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {!mode.isDefault ? (
                <button
                  type="button"
                  title="Set as default"
                  disabled={isDefaultPending}
                  onClick={() => onSetDefault(mode.id)}
                  className={cn(
                    "rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-amber-500",
                    isDefaultPending && "opacity-40",
                  )}
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                title="Edit name"
                onClick={() => setEditing(true)}
                className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Delete"
                disabled={isDeletePending}
                onClick={() => onDelete(mode.id)}
                className={cn(
                  "rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-destructive",
                  isDeletePending && "opacity-40",
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function PaymentModesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: modes = [], isPending } = useQuery(
    trpc.settings.listPaymentModes.queryOptions(),
  );

  const [addName, setAddName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const create = useMutation(
    trpc.settings.createPaymentMode.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.listPaymentModes.queryOptions(),
        );
        setAddName("");
        setShowAdd(false);
        toast.success("Payment mode added.");
      },
      onError: (e) => toast.error("Couldn't add", { description: e.message }),
    }),
  );

  const setDefault = useMutation(
    trpc.settings.updatePaymentMode.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.listPaymentModes.queryOptions(),
        );
      },
      onError: (e) =>
        toast.error("Couldn't set default", { description: e.message }),
    }),
  );

  const remove = useMutation(
    trpc.settings.deletePaymentMode.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.listPaymentModes.queryOptions(),
        );
        toast.success("Payment mode removed.");
      },
      onError: (e) => toast.error("Couldn't delete", { description: e.message }),
    }),
  );

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <SettingsPage
      title="Payment Modes"
      description="Define the payment methods your customers can use — e.g. Cash, Bank Transfer, Card."
    >
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Header row */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {modes.length} mode{modes.length !== 1 ? "s" : ""}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Table */}
        {modes.length === 0 && !showAdd ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No payment modes yet. Add one above.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <tbody>
              {modes.map((m) => (
                <DataRow
                  key={m.id}
                  mode={m}
                  onSetDefault={(id) => setDefault.mutate({ id, isDefault: true })}
                  onDelete={(id) => remove.mutate({ id })}
                  isDefaultPending={setDefault.isPending}
                  isDeletePending={remove.isPending}
                />
              ))}

              {/* Inline add row */}
              {showAdd ? (
                <tr className="border-t border-border">
                  <td className="py-2 pl-4 pr-2" colSpan={2}>
                    <Input
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="e.g. Bank Transfer"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && addName.trim())
                          create.mutate({ name: addName.trim() });
                        if (e.key === "Escape") {
                          setAddName("");
                          setShowAdd(false);
                        }
                      }}
                    />
                  </td>
                  <td className="py-2 pl-2 pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        loading={create.isPending}
                        disabled={create.isPending || !addName.trim()}
                        onClick={() => create.mutate({ name: addName.trim() })}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAddName("");
                          setShowAdd(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>
    </SettingsPage>
  );
}

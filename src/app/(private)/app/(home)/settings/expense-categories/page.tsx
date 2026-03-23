"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

type Category = {
  id: string;
  name: string;
  description: string | null;
};

function CategoryRow({
  cat,
  onDelete,
  isDeletePending,
}: {
  cat: Category;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [description, setDescription] = useState(cat.description ?? "");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const update = useMutation(
    trpc.settings.updateExpenseCategory.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.listExpenseCategories.queryOptions(),
        );
        setEditing(false);
        toast.success("Category updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update", { description: e.message }),
    }),
  );

  return (
    <tr className="group border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-2 w-1/3">
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium text-foreground">{cat.name}</span>
        )}
      </td>
      <td className="py-3 px-2">
        {editing ? (
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-8 text-sm"
            placeholder="Optional description"
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {cat.description ?? (
              <span className="italic opacity-40">No description</span>
            )}
          </span>
        )}
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
                onClick={() =>
                  update.mutate({
                    id: cat.id,
                    name: name.trim(),
                    description: description.trim() || null,
                  })
                }
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setName(cat.name);
                  setDescription(cat.description ?? "");
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                title="Edit"
                onClick={() => setEditing(true)}
                className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Delete"
                disabled={isDeletePending}
                onClick={() => onDelete(cat.id)}
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

export default function ExpenseCategoriesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: categories = [], isPending } = useQuery(
    trpc.settings.listExpenseCategories.queryOptions(),
  );

  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");

  const create = useMutation(
    trpc.settings.createExpenseCategory.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.listExpenseCategories.queryOptions(),
        );
        setAddName("");
        setAddDesc("");
        setShowAdd(false);
        toast.success("Category added.");
      },
      onError: (e) => toast.error("Couldn't add", { description: e.message }),
    }),
  );

  const remove = useMutation(
    trpc.settings.deleteExpenseCategory.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.listExpenseCategories.queryOptions(),
        );
        toast.success("Category removed.");
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
      title="Expense Categories"
      description="Organise your expenses into categories for clearer reporting."
    >
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
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

        {categories.length === 0 && !showAdd ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No categories yet. Add one above.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 w-1/3">
                  Name
                </th>
                <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Description
                </th>
                <th className="py-2 pl-2 pr-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onDelete={(id) => remove.mutate({ id })}
                  isDeletePending={remove.isPending}
                />
              ))}

              {showAdd ? (
                <tr className="border-t border-border">
                  <td className="py-2 pl-4 pr-2">
                    <Input
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="e.g. Office Supplies"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setAddName("");
                          setAddDesc("");
                          setShowAdd(false);
                        }
                      }}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={addDesc}
                      onChange={(e) => setAddDesc(e.target.value)}
                      placeholder="Optional description"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="py-2 pl-2 pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        loading={create.isPending}
                        disabled={create.isPending || !addName.trim()}
                        onClick={() =>
                          create.mutate({
                            name: addName.trim(),
                            description: addDesc.trim() || null,
                          })
                        }
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAddName("");
                          setAddDesc("");
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

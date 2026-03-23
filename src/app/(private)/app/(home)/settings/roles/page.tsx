"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { PermissionKey } from "@/server/iam";
import { useTRPC } from "@/trpc/client";

type PermissionGroup = {
  groupId: string;
  groupLabel: string;
  permissions: { key: PermissionKey; label: string }[];
};

// ---------------------------------------------------------------------------
// Layout primitives (shared across settings pages)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Create role form
// ---------------------------------------------------------------------------

function CreateRoleForm({
  permissionGroups,
  onCreated,
}: {
  permissionGroups: PermissionGroup[];
  onCreated: () => void;
}) {
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const create = useMutation(
    trpc.role.create.mutationOptions({
      onSuccess: () => {
        setName("");
        setKey("");
        setSelected(new Set());
        setOpen(false);
        onCreated();
        toast.success("Role created.");
      },
      onError: (e) => toast.error("Couldn't create role", { description: e.message }),
    }),
  );

  function autoKey(n: string) {
    return n
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function togglePermission(k: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        New role
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">New role</h3>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-name">Name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setKey(autoKey(e.target.value));
            }}
            placeholder="e.g. Billing Manager"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-key">Key</Label>
          <Input
            id="role-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="billing-manager"
            className="font-mono text-sm"
          />
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        Permissions
      </p>
      <div className="mb-4 space-y-4">
        {permissionGroups.map((g) => (
          <div key={g.groupId}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {g.groupLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {g.permissions.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePermission(p.key)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    selected.has(p.key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          loading={create.isPending}
          disabled={create.isPending || !name.trim() || !key.trim()}
          onClick={() =>
            create.mutate({ name, key, permissions: Array.from(selected) as PermissionKey[] })
          }
        >
          Create role
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role row
// ---------------------------------------------------------------------------

function RoleRow({
  role,
  permissionGroups,
  onDeleted,
}: {
  role: { id: string; name: string; key: string; isSystem: boolean };
  permissionGroups: PermissionGroup[];
  onDeleted: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { data: roleDetail, isPending: detailPending } = useQuery({
    ...trpc.role.byId.queryOptions({ id: role.id }),
    enabled: expanded,
  });

  const updateRole = useMutation(
    trpc.role.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.role.byId.queryOptions({ id: role.id }));
        toast.success("Role updated.");
      },
      onError: (e) => toast.error("Couldn't update role", { description: e.message }),
    }),
  );

  const deleteRole = useMutation(
    trpc.role.delete.mutationOptions({
      onSuccess: () => {
        onDeleted();
        toast.success("Role deleted.");
      },
      onError: (e) => toast.error("Couldn't delete role", { description: e.message }),
    }),
  );

  const currentPerms = new Set(roleDetail?.permissions ?? []);

  function togglePerm(key: PermissionKey) {
    const next = new Set(currentPerms);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    updateRole.mutate({ id: role.id, permissions: Array.from(next) as PermissionKey[] });
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="text-muted-foreground/40">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground">
              {role.name}
            </span>
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {role.key}
            </span>
          </div>
          {role.isSystem ? (
            <Badge variant="secondary" className="shrink-0 text-xs">
              System
            </Badge>
          ) : null}
        </button>

        {!role.isSystem ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            loading={deleteRole.isPending}
            disabled={deleteRole.isPending}
            onClick={() => deleteRole.mutate({ id: role.id })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {expanded ? (
        <div className="border-t border-border px-4 pb-4 pt-4">
          {detailPending ? (
            <Spinner className="size-4 text-primary" />
          ) : (
            <div className="space-y-4">
              {permissionGroups.map((g) => (
                <div key={g.groupId}>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {g.groupLabel}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {g.permissions.map((p) => {
                      const active = currentPerms.has(p.key);
                      return (
                        <button
                          key={p.key}
                          type="button"
                          disabled={role.isSystem || updateRole.isPending}
                          onClick={() => !role.isSystem && togglePerm(p.key)}
                          className={cn(
                            "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground",
                            !role.isSystem &&
                              "hover:border-primary/40 hover:text-foreground",
                            role.isSystem && "cursor-default opacity-60",
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RolesSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: roles, isPending } = useQuery(trpc.role.list.queryOptions());
  const { data: permissionGroups = [] } = useQuery(
    trpc.role.assignablePermissionGroups.queryOptions(),
  );

  function refetchRoles() {
    queryClient.invalidateQueries(trpc.role.list.queryOptions());
  }

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <SettingsPage
      title="Roles"
      description="Define custom roles and assign permissions to control what team members can do."
    >
      <div className="space-y-3">
        <CreateRoleForm
          permissionGroups={permissionGroups}
          onCreated={refetchRoles}
        />

        {roles?.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No roles yet. Create one above.
            </p>
          </div>
        ) : null}

        {roles?.map((role) => (
          <RoleRow
            key={role.id}
            role={role}
            permissionGroups={permissionGroups}
            onDeleted={refetchRoles}
          />
        ))}
      </div>
    </SettingsPage>
  );
}

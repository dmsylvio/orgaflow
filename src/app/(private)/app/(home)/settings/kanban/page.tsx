"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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

type Stage = {
  id: string;
  name: string;
  position: number;
  isSystem: boolean;
  systemKey: string | null;
};

function StageRow({
  stage,
  onDelete,
  isDeletePending,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  stage: Stage;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const update = useMutation(
    trpc.tasks.updateStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.tasks.listStages.queryOptions());
        setEditing(false);
        toast.success("Stage renamed.");
      },
      onError: (e) =>
        toast.error("Couldn't rename", { description: e.message }),
    }),
  );

  function startEdit() {
    setName(stage.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setName(stage.name);
    setEditing(false);
  }

  return (
    <tr className="group border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-1 w-16">
        {!stage.isSystem ? (
          <div className="flex flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={() => onMoveUp(stage.id)}
              className="rounded px-1 py-0.5 text-xs text-muted-foreground/50 hover:bg-accent hover:text-foreground disabled:opacity-20"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={() => onMoveDown(stage.id)}
              className="rounded px-1 py-0.5 text-xs text-muted-foreground/50 hover:bg-accent hover:text-foreground disabled:opacity-20"
              title="Move down"
            >
              ↓
            </button>
          </div>
        ) : (
          <div className="w-6" />
        )}
      </td>

      <td className="py-3 px-2 w-full">
        {editing ? (
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim())
                update.mutate({ id: stage.id, name: name.trim() });
              if (e.key === "Escape") cancelEdit();
            }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {stage.name}
            </span>
            {stage.isSystem ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Default
              </span>
            ) : null}
          </div>
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
                  update.mutate({ id: stage.id, name: name.trim() })
                }
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                title="Rename"
                onClick={startEdit}
                className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {!stage.isSystem ? (
                <button
                  type="button"
                  title="Delete"
                  disabled={isDeletePending}
                  onClick={() => onDelete(stage.id)}
                  className={cn(
                    "rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-destructive",
                    isDeletePending && "opacity-40",
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function KanbanSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: featureData, isPending: featurePending } = useQuery(
    trpc.tasks.getKanbanEnabled.queryOptions(),
  );
  const { data: stages = [], isPending: stagesPending } = useQuery(
    trpc.tasks.listStages.queryOptions(),
  );

  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");

  function invalidateStages() {
    queryClient.invalidateQueries(trpc.tasks.listStages.queryOptions());
  }

  const toggleFeature = useMutation(
    trpc.tasks.setKanbanEnabled.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.tasks.getKanbanEnabled.queryOptions(),
        );
        queryClient.invalidateQueries(trpc.tasks.listStages.queryOptions());
        queryClient.invalidateQueries(trpc.iam.navigation.queryOptions());
      },
      onError: (e) =>
        toast.error("Couldn't update setting", { description: e.message }),
    }),
  );

  const create = useMutation(
    trpc.tasks.createStage.mutationOptions({
      onSuccess: () => {
        invalidateStages();
        setAddName("");
        setShowAdd(false);
        toast.success("Stage added.");
      },
      onError: (e) =>
        toast.error("Couldn't add stage", { description: e.message }),
    }),
  );

  const reorder = useMutation(
    trpc.tasks.reorderStages.mutationOptions({
      onSuccess: invalidateStages,
      onError: (e) =>
        toast.error("Couldn't reorder", { description: e.message }),
    }),
  );

  const remove = useMutation(
    trpc.tasks.deleteStage.mutationOptions({
      onSuccess: () => {
        invalidateStages();
        toast.success("Stage removed.");
      },
      onError: (e) =>
        toast.error("Couldn't delete", { description: e.message }),
    }),
  );

  const customStages = stages.filter((s) => !s.isSystem);

  function handleMoveUp(id: string) {
    const idx = customStages.findIndex((s) => s.id === id);
    if (idx <= 0) return;
    const reordered = [...customStages];
    const current = reordered[idx];
    const previous = reordered[idx - 1];
    if (!current || !previous) return;
    [reordered[idx - 1], reordered[idx]] = [current, previous];
    reorder.mutate({ orderedIds: reordered.map((s) => s.id) });
  }

  function handleMoveDown(id: string) {
    const idx = customStages.findIndex((s) => s.id === id);
    if (idx === -1 || idx >= customStages.length - 1) return;
    const reordered = [...customStages];
    const current = reordered[idx];
    const next = reordered[idx + 1];
    if (!current || !next) return;
    [reordered[idx], reordered[idx + 1]] = [next, current];
    reorder.mutate({ orderedIds: reordered.map((s) => s.id) });
  }

  if (featurePending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const kanbanEnabled = featureData?.enabled ?? false;

  return (
    <SettingsPage
      title="Kanban"
      description="Enable the Kanban board and manage its stages. When enabled, Tasks appears in the main menu."
    >
      <div className="space-y-6">
        {/* Enable toggle */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="kanban-enabled" className="text-sm font-medium">
                Enable Kanban
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, a Tasks section appears in the main navigation for
                members with the task:view permission.
              </p>
            </div>
            <Switch
              id="kanban-enabled"
              checked={kanbanEnabled}
              onCheckedChange={(v) => toggleFeature.mutate({ enabled: v })}
              disabled={toggleFeature.isPending}
            />
          </div>
        </div>

        {/* Stages — only shown when enabled */}
        {kanbanEnabled ? (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                {stages.length} stage{stages.length !== 1 ? "s" : ""}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowAdd(true)}
                disabled={showAdd}
              >
                <Plus className="h-4 w-4" />
                Add stage
              </Button>
            </div>

            {stagesPending ? (
              <div className="flex items-center justify-center p-8">
                <Spinner className="size-4 text-primary" label="Loading" />
              </div>
            ) : (
              <table className="w-full">
                <tbody>
                  {stages.map((stage) => {
                    const customIdx = customStages.findIndex(
                      (s) => s.id === stage.id,
                    );
                    return (
                      <StageRow
                        key={stage.id}
                        stage={stage}
                        onDelete={(id) => remove.mutate({ id })}
                        isDeletePending={remove.isPending}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        canMoveUp={!stage.isSystem && customIdx > 0}
                        canMoveDown={
                          !stage.isSystem && customIdx < customStages.length - 1
                        }
                      />
                    );
                  })}

                  {showAdd ? (
                    <tr className="border-t border-border">
                      <td className="py-2 pl-4 pr-1 w-16" />
                      <td className="py-2 px-2">
                        <Input
                          value={addName}
                          onChange={(e) => setAddName(e.target.value)}
                          placeholder="e.g. In progress"
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
                            onClick={() =>
                              create.mutate({ name: addName.trim() })
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
        ) : null}
      </div>
    </SettingsPage>
  );
}

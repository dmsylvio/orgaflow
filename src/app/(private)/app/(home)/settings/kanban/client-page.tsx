"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PlanGate, usePlanCheck } from "@/components/plan-gate";
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

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

export const STAGE_COLORS = [
  { label: "Gray",   value: "#6b7280" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink",   value: "#ec4899" },
  { label: "Red",    value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Amber",  value: "#f59e0b" },
  { label: "Green",  value: "#22c55e" },
  { label: "Teal",   value: "#14b8a6" },
  { label: "Cyan",   value: "#06b6d4" },
  { label: "Sky",    value: "#0ea5e9" },
] as const;

export const DEFAULT_STAGE_COLOR: string = STAGE_COLORS[1].value; // blue

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={color}
      onClick={onClick}
      className="relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      style={{ backgroundColor: color }}
    >
      {selected ? (
        <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
      ) : null}
    </button>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STAGE_COLORS.map((c) => (
        <ColorSwatch
          key={c.value}
          color={c.value}
          selected={value === c.value}
          onClick={() => onChange(c.value)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
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
// Types
// ---------------------------------------------------------------------------

type Stage = {
  id: string;
  name: string;
  color: string | null;
  position: number;
  isSystem: boolean;
  systemKey: string | null;
};

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateStageDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_STAGE_COLOR);
  const trpc = useTRPC();

  const create = useMutation(
    trpc.tasks.createStage.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        setName("");
        setColor(DEFAULT_STAGE_COLOR);
        toast.success("Stage added.");
      },
      onError: (e) =>
        toast.error("Couldn't add stage", { description: e.message }),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stage</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cs-name">Name</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. In Progress"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim())
                  create.mutate({ name: name.trim(), color });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
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
            disabled={create.isPending || !name.trim()}
            onClick={() => create.mutate({ name: name.trim(), color })}
          >
            Add Stage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Dialog
// ---------------------------------------------------------------------------

function EditStageDialog({
  stage,
  open,
  onOpenChange,
  onSuccess,
}: {
  stage: Stage;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color ?? DEFAULT_STAGE_COLOR);
  const trpc = useTRPC();

  const update = useMutation(
    trpc.tasks.updateStage.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Stage updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update", { description: e.message }),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="es-name">Name</Label>
            <Input
              id="es-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim())
                  update.mutate({ id: stage.id, name: name.trim(), color });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
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
            disabled={update.isPending || !name.trim()}
            onClick={() =>
              update.mutate({ id: stage.id, name: name.trim(), color })
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
// StageRow
// ---------------------------------------------------------------------------

function StageRow({
  stage,
  onDelete,
  isDeletePending,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onEdit,
}: {
  stage: Stage;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: (stage: Stage) => void;
}) {
  const dot = stage.color ?? DEFAULT_STAGE_COLOR;

  return (
    <tr className="group border-b border-border last:border-0">
      {/* Reorder arrows — always visible */}
      <td className="py-3 pl-4 pr-1 w-12">
        {!stage.isSystem ? (
          <div className="flex flex-col items-center gap-0.5">
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

      {/* Color dot + name */}
      <td className="py-3 px-2 w-full">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
          />
          <span className="text-sm font-medium text-foreground">
            {stage.name}
          </span>
          {stage.isSystem ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Default
            </span>
          ) : null}
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 pl-2 pr-4">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(stage)}
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
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function KanbanSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { allowed } = usePlanCheck("scale");

  const { data: featureData, isPending: featurePending } = useQuery(
    trpc.tasks.getKanbanEnabled.queryOptions(),
  );
  const { data: stages = [], isPending: stagesPending } = useQuery({
    ...trpc.tasks.listStages.queryOptions(),
    enabled: allowed,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Stage | null>(null);

  function invalidateStages() {
    queryClient.invalidateQueries(trpc.tasks.listStages.queryOptions());
  }

  const toggleFeature = useMutation(
    trpc.tasks.setKanbanEnabled.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.tasks.getKanbanEnabled.queryOptions());
        queryClient.invalidateQueries(trpc.tasks.listStages.queryOptions());
        queryClient.invalidateQueries(trpc.iam.navigation.queryOptions());
      },
      onError: (e) =>
        toast.error("Couldn't update setting", { description: e.message }),
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
    <PlanGate requiredPlan="scale">
    <SettingsPage
      title="Task Settings"
      description="Enable the Tasks feature and manage its stages. When enabled, Tasks appears in the main menu."
    >
      <div className="space-y-6">
        {/* Enable toggle */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="kanban-enabled" className="text-sm font-medium">
                Enable Tasks
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

        {/* Stages */}
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
                onClick={() => setCreateOpen(true)}
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
                        onEdit={setEditTarget}
                        onDelete={(id) => remove.mutate({ id })}
                        isDeletePending={remove.isPending}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        canMoveUp={!stage.isSystem && customIdx > 0}
                        canMoveDown={
                          !stage.isSystem &&
                          customIdx < customStages.length - 1
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </div>

      <CreateStageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={invalidateStages}
      />

      {editTarget ? (
        <EditStageDialog
          stage={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          onSuccess={invalidateStages}
        />
      ) : null}
    </SettingsPage>
    </PlanGate>
  );
}

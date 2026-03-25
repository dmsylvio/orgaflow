"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { usePlanCheck } from "@/components/plan-gate";
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
import {
  RichTextContent,
  RichTextEditor,
} from "@/components/ui/rich-text-editor";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stage = {
  id: string;
  name: string;
  color: string | null;
  position: number;
  isSystem: boolean;
};

type Task = {
  id: string;
  stageId: string | null;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDurationMinutes: number | null;
  dueDate: Date | null;
  sourceType: string;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

const PRIORITIES = [
  {
    value: "urgent",
    label: "Urgent",
    color: "bg-red-100 text-red-800 ring-1 ring-red-300",
  },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "low", label: "Low", color: "bg-blue-100 text-blue-700" },
] as const;

type Priority = (typeof PRIORITIES)[number]["value"];

function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITIES.find((x) => x.value === priority);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        p?.color ?? "bg-muted text-muted-foreground",
      )}
    >
      {p?.label ?? priority}
    </span>
  );
}

function toInputDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0] ?? "";
}

function formatDate(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatEstimateMinutes(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
}

function estimatedDurationMinutesToInputValue(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "";

  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(hours.toFixed(2));
}

function estimateInputToMinutes(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;

  const hours = Number(normalized);
  if (!Number.isFinite(hours) || hours <= 0) {
    return null;
  }

  return Math.round(hours * 60);
}

// ---------------------------------------------------------------------------
// Add Task Dialog (completely independent)
// ---------------------------------------------------------------------------

function AddTaskDialog({
  open,
  onOpenChange,
  stages,
  defaultStageId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stages: Stage[];
  defaultStageId?: string;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [stageId, setStageId] = useState(defaultStageId ?? "");
  const [estimateHours, setEstimateHours] = useState("");
  const [dueDate, setDueDate] = useState("");
  const trpc = useTRPC();

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStageId(defaultStageId ?? "");
    setEstimateHours("");
    setDueDate("");
  }

  const create = useMutation(
    trpc.tasks.createTask.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        reset();
        toast.success("Task created.");
      },
      onError: (e) =>
        toast.error("Couldn't create task", { description: e.message }),
    }),
  );

  const systemStage = stages.find((s) => s.isSystem);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-[1fr_220px] gap-6">
            {/* Left: title + description */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="at-title">Title</Label>
                <Input
                  id="at-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Description
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Add more details…"
                />
              </div>
            </div>

            {/* Right: meta fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="at-priority">Priority</Label>
                <select
                  id="at-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="at-stage">Stage</Label>
                <select
                  id="at-stage"
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {systemStage ? (
                    <option value="">{systemStage.name} (default)</option>
                  ) : null}
                  {stages
                    .filter((s) => !s.isSystem)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="at-estimate">
                  Estimate (hours){" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="at-estimate"
                  type="number"
                  min="0"
                  step="0.25"
                  inputMode="decimal"
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(e.target.value)}
                  placeholder="2.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="at-due">
                  Due Date{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="at-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
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
            loading={create.isPending}
            disabled={create.isPending || !title.trim()}
            onClick={() =>
              create.mutate({
                title: title.trim(),
                description: description.trim() || null,
                priority,
                stageId: stageId || null,
                estimatedDurationMinutes: estimateInputToMinutes(estimateHours),
                dueDate: dueDate ? new Date(dueDate) : null,
              })
            }
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Task Dialog (completely independent)
// ---------------------------------------------------------------------------

function EditTaskDialog({
  task,
  open,
  onOpenChange,
  stages,
  onSuccess,
  onDelete,
  isDeletePending,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stages: Stage[];
  onSuccess: () => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [stageId, setStageId] = useState(task.stageId ?? "");
  const [estimateHours, setEstimateHours] = useState(
    estimatedDurationMinutesToInputValue(task.estimatedDurationMinutes),
  );
  const [dueDate, setDueDate] = useState(toInputDate(task.dueDate));
  const trpc = useTRPC();

  const update = useMutation(
    trpc.tasks.updateTask.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Task updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update task", { description: e.message }),
    }),
  );

  const systemStage = stages.find((s) => s.isSystem);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-[1fr_220px] gap-6">
            {/* Left: title + description */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="et-title">Title</Label>
                <Input
                  id="et-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Description{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Add more details…"
                />
              </div>
              {task.sourceType === "automation" ? (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    This task was created automatically by a workflow
                    automation.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Right: meta fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="et-priority">Priority</Label>
                <select
                  id="et-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="et-stage">Stage</Label>
                <select
                  id="et-stage"
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {systemStage ? (
                    <option value="">{systemStage.name} (default)</option>
                  ) : null}
                  {stages
                    .filter((s) => !s.isSystem)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="et-estimate">
                  Estimate (hours){" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="et-estimate"
                  type="number"
                  min="0"
                  step="0.25"
                  inputMode="decimal"
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(e.target.value)}
                  placeholder="2.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="et-due">
                  Due Date{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="et-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeletePending}
            onClick={() => {
              onDelete(task.id);
              onOpenChange(false);
            }}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
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
              disabled={update.isPending || !title.trim()}
              onClick={() =>
                update.mutate({
                  id: task.id,
                  title: title.trim(),
                  description: description.trim() || null,
                  priority,
                  stageId: stageId || null,
                  estimatedDurationMinutes:
                    estimateInputToMinutes(estimateHours),
                  dueDate: dueDate ? new Date(dueDate) : null,
                })
              }
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Task card
// ---------------------------------------------------------------------------

function TaskCard({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (task: Task) => void;
}) {
  const due = formatDate(task.dueDate);
  const estimate = formatEstimateMinutes(task.estimatedDurationMinutes);
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.priority !== "low";

  return (
    <button
      type="button"
      onClick={() => onEdit(task)}
      className="group w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
        {task.title}
      </p>
      {task.description ? (
        <RichTextContent
          html={task.description}
          className="mt-1.5 line-clamp-3 text-xs"
        />
      ) : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {estimate ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            {estimate}
          </span>
        ) : null}
        {due ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              isOverdue ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {due}
          </span>
        ) : null}
        {task.sourceType === "automation" ? (
          <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
            Auto
          </span>
        ) : null}
      </div>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Pencil className="h-3 w-3 text-muted-foreground/40" />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Stage column
// ---------------------------------------------------------------------------

function StageColumn({
  stage,
  tasks,
  onAddTask,
  onEditTask,
}: {
  stage: Stage;
  tasks: Task[];
  onAddTask: (stageId: string) => void;
  onEditTask: (task: Task) => void;
}) {
  const color = stage.color ?? "#6b7280";

  return (
    <div
      className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/40 overflow-hidden"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold text-foreground">
            {stage.name}
          </span>
          {tasks.length > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
              {tasks.length}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          title="Add task"
          onClick={() => onAddTask(stage.id)}
          className="rounded p-1 text-muted-foreground/50 hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {tasks.map((task) => (
          <div key={task.id} className="relative">
            <TaskCard task={task} onEdit={onEditTask} />
          </div>
        ))}

        <button
          type="button"
          onClick={() => onAddTask(stage.id)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-muted-foreground/60 hover:bg-accent/60 hover:text-muted-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TasksPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { allowed } = usePlanCheck("scale");

  const { data: stages = [], isPending: stagesPending } = useQuery({
    ...trpc.tasks.listStages.queryOptions(),
    enabled: allowed,
  });
  const { data: taskList = [], isPending: tasksPending } = useQuery({
    ...trpc.tasks.listTasks.queryOptions(),
    enabled: allowed,
  });
  const { data: featureData } = useQuery(
    trpc.tasks.getKanbanEnabled.queryOptions(),
  );

  const kanbanEnabled = featureData?.enabled ?? false;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDefaultStageId, setAddDefaultStageId] = useState<
    string | undefined
  >();
  const [editTarget, setEditTarget] = useState<Task | null>(null);

  function invalidate() {
    queryClient.invalidateQueries(trpc.tasks.listTasks.queryOptions());
  }

  function openAddForStage(stageId: string) {
    setAddDefaultStageId(stageId);
    setAddDialogOpen(true);
  }

  const remove = useMutation(
    trpc.tasks.deleteTask.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Task deleted.");
      },
      onError: (e) =>
        toast.error("Couldn't delete task", { description: e.message }),
    }),
  );

  if (stagesPending || tasksPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  if (!kanbanEnabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm font-medium text-foreground">Tasks is disabled</p>
        <p className="text-xs text-muted-foreground">
          Go to Settings → Task Settings to enable it.
        </p>
      </div>
    );
  }

  // Group tasks by stageId
  const systemStage = stages.find((s) => s.isSystem);
  const tasksByStage: Record<string, Task[]> = {};
  for (const stage of stages) {
    tasksByStage[stage.id] = [];
  }
  for (const task of taskList) {
    const key = task.stageId ?? systemStage?.id ?? "";
    const bucket = tasksByStage[key];
    if (key && bucket) {
      bucket.push(task as Task);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Tasks
          </h1>
          <span className="text-sm text-muted-foreground">
            {taskList.length} task{taskList.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setAddDefaultStageId(undefined);
            setAddDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-6 pb-8">
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            tasks={tasksByStage[stage.id] ?? []}
            onAddTask={openAddForStage}
            onEditTask={setEditTarget}
          />
        ))}

        {stages.length === 0 ? (
          <div className="flex w-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No stages configured. Go to Settings → Task Settings to add
              stages.
            </p>
          </div>
        ) : null}
      </div>

      {/* Dialogs */}
      <AddTaskDialog
        open={addDialogOpen}
        onOpenChange={(v) => {
          setAddDialogOpen(v);
          if (!v) setAddDefaultStageId(undefined);
        }}
        stages={stages}
        defaultStageId={addDefaultStageId}
        onSuccess={invalidate}
      />

      {editTarget ? (
        <EditTaskDialog
          task={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          stages={stages}
          onSuccess={invalidate}
          onDelete={(id) => remove.mutate({ id })}
          isDeletePending={remove.isPending}
        />
      ) : null}
    </div>
  );
}

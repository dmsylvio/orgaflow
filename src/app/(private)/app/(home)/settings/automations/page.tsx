"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Constants (mirrors server-side schema)
// ---------------------------------------------------------------------------

const INVOICE_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "VIEWED", label: "Viewed" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const ESTIMATE_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "VIEWED", label: "Viewed" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
] as const;

type TriggerDoc = "invoice" | "estimate";
type TriggerStatus =
  | (typeof INVOICE_STATUSES)[number]["value"]
  | (typeof ESTIMATE_STATUSES)[number]["value"];

function statusesFor(doc: TriggerDoc) {
  return doc === "invoice" ? INVOICE_STATUSES : ESTIMATE_STATUSES;
}

function defaultStatusFor(doc: TriggerDoc): TriggerStatus {
  return doc === "invoice" ? "PAID" : "APPROVED";
}

const DEFAULT_TEMPLATES: Record<
  TriggerDoc,
  Record<string, { title: string; description: string }>
> = {
  invoice: {
    DRAFT: {
      title: "Review draft invoice {{invoice.number}} for {{customer.name}}",
      description:
        "Invoice {{invoice.number}} has been created as a draft. Review and send when ready.",
    },
    SENT: {
      title:
        "Follow up on invoice {{invoice.number}} sent to {{customer.name}}",
      description:
        "Invoice {{invoice.number}} was sent to {{customer.name}}. Follow up if no response within a few days.",
    },
    VIEWED: {
      title: "Invoice {{invoice.number}} viewed by {{customer.name}}",
      description:
        "{{customer.name}} has viewed invoice {{invoice.number}}. Good time to follow up.",
    },
    PAID: {
      title:
        "Invoice {{invoice.number}} paid — start work for {{customer.name}}",
      description:
        "Payment received for invoice {{invoice.number}}. Begin production or fulfillment.",
    },
    OVERDUE: {
      title:
        "Overdue invoice {{invoice.number}} — follow up with {{customer.name}}",
      description:
        "Invoice {{invoice.number}} is overdue. Contact {{customer.name}} to arrange payment.",
    },
    CANCELLED: {
      title: "Invoice {{invoice.number}} cancelled for {{customer.name}}",
      description:
        "Invoice {{invoice.number}} has been cancelled. Follow up with {{customer.name}} if needed.",
    },
  },
  estimate: {
    DRAFT: {
      title: "Review draft estimate {{estimate.number}} for {{customer.name}}",
      description:
        "Estimate {{estimate.number}} is in draft. Review before sending to {{customer.name}}.",
    },
    SENT: {
      title:
        "Follow up on estimate {{estimate.number}} sent to {{customer.name}}",
      description:
        "Estimate {{estimate.number}} was sent to {{customer.name}}. Follow up if no response.",
    },
    VIEWED: {
      title: "Estimate {{estimate.number}} viewed by {{customer.name}}",
      description:
        "{{customer.name}} has viewed estimate {{estimate.number}}. Good time to reach out.",
    },
    APPROVED: {
      title:
        "Start work for {{customer.name}} — estimate {{estimate.number}} approved",
      description:
        "Estimate {{estimate.number}} was approved by {{customer.name}}. Proceed with production.",
    },
    REJECTED: {
      title: "Estimate {{estimate.number}} rejected by {{customer.name}}",
      description:
        "{{customer.name}} rejected estimate {{estimate.number}}. Follow up to understand their concerns.",
    },
    EXPIRED: {
      title:
        "Estimate {{estimate.number}} expired — follow up with {{customer.name}}",
      description:
        "Estimate {{estimate.number}} has expired. Contact {{customer.name}} to renew or discuss.",
    },
  },
};

function defaultTemplateFor(doc: TriggerDoc, status: TriggerStatus) {
  return DEFAULT_TEMPLATES[doc][status] ?? { title: "", description: "" };
}

// ---------------------------------------------------------------------------
// Layout wrapper
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
// Shared select component
// ---------------------------------------------------------------------------

function NativeSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
    >
      {children}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Rule card (display + expand-to-edit)
// ---------------------------------------------------------------------------

type Stage = { id: string; name: string; isSystem: boolean };

type Rule = {
  id: string;
  isEnabled: boolean;
  triggerDocument: string;
  triggerStatus: string;
  taskStageId: string | null;
  taskTitleTemplate: string;
  taskDescriptionTemplate: string | null;
  assignStrategy: string;
  dueDateOffsetDays: number | null;
};

function docLabel(doc: string) {
  return doc === "invoice" ? "Invoice" : "Estimate";
}

function statusLabel(doc: string, status: string) {
  const list = doc === "invoice" ? INVOICE_STATUSES : ESTIMATE_STATUSES;
  return list.find((s) => s.value === status)?.label ?? status;
}

function RuleCard({
  rule,
  stages,
  onDelete,
  isDeletePending,
}: {
  rule: Rule;
  stages: Stage[];
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const [doc, setDoc] = useState<TriggerDoc>(
    rule.triggerDocument as TriggerDoc,
  );
  const [status, setStatus] = useState<TriggerStatus>(
    rule.triggerStatus as TriggerStatus,
  );
  const [stageId, setStageId] = useState(rule.taskStageId ?? "");
  const [title, setTitle] = useState(rule.taskTitleTemplate);
  const [description, setDescription] = useState(
    rule.taskDescriptionTemplate ?? "",
  );
  const [dueDays, setDueDays] = useState(
    rule.dueDateOffsetDays !== null ? String(rule.dueDateOffsetDays) : "",
  );

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries(trpc.automations.listRules.queryOptions());
  }

  const toggle = useMutation(
    trpc.automations.updateRule.mutationOptions({
      onSuccess: invalidate,
      onError: (e) =>
        toast.error("Couldn't update", { description: e.message }),
    }),
  );

  const update = useMutation(
    trpc.automations.updateRule.mutationOptions({
      onSuccess: () => {
        invalidate();
        setExpanded(false);
        toast.success("Automation updated.");
      },
      onError: (e) => toast.error("Couldn't save", { description: e.message }),
    }),
  );

  // When document type changes, reset status to the most useful default
  function handleDocChange(newDoc: TriggerDoc) {
    setDoc(newDoc);
    setStatus(defaultStatusFor(newDoc));
  }

  const defaultStage = stages.find((s) => s.isSystem);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* ── Summary row ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Switch
          checked={rule.isEnabled}
          onCheckedChange={(v) => toggle.mutate({ id: rule.id, isEnabled: v })}
          disabled={toggle.isPending}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {rule.taskTitleTemplate}
          </p>
          <p className="text-xs text-muted-foreground">
            {docLabel(rule.triggerDocument)}{" "}
            <span className="font-medium">
              {statusLabel(rule.triggerDocument, rule.triggerStatus)}
            </span>
            {" → "}
            <span className="font-medium">Create Task</span>
            {rule.taskStageId
              ? ` · ${stages.find((s) => s.id === rule.taskStageId)?.name ?? "Unknown stage"}`
              : defaultStage
                ? ` · ${defaultStage.name}`
                : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
            title={expanded ? "Collapse" : "Edit"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            title="Delete"
            disabled={isDeletePending}
            onClick={() => onDelete(rule.id)}
            className={cn(
              "rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-destructive",
              isDeletePending && "opacity-40",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Edit panel ── */}
      {expanded ? (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {/* Trigger */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Trigger
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Document</Label>
                <NativeSelect
                  value={doc}
                  onChange={(v) => handleDocChange(v as TriggerDoc)}
                >
                  <option value="invoice">Invoice</option>
                  <option value="estimate">Estimate</option>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">When status becomes</Label>
                <NativeSelect
                  value={status}
                  onChange={(value) => setStatus(value as TriggerStatus)}
                >
                  {statusesFor(doc).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          </div>

          {/* Action */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Action — Create Task
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Title template</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow up on {{invoice.number}} — {{customer.name}}"
                  className="h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Placeholders:{" "}
                  <code className="font-mono text-xs">
                    {"{{invoice.number}}"}
                  </code>{" "}
                  <code className="font-mono text-xs">
                    {"{{customer.name}}"}
                  </code>
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Description template</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                  className="min-h-16 text-sm"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Stage</Label>
                <NativeSelect value={stageId} onChange={setStageId}>
                  {defaultStage ? (
                    <option value="">{defaultStage.name} (default)</option>
                  ) : null}
                  {stages
                    .filter((s) => !s.isSystem)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Due in (days from today)</Label>
                <Input
                  value={dueDays}
                  onChange={(e) => setDueDays(e.target.value)}
                  type="number"
                  min={0}
                  max={365}
                  placeholder="e.g. 3  (leave empty = no due date)"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              loading={update.isPending}
              disabled={update.isPending || !title.trim()}
              onClick={() =>
                update.mutate({
                  id: rule.id,
                  triggerDocument: doc,
                  triggerStatus: status,
                  taskTitleTemplate: title.trim(),
                  taskDescriptionTemplate: description.trim() || null,
                  taskStageId: stageId || null,
                  dueDateOffsetDays: dueDays ? Number(dueDays) : null,
                })
              }
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add rule inline form
// ---------------------------------------------------------------------------

function AddRuleForm({
  stages,
  onSave,
  onCancel,
  isPending,
}: {
  stages: Stage[];
  onSave: (data: {
    triggerDocument: TriggerDoc;
    triggerStatus: TriggerStatus;
    taskTitleTemplate: string;
    taskDescriptionTemplate: string | null;
    taskStageId: string | null;
    dueDateOffsetDays: number | null;
  }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const initDoc: TriggerDoc = "invoice";
  const initStatus = defaultStatusFor(initDoc);
  const [doc, setDoc] = useState<TriggerDoc>(initDoc);
  const [status, setStatus] = useState<TriggerStatus>(initStatus);
  const [stageId, setStageId] = useState("");
  const [title, setTitle] = useState(
    () => defaultTemplateFor(initDoc, initStatus).title,
  );
  const [description, setDescription] = useState(
    () => defaultTemplateFor(initDoc, initStatus).description,
  );
  const [dueDays, setDueDays] = useState("");

  function handleDocChange(newDoc: TriggerDoc) {
    const newStatus = defaultStatusFor(newDoc);
    const tpl = defaultTemplateFor(newDoc, newStatus);
    setDoc(newDoc);
    setStatus(newStatus);
    setTitle(tpl.title);
    setDescription(tpl.description);
  }

  function handleStatusChange(newStatus: TriggerStatus) {
    const tpl = defaultTemplateFor(doc, newStatus);
    setStatus(newStatus);
    setTitle(tpl.title);
    setDescription(tpl.description);
  }

  const defaultStage = stages.find((s) => s.isSystem);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">New rule</p>

      {/* Trigger */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Trigger
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Document</Label>
            <NativeSelect
              value={doc}
              onChange={(v) => handleDocChange(v as TriggerDoc)}
            >
              <option value="invoice">Invoice</option>
              <option value="estimate">Estimate</option>
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">When status becomes</Label>
            <NativeSelect
              value={status}
              onChange={(value) => handleStatusChange(value as TriggerStatus)}
            >
              {statusesFor(doc).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Action */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Action — Create Task
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Title template</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up on {{invoice.number}} — {{customer.name}}"
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Description template</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="min-h-14 text-sm"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Stage</Label>
            <NativeSelect value={stageId} onChange={setStageId}>
              {defaultStage ? (
                <option value="">{defaultStage.name} (default)</option>
              ) : null}
              {stages
                .filter((s) => !s.isSystem)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Due in (days from today)</Label>
            <Input
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              type="number"
              min={0}
              max={365}
              placeholder="e.g. 3  (leave empty = no due date)"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          loading={isPending}
          disabled={isPending || !title.trim()}
          onClick={() =>
            onSave({
              triggerDocument: doc,
              triggerStatus: status,
              taskTitleTemplate: title.trim(),
              taskDescriptionTemplate: description.trim() || null,
              taskStageId: stageId || null,
              dueDateOffsetDays: dueDays ? Number(dueDays) : null,
            })
          }
        >
          Add rule
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AutomationsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: rules = [], isPending } = useQuery(
    trpc.automations.listRules.queryOptions(),
  );
  const { data: stages = [] } = useQuery(trpc.tasks.listStages.queryOptions());

  const [showAdd, setShowAdd] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries(trpc.automations.listRules.queryOptions());
  }

  const create = useMutation(
    trpc.automations.createRule.mutationOptions({
      onSuccess: () => {
        invalidate();
        setShowAdd(false);
        toast.success("Automation rule added.");
      },
      onError: (e) =>
        toast.error("Couldn't add rule", { description: e.message }),
    }),
  );

  const remove = useMutation(
    trpc.automations.deleteRule.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Rule removed.");
      },
      onError: (e) =>
        toast.error("Couldn't delete", { description: e.message }),
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
      title="Workflow Automations"
      description="Automatically create tasks when a document reaches a specific status. Each organization configures its own rules."
    >
      <div className="space-y-4">
        {rules.length === 0 && !showAdd ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              No automation rules yet. Add one below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                stages={stages}
                onDelete={(id) => remove.mutate({ id })}
                isDeletePending={remove.isPending}
              />
            ))}
          </div>
        )}

        {showAdd ? (
          <AddRuleForm
            stages={stages}
            isPending={create.isPending}
            onSave={(data) => create.mutate(data)}
            onCancel={() => setShowAdd(false)}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Add rule
          </Button>
        )}
      </div>
    </SettingsPage>
  );
}

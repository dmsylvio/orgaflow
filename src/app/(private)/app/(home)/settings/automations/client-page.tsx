"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Constants
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

const DEFAULT_TEMPLATES: Record<TriggerDoc, Record<string, { title: string; description: string }>> = {
  invoice: {
    DRAFT: { title: "Review draft invoice {{invoice.number}} for {{customer.name}}", description: "Invoice {{invoice.number}} has been created as a draft. Review and send when ready." },
    SENT: { title: "Follow up on invoice {{invoice.number}} sent to {{customer.name}}", description: "Invoice {{invoice.number}} was sent to {{customer.name}}. Follow up if no response within a few days." },
    VIEWED: { title: "Invoice {{invoice.number}} viewed by {{customer.name}}", description: "{{customer.name}} has viewed invoice {{invoice.number}}. Good time to follow up." },
    PAID: { title: "Invoice {{invoice.number}} paid — start work for {{customer.name}}", description: "Payment received for invoice {{invoice.number}}. Begin production or fulfillment." },
    OVERDUE: { title: "Overdue invoice {{invoice.number}} — follow up with {{customer.name}}", description: "Invoice {{invoice.number}} is overdue. Contact {{customer.name}} to arrange payment." },
    CANCELLED: { title: "Invoice {{invoice.number}} cancelled for {{customer.name}}", description: "Invoice {{invoice.number}} has been cancelled. Follow up with {{customer.name}} if needed." },
  },
  estimate: {
    DRAFT: { title: "Review draft estimate {{estimate.number}} for {{customer.name}}", description: "Estimate {{estimate.number}} is in draft. Review before sending to {{customer.name}}." },
    SENT: { title: "Follow up on estimate {{estimate.number}} sent to {{customer.name}}", description: "Estimate {{estimate.number}} was sent to {{customer.name}}. Follow up if no response." },
    VIEWED: { title: "Estimate {{estimate.number}} viewed by {{customer.name}}", description: "{{customer.name}} has viewed estimate {{estimate.number}}. Good time to reach out." },
    APPROVED: { title: "Start work for {{customer.name}} — estimate {{estimate.number}} approved", description: "Estimate {{estimate.number}} was approved by {{customer.name}}. Proceed with production." },
    REJECTED: { title: "Estimate {{estimate.number}} rejected by {{customer.name}}", description: "{{customer.name}} rejected estimate {{estimate.number}}. Follow up to understand their concerns." },
    EXPIRED: { title: "Estimate {{estimate.number}} expired — follow up with {{customer.name}}", description: "Estimate {{estimate.number}} has expired. Contact {{customer.name}} to renew or discuss." },
  },
};

function defaultTemplateFor(doc: TriggerDoc, status: TriggerStatus) {
  return DEFAULT_TEMPLATES[doc][status] ?? { title: "", description: "" };
}

function docLabel(doc: string) {
  return doc === "invoice" ? "Invoice" : "Estimate";
}

function statusLabel(doc: string, status: string) {
  const list = doc === "invoice" ? INVOICE_STATUSES : ESTIMATE_STATUSES;
  return list.find((s) => s.value === status)?.label ?? status;
}

type Stage = { id: string; name: string; isSystem: boolean };

type Rule = {
  id: string;
  isEnabled: boolean;
  triggerDocument: string;
  triggerStatus: string;
  taskStageId: string | null;
  taskTitleTemplate: string;
  taskDescriptionTemplate: string | null;
  dueDateOffsetDays: number | null;
};

// ---------------------------------------------------------------------------
// Shared select component
// ---------------------------------------------------------------------------

function NativeSelect({
  id,
  value,
  onChange,
  children,
  className,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
    >
      {children}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Helpers hint
// ---------------------------------------------------------------------------

const PLACEHOLDERS_HINT = (
  <p className="text-xs text-muted-foreground">
    Placeholders:{" "}
    <code className="font-mono">{"{{invoice.number}}"}</code>{" "}
    <code className="font-mono">{"{{estimate.number}}"}</code>{" "}
    <code className="font-mono">{"{{customer.name}}"}</code>
  </p>
);

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateRuleDialog({
  open,
  onOpenChange,
  stages,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stages: Stage[];
  onSuccess: () => void;
}) {
  const initDoc: TriggerDoc = "invoice";
  const initStatus = defaultStatusFor(initDoc);
  const initTpl = defaultTemplateFor(initDoc, initStatus);

  const [doc, setDoc] = useState<TriggerDoc>(initDoc);
  const [status, setStatus] = useState<TriggerStatus>(initStatus);
  const [stageId, setStageId] = useState("");
  const [title, setTitle] = useState(initTpl.title);
  const [description, setDescription] = useState(initTpl.description);
  const [dueDays, setDueDays] = useState("");
  const trpc = useTRPC();

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

  function reset() {
    setDoc(initDoc);
    setStatus(initStatus);
    setStageId("");
    setTitle(initTpl.title);
    setDescription(initTpl.description);
    setDueDays("");
  }

  const create = useMutation(
    trpc.automations.createRule.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        reset();
        toast.success("Automation rule added.");
      },
      onError: (e) =>
        toast.error("Couldn't add rule", { description: e.message }),
    }),
  );

  const defaultStage = stages.find((s) => s.isSystem);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Automation Rule</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-5">
          {/* Trigger */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Trigger
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cr-doc">Document</Label>
                <NativeSelect id="cr-doc" value={doc} onChange={(v) => handleDocChange(v as TriggerDoc)}>
                  <option value="invoice">Invoice</option>
                  <option value="estimate">Estimate</option>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cr-status">When status becomes</Label>
                <NativeSelect id="cr-status" value={status} onChange={(v) => handleStatusChange(v as TriggerStatus)}>
                  {statusesFor(doc).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Action — Create Task
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="cr-title">Title template</Label>
              <Input
                id="cr-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Follow up on {{invoice.number}}"
                autoFocus
              />
              {PLACEHOLDERS_HINT}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cr-desc">Description template <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="cr-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cr-stage">Stage</Label>
                <NativeSelect id="cr-stage" value={stageId} onChange={setStageId}>
                  {defaultStage ? (
                    <option value="">{defaultStage.name} (default)</option>
                  ) : null}
                  {stages.filter((s) => !s.isSystem).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cr-due">Due in (days)</Label>
                <Input
                  id="cr-due"
                  value={dueDays}
                  onChange={(e) => setDueDays(e.target.value)}
                  type="number"
                  min={0}
                  max={365}
                  placeholder="Leave empty = no due date"
                />
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            loading={create.isPending}
            disabled={create.isPending || !title.trim()}
            onClick={() =>
              create.mutate({
                triggerDocument: doc,
                triggerStatus: status,
                taskTitleTemplate: title.trim(),
                taskDescriptionTemplate: description.trim() || null,
                taskStageId: stageId || null,
                dueDateOffsetDays: dueDays ? Number(dueDays) : null,
              })
            }
          >
            Add Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Dialog
// ---------------------------------------------------------------------------

function EditRuleDialog({
  rule,
  open,
  onOpenChange,
  stages,
  onSuccess,
}: {
  rule: Rule;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stages: Stage[];
  onSuccess: () => void;
}) {
  const [doc, setDoc] = useState<TriggerDoc>(rule.triggerDocument as TriggerDoc);
  const [status, setStatus] = useState<TriggerStatus>(rule.triggerStatus as TriggerStatus);
  const [stageId, setStageId] = useState(rule.taskStageId ?? "");
  const [title, setTitle] = useState(rule.taskTitleTemplate);
  const [description, setDescription] = useState(rule.taskDescriptionTemplate ?? "");
  const [dueDays, setDueDays] = useState(rule.dueDateOffsetDays !== null ? String(rule.dueDateOffsetDays) : "");
  const trpc = useTRPC();

  function handleDocChange(newDoc: TriggerDoc) {
    setDoc(newDoc);
    setStatus(defaultStatusFor(newDoc));
  }

  const update = useMutation(
    trpc.automations.updateRule.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Automation updated.");
      },
      onError: (e) =>
        toast.error("Couldn't save", { description: e.message }),
    }),
  );

  const defaultStage = stages.find((s) => s.isSystem);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Automation Rule</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-5">
          {/* Trigger */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Trigger
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="er-doc">Document</Label>
                <NativeSelect id="er-doc" value={doc} onChange={(v) => handleDocChange(v as TriggerDoc)}>
                  <option value="invoice">Invoice</option>
                  <option value="estimate">Estimate</option>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="er-status">When status becomes</Label>
                <NativeSelect id="er-status" value={status} onChange={(v) => setStatus(v as TriggerStatus)}>
                  {statusesFor(doc).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Action — Create Task
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="er-title">Title template</Label>
              <Input
                id="er-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              {PLACEHOLDERS_HINT}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-desc">Description template <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="er-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="er-stage">Stage</Label>
                <NativeSelect id="er-stage" value={stageId} onChange={setStageId}>
                  {defaultStage ? (
                    <option value="">{defaultStage.name} (default)</option>
                  ) : null}
                  {stages.filter((s) => !s.isSystem).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="er-due">Due in (days)</Label>
                <Input
                  id="er-due"
                  value={dueDays}
                  onChange={(e) => setDueDays(e.target.value)}
                  type="number"
                  min={0}
                  max={365}
                  placeholder="Leave empty = no due date"
                />
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Rule row
// ---------------------------------------------------------------------------

function RuleRow({
  rule,
  stages,
  onEdit,
  onDelete,
  onToggle,
  isDeletePending,
  isTogglePending,
}: {
  rule: Rule;
  stages: Stage[];
  onEdit: (rule: Rule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  isDeletePending: boolean;
  isTogglePending: boolean;
}) {
  const defaultStage = stages.find((s) => s.isSystem);
  const stageName = rule.taskStageId
    ? (stages.find((s) => s.id === rule.taskStageId)?.name ?? "Unknown")
    : (defaultStage?.name ?? "");

  return (
    <tr className="group border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-2 w-10">
        <Switch
          checked={rule.isEnabled}
          onCheckedChange={(v) => onToggle(rule.id, v)}
          disabled={isTogglePending}
        />
      </td>
      <td className="py-3 px-2">
        <p className="text-sm font-medium text-foreground truncate max-w-xs">
          {rule.taskTitleTemplate}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {docLabel(rule.triggerDocument)}{" "}
          <span className="font-medium">{statusLabel(rule.triggerDocument, rule.triggerStatus)}</span>
          {" → Create Task"}
          {stageName ? ` · ${stageName}` : ""}
        </p>
      </td>
      <td className="py-3 pl-2 pr-4 w-20">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(rule)}
            className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
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
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="mb-8" />
      {children}
    </div>
  );
}

export default function AutomationsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { allowed } = usePlanCheck("scale");

  const { data: rules = [], isLoading } = useQuery({
    ...trpc.automations.listRules.queryOptions(),
    enabled: allowed,
  });
  const { data: stages = [] } = useQuery({
    ...trpc.tasks.listStages.queryOptions(),
    enabled: allowed,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rule | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <PlanGate requiredPlan="scale">
    <SettingsPage
      title="Workflow Automations"
      description="Automatically create tasks when a document reaches a specific status."
    >
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {rules.length} rule{rules.length !== 1 ? "s" : ""}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add rule
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No automation rules yet. Add one above.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <tbody>
              {rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  stages={stages}
                  onEdit={setEditTarget}
                  onDelete={(id) => remove.mutate({ id })}
                  onToggle={(id, enabled) => toggle.mutate({ id, isEnabled: enabled })}
                  isDeletePending={remove.isPending}
                  isTogglePending={toggle.isPending}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateRuleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        stages={stages}
        onSuccess={invalidate}
      />

      {editTarget ? (
        <EditRuleDialog
          rule={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          stages={stages}
          onSuccess={invalidate}
        />
      ) : null}
    </SettingsPage>
    </PlanGate>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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

const NOTE_TYPE_LABELS: Record<"invoice" | "estimate" | "payment", string> = {
  invoice: "Invoice",
  estimate: "Estimate",
  payment: "Payment",
};

const NOTE_TYPES = ["invoice", "estimate", "payment"] as const;
type NoteType = (typeof NOTE_TYPES)[number];

type Note = {
  id: string;
  name: string;
  type: NoteType;
  content: string;
};

function TypeSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: NoteType;
  onChange: (v: NoteType) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as NoteType)}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {NOTE_TYPES.map((t) => (
        <option key={t} value={t}>
          {NOTE_TYPE_LABELS[t]}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateNoteDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<NoteType>("invoice");
  const [content, setContent] = useState("");
  const trpc = useTRPC();

  const create = useMutation(
    trpc.settings.createNote.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        setName("");
        setType("invoice");
        setContent("");
        toast.success("Note added.");
      },
      onError: (e) =>
        toast.error("Couldn't add note", { description: e.message }),
    }),
  );

  const canSubmit = name.trim().length > 0 && content.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cn-name">Name</Label>
            <Input
              id="cn-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payment terms"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cn-type">Type</Label>
            <TypeSelect id="cn-type" value={type} onChange={setType} />
            <p className="text-xs text-muted-foreground">
              This note will be available when creating a document of this type.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cn-content">Content</Label>
            <Textarea
              id="cn-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note content…"
              rows={4}
            />
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
            disabled={create.isPending || !canSubmit}
            onClick={() =>
              create.mutate({
                name: name.trim(),
                type,
                content: content.trim(),
              })
            }
          >
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Dialog
// ---------------------------------------------------------------------------

function EditNoteDialog({
  note,
  open,
  onOpenChange,
  onSuccess,
}: {
  note: Note;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(note.name);
  const [type, setType] = useState<NoteType>(note.type);
  const [content, setContent] = useState(note.content);
  const trpc = useTRPC();

  const update = useMutation(
    trpc.settings.updateNote.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Note updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update note", { description: e.message }),
    }),
  );

  const canSubmit = name.trim().length > 0 && content.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="en-name">Name</Label>
            <Input
              id="en-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="en-type">Type</Label>
            <TypeSelect id="en-type" value={type} onChange={setType} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="en-content">Content</Label>
            <Textarea
              id="en-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
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
            disabled={update.isPending || !canSubmit}
            onClick={() =>
              update.mutate({
                id: note.id,
                name: name.trim(),
                type,
                content: content.trim(),
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
// Row
// ---------------------------------------------------------------------------

function NoteRow({
  note,
  onDelete,
  isDeletePending,
  onEdit,
}: {
  note: Note;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  onEdit: (note: Note) => void;
}) {
  return (
    <tr className="group border-b border-border last:border-0 align-top">
      <td className="py-3 pl-4 pr-2 w-1/4">
        <span className="text-sm font-medium text-foreground">{note.name}</span>
      </td>
      <td className="py-3 px-2 w-28">
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {NOTE_TYPE_LABELS[note.type]}
        </span>
      </td>
      <td className="py-3 px-2">
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {note.content}
        </span>
      </td>
      <td className="py-3 pl-2 pr-4 w-20">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(note)}
            className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Delete"
            disabled={isDeletePending}
            onClick={() => onDelete(note.id)}
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

export default function NotesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: items = [], isPending } = useQuery(
    trpc.settings.listNotes.queryOptions(),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Note | null>(null);

  function invalidate() {
    queryClient.invalidateQueries(trpc.settings.listNotes.queryOptions());
  }

  const remove = useMutation(
    trpc.settings.deleteNote.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Note removed.");
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
      title="Notes"
      description="Save time by creating notes and reusing them on your invoices, estimates & payments."
    >
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {items.length} note{items.length !== 1 ? "s" : ""}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No notes yet. Add one above.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 w-1/4">
                  Name
                </th>
                <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 w-28">
                  Type
                </th>
                <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Content
                </th>
                <th className="py-2 pl-2 pr-4 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  onEdit={setEditTarget}
                  onDelete={(id) => remove.mutate({ id })}
                  isDeletePending={remove.isPending}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateNoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={invalidate}
      />

      {editTarget ? (
        <EditNoteDialog
          note={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          onSuccess={invalidate}
        />
      ) : null}
    </SettingsPage>
  );
}

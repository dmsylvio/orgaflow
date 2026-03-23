"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  value,
  onChange,
  className,
}: {
  value: NoteType;
  onChange: (v: NoteType) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as NoteType)}
      className={cn(
        "h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
    >
      {NOTE_TYPES.map((t) => (
        <option key={t} value={t}>
          {NOTE_TYPE_LABELS[t]}
        </option>
      ))}
    </select>
  );
}

function NoteRow({
  note,
  onDelete,
  isDeletePending,
}: {
  note: Note;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(note.name);
  const [type, setType] = useState<NoteType>(note.type);
  const [content, setContent] = useState(note.content);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const update = useMutation(
    trpc.settings.updateNote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.settings.listNotes.queryOptions());
        setEditing(false);
        toast.success("Note updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update", { description: e.message }),
    }),
  );

  const canSave = name.trim().length > 0 && content.trim().length > 0;

  return (
    <tr className="group border-b border-border last:border-0 align-top">
      <td className="py-3 pl-4 pr-2 w-1/4">
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium text-foreground">
            {note.name}
          </span>
        )}
      </td>
      <td className="py-3 px-2 w-32">
        {editing ? (
          <TypeSelect value={type} onChange={setType} />
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {NOTE_TYPE_LABELS[note.type]}
          </span>
        )}
      </td>
      <td className="py-3 px-2">
        {editing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-16 text-sm"
            rows={3}
          />
        ) : (
          <span className="text-sm text-muted-foreground whitespace-pre-wrap">
            {note.content}
          </span>
        )}
      </td>
      <td className="py-3 pl-2 pr-4 w-24">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                loading={update.isPending}
                disabled={update.isPending || !canSave}
                onClick={() =>
                  update.mutate({
                    id: note.id,
                    name: name.trim(),
                    type,
                    content: content.trim(),
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
                  setName(note.name);
                  setType(note.type);
                  setContent(note.content);
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
                onClick={() => onDelete(note.id)}
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

export default function NotesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: items = [], isPending } = useQuery(
    trpc.settings.listNotes.queryOptions(),
  );

  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<NoteType>("invoice");
  const [addContent, setAddContent] = useState("");

  function resetAdd() {
    setAddName("");
    setAddType("invoice");
    setAddContent("");
    setShowAdd(false);
  }

  const create = useMutation(
    trpc.settings.createNote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.settings.listNotes.queryOptions());
        resetAdd();
        toast.success("Note added.");
      },
      onError: (e) =>
        toast.error("Couldn't add note", { description: e.message }),
    }),
  );

  const remove = useMutation(
    trpc.settings.deleteNote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.settings.listNotes.queryOptions());
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

  const canSubmit = addName.trim().length > 0 && addContent.trim().length > 0;

  return (
    <SettingsPage
      title="Notes"
      description="Save time by creating notes and reusing them on your invoices, estimates & payments."
    >
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {items.length} note{items.length !== 1 ? "s" : ""}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowAdd(true)}
            disabled={showAdd}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {items.length === 0 && !showAdd ? (
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
                <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 w-32">
                  Type
                </th>
                <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Notes
                </th>
                <th className="py-2 pl-2 pr-4 w-24" />
              </tr>
            </thead>
            <tbody>
              {items.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  onDelete={(id) => remove.mutate({ id })}
                  isDeletePending={remove.isPending}
                />
              ))}

              {showAdd ? (
                <tr className="border-t border-border align-top">
                  <td className="py-2 pl-4 pr-2">
                    <Input
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="e.g. Payment terms"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") resetAdd();
                      }}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <TypeSelect value={addType} onChange={setAddType} />
                  </td>
                  <td className="py-2 px-2">
                    <Textarea
                      value={addContent}
                      onChange={(e) => setAddContent(e.target.value)}
                      placeholder="Note content…"
                      className="min-h-16 text-sm"
                      rows={3}
                    />
                  </td>
                  <td className="py-2 pl-2 pr-4">
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        loading={create.isPending}
                        disabled={create.isPending || !canSubmit}
                        onClick={() =>
                          create.mutate({
                            name: addName.trim(),
                            type: addType,
                            content: addContent.trim(),
                          })
                        }
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={resetAdd}
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

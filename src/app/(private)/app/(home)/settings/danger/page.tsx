"use client";

import { useMutation } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
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
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export default function DangerZonePage() {
  const trpc = useTRPC();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const deleteOrg = useMutation(
    trpc.settings.deleteOrganization.mutationOptions({
      onSuccess: () => {
        toast.success("Organization deleted.");
        router.replace("/app/workspace");
      },
      onError: (e) =>
        toast.error("Couldn't delete organization", { description: e.message }),
    }),
  );

  function handleOpenChange(next: boolean) {
    if (!next) setValue("");
    setOpen(next);
  }

  return (
    <SettingsPage
      title="Danger zone"
      description="Irreversible actions that permanently affect your organization."
    >
      <section className="rounded-xl border border-destructive/40 bg-card shadow-sm">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <TriangleAlert className="h-4 w-4 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Delete this organization
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently deletes the organization and all associated data —
              customers, invoices, estimates, items, members, and settings. This
              action cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="shrink-0"
            onClick={() => setOpen(true)}
          >
            Delete organization
          </Button>
        </div>
      </section>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the organization and all its data.
              There is no way to recover it.
              <br />
              <br />
              Type{" "}
              <span className="font-mono font-semibold text-foreground">
                confirm
              </span>{" "}
              below to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="confirm"
            className="mt-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && value === "confirm") {
                deleteOrg.mutate({ confirm: "confirm" });
              }
            }}
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOrg.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              loading={deleteOrg.isPending}
              disabled={deleteOrg.isPending || value !== "confirm"}
              onClick={() => deleteOrg.mutate({ confirm: "confirm" })}
            >
              Yes, delete organization
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsPage>
  );
}

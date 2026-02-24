// src/app/app/org/switch/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "org"
  );
}
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export default function OrgSwitchPage() {
  const router = useRouter();
  const myOrgs = trpc.org.listMine.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const current = trpc.org.current.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const switchMut = trpc.org.switch.useMutation();
  const createMut = trpc.org.create.useMutation();

  const [openCreate, setOpenCreate] = useState(false);
  const [orgName, setOrgName] = useState("");

  const onSwitch = async (orgId: string) => {
    await switchMut.mutateAsync({ orgId });
    router.refresh();
    router.push("/app");
  };

  const onCreate = async () => {
    if (!orgName.trim()) return;
    const name = orgName.trim();
    const slug = slugify(name);
    await createMut.mutateAsync({
      name,
      slug: slug.length >= 2 ? slug : "org",
    });
    setOpenCreate(false);
    setOrgName("");
    router.push("/app"); // activeOrgId has already been saved on the server
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Select organization</h1>
        <p className="text-sm text-muted-foreground">
          Choose an organization to continue. You can also create a new one.
        </p>
      </div>

      <div className="grid gap-3">
        {myOrgs.isLoading ? <p>Loading...</p> : null}
        {myOrgs.error ? (
          <div className="text-sm text-red-600">
            Error: {myOrgs.error.message}
          </div>
        ) : null}

        <div className="grid sm:grid-cols-2 gap-3">
          {(myOrgs.data ?? []).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onSwitch(o.id)}
              className={cn(
                "rounded-lg border p-4 text-left hover:bg-accent",
                current.data?.id === o.id && "border-foreground",
              )}
            >
              <div className="font-medium">{o.name}</div>
              <div className="text-xs text-muted-foreground">{o.slug}</div>
              {o.isOwner ? (
                <div className="mt-2 inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
                  Owner
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
                  Member
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button variant="outline">Create new organization</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New organization</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <label htmlFor="org-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme LLC"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenCreate(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={onCreate}
                  disabled={createMut.isPending || !orgName.trim()}
                >
                  {createMut.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/app")}>
            Back to app
          </Button>
        </div>
      </div>
    </div>
  );
}

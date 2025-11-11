// src/app/app/org/switch/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/ib/trpc/client";

export default function OrgSwitchPage() {
  const router = useRouter();
  const myOrgs = trpc.org.listMine.useQuery(undefined, { refetchOnWindowFocus: false });
  const current = trpc.org.current.useQuery(undefined, { refetchOnWindowFocus: false });

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
    const { org } = await createMut.mutateAsync({ name: orgName.trim() });
    setOpenCreate(false);
    setOrgName("");
    router.push("/app"); // activeOrgId já foi salvo no server
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Selecionar organização</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma organização para continuar. Você também pode criar uma nova.
        </p>
      </div>

      <div className="grid gap-3">
        {myOrgs.isLoading ? <p>Carregando...</p> : null}
        {myOrgs.error ? (
          <div className="text-sm text-red-600">Erro: {myOrgs.error.message}</div>
        ) : null}

        <div className="grid sm:grid-cols-2 gap-3">
          {(myOrgs.data ?? []).map((o) => (
            <button
              key={o.id}
              onClick={() => onSwitch(o.id)}
              className={cn(
                "rounded-lg border p-4 text-left hover:bg-accent",
                current.data?.id === o.id && "border-foreground"
              )}
            >
              <div className="font-medium">{o.name}</div>
              <div className="text-xs text-muted-foreground">{o.slug}</div>
              {o.isOwner ? (
                <div className="mt-2 inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
                  Owner
                </div>
              ) : null}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button variant="outline">Criar nova organização</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova organização</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ex.: Minha Empresa LTDA"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenCreate(false)}>Cancelar</Button>
                <Button onClick={onCreate} disabled={createMut.isPending || !orgName.trim()}>
                  {createMut.isPending ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/app")}>
            Voltar ao app
          </Button>
        </div>
      </div>
    </div>
  );
}

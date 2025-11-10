"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/hooks/useOrg";

export default function OrgSwitchPage() {
  const { orgId, setOrgId } = useOrg();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const saveCookie = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/org/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar cookie");
      setMsg("Cookie salvo!");
    } catch (e: any) {
      setMsg(e?.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const clearCookie = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await fetch("/api/org/set", { method: "DELETE", credentials: "include" });
      setMsg("Cookie removido!");
    } catch {
      setMsg("Erro ao remover cookie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Trocar organização</h1>
      <input
        value={orgId}
        onChange={(e) => setOrgId(e.target.value.trim())}
        placeholder="Cole aqui o orgId"
        className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={saveCookie}
          disabled={loading || !orgId}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar cookie (server)"}
        </Button>
        <Button
          onClick={clearCookie}
          disabled={loading}
          className="rounded-md border px-4 py-2"
        >
          Limpar cookie
        </Button>
        <Button
          onClick={() => router.refresh()}
          className="rounded-md border px-4 py-2"
        >
          Recarregar página
        </Button>
        <Button
          onClick={() => router.push("/app/iam/test")}
          className="rounded-md border px-4 py-2"
        >
          Testar permissões
        </Button>
        <Button
          onClick={() => router.push("/app/customers")}
          className="rounded-md border px-4 py-2"
        >
          Ir para Customers
        </Button>
      </div>

      {msg ? <p className="text-sm text-neutral-700">{msg}</p> : null}

      <p className="text-xs text-neutral-500">
        Dica: o cookie se chama <code>current_org_id</code> (Path=/,
        SameSite=Lax). Em produção, ative <code>secure</code>.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrg } from "@/hooks/useOrg";

type PermissionsResponse =
  | { orgId: string; permissions: string[] }
  | { error: string; code?: string };

export default function IamTestPage() {
  const { orgId, setOrgId } = useOrg();
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<PermissionsResponse | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setResp(null);
    try {
      const res = await fetch("/api/debug/permissions", {
        method: "GET",
        headers: {
          "x-org-id": orgId || "",
        },
        credentials: "include",
      });
      const data = (await res.json()) as PermissionsResponse;
      setResp(data);
    } catch (e) {
      setResp({ error: "Falha inesperada ao consultar permissões" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Teste de Permissões (IAM)</h1>
      <p className="text-sm text-neutral-600">
        Informe o <code>orgId</code> e clique em{" "}
        <strong>Ver minhas permissões</strong>. O header <code>x-org-id</code>{" "}
        será enviado para <code>/api/debug/permissions</code>.
      </p>

      <div className="rounded-lg border p-4 grid gap-3">
        <Label className="text-sm font-medium">Organization ID</Label>
        <Input
          value={orgId}
          onChange={(e) => setOrgId(e.target.value.trim())}
          placeholder="cole aqui o ID da org (ex.: do seed)"
          className="rounded-md border px-3 py-2 outline-none focus:ring"
        />

        <Button
          onClick={handleCheck}
          disabled={loading || !orgId}
          className="w-fit rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {loading ? "Consultando..." : "Ver minhas permissões"}
        </Button>
      </div>

      {/* Resultado */}
      {resp && "error" in resp ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
          <div className="font-medium">Erro</div>
          <div>{resp.error}</div>
          {resp.code ? (
            <div className="opacity-70">code: {resp.code}</div>
          ) : null}
        </div>
      ) : null}

      {resp && "permissions" in resp ? (
        <div className="rounded-lg border p-4">
          <div className="text-sm text-neutral-600 mb-2">
            <div>
              <span className="font-medium">Org:</span> {resp.orgId}
            </div>
            <div>
              <span className="font-medium">Total:</span>{" "}
              {resp.permissions.length}
            </div>
          </div>

          {resp.permissions.length === 0 ? (
            <p className="text-sm text-neutral-500">Sem permissões.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {resp.permissions.map((p) => (
                <li
                  key={p}
                  className="rounded-md border px-2 py-1 bg-neutral-50"
                >
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="text-xs text-neutral-500">
        Dica: do nosso <strong>seed</strong>, use o <code>orgId</code> impresso
        no console. Usuários: <code>owner@xyz.com</code> e{" "}
        <code>member@xyz.com</code> (senha <code>Passw0rd!</code>).
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9:_\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function RolesSettingsPage() {
  // 1) Organizações do usuário
  const orgsQ = trpc.org.listMine.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const [orgId, setOrgId] = useState("");

  useEffect(() => {
    if (!orgId && orgsQ.data?.length) {
      setOrgId(orgsQ.data[0].id);
    }
  }, [orgsQ.data, orgId]);

  // 2) Roles da organização
  const rolesQ = trpc.roles.listByOrg.useQuery(
    { orgId },
    { enabled: !!orgId, refetchOnWindowFocus: false },
  );

  // 3) Catálogo de permissões
  const catalogQ = trpc.permissions.catalog.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // 4) Mutations principais
  const createM = trpc.roles.create.useMutation({
    onSuccess: () => rolesQ.refetch(),
  });
  const updateM = trpc.roles.update.useMutation({
    onSuccess: () => rolesQ.refetch(),
  });
  const deleteM = trpc.roles.delete.useMutation({
    onSuccess: () => rolesQ.refetch(),
  });
  const setPermsM = trpc.roles.setPermissions.useMutation({
    onSuccess: () => rolePermsQ.refetch(),
  });

  // 5) Criação de role
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  useEffect(() => {
    if (!key && name) setKey(slugify(name));
  }, [name, key]);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !name) return;
    createM.mutate({ orgId, name, key: key || undefined });
    setName("");
    setKey("");
  };

  // 6) Editor de permissões por role (usa QUERY com enabled condicional)
  const roles = rolesQ.data ?? [];
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  const rolePermsQ = trpc.roles.getWithPermissions.useQuery(
    { roleId: editingRoleId as string },
    { enabled: !!editingRoleId, refetchOnWindowFocus: false },
  );

  useEffect(() => {
    if (rolePermsQ.data) {
      setSelectedPermIds(rolePermsQ.data.permissions.map((p) => p.id));
    }
  }, [rolePermsQ.data]);

  const currentRole = useMemo(
    () => (editingRoleId ? roles.find((r) => r.id === editingRoleId) : null),
    [editingRoleId, roles],
  );

  const openEditor = (roleId: string) => setEditingRoleId(roleId);

  const togglePerm = (pid: string) => {
    setSelectedPermIds((old) =>
      old.includes(pid) ? old.filter((x) => x !== pid) : [...old, pid],
    );
  };

  const savePerms = async () => {
    if (!editingRoleId) return;
    await setPermsM.mutateAsync({
      roleId: editingRoleId,
      permissionIds: selectedPermIds,
    });
  };

  // 7) Busy e erros
  const isBusy =
    rolesQ.isLoading ||
    orgsQ.isLoading ||
    catalogQ.isLoading ||
    rolePermsQ.isLoading ||
    createM.isPending ||
    updateM.isPending ||
    deleteM.isPending ||
    setPermsM.isPending;

  return (
    <div className="space-y-8">
      {/* Seleção de organização */}
      <section className="space-y-2">
        <h1 className="text-xl font-semibold">Roles</h1>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium">Organização</label>
            <select
              className="mt-1 w-72 border rounded px-3 py-2 bg-white"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              disabled={!orgsQ.data?.length}
            >
              <option value="" disabled>
                Selecione…
              </option>
              {orgsQ.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.isOwner ? " (Owner)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Criar role */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Criar role</h2>
        <form className="flex flex-wrap items-end gap-3" onSubmit={onCreate}>
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input
              className="mt-1 w-64 border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Customer manager"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Key</label>
            <input
              className="mt-1 w-64 border rounded px-3 py-2"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="auto-gerada a partir do nome"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-red-700 text-white px-4 py-2"
            disabled={!name || !orgId || isBusy}
          >
            Criar
          </button>
        </form>
      </section>

      {/* Lista de roles */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Roles da organização</h2>

        {rolesQ.error ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
            <div className="font-medium">Erro</div>
            <div>{rolesQ.error.message}</div>
          </div>
        ) : null}

        <div className="rounded border divide-y bg-white">
          {roles.length ? (
            roles.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-2"
              >
                <div className="text-sm">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-gray-500">{r.key}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditor(r.id)}
                    className="rounded border px-3 py-1 text-sm"
                    disabled={isBusy}
                  >
                    Permissões
                  </button>
                  <button
                    onClick={() => {
                      const newName = prompt("Novo nome da role:", r.name);
                      if (newName && newName.trim()) {
                        updateM.mutate({
                          roleId: r.id,
                          name: newName.trim(),
                        });
                      }
                    }}
                    className="rounded border px-3 py-1 text-sm"
                    disabled={isBusy}
                  >
                    Renomear
                  </button>
                  <button
                    onClick={() => deleteM.mutate({ roleId: r.id })}
                    className="rounded border px-3 py-1 text-sm"
                    disabled={isBusy}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-gray-500">Nenhuma role.</div>
          )}
        </div>
      </section>

      {/* Editor de permissões */}
      {editingRoleId && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Permissões de {currentRole?.name ?? "…"}
          </h2>

          {catalogQ.error ? (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              <div className="font-medium">Erro</div>
              <div>{catalogQ.error.message}</div>
            </div>
          ) : null}

          <div className="rounded border bg-white">
            <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {catalogQ.data?.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedPermIds.includes(p.id)}
                    onChange={() => togglePerm(p.id)}
                    disabled={isBusy}
                  />
                  <span title={p.description ?? ""}>{p.key}</span>
                </label>
              ))}
              {!catalogQ.data?.length && (
                <div className="text-sm text-gray-500">Catálogo vazio.</div>
              )}
            </div>
            <div className="p-3 border-t flex gap-2">
              <button
                onClick={savePerms}
                className="rounded bg-red-700 text-white px-4 py-2"
                disabled={isBusy}
              >
                Salvar permissões
              </button>
              <button
                onClick={() => setEditingRoleId(null)}
                className="rounded border px-4 py-2"
                disabled={isBusy}
              >
                Fechar
              </button>
            </div>
          </div>
        </section>
      )}

      {isBusy ? (
        <div className="text-sm text-gray-500">Processando…</div>
      ) : null}
    </div>
  );
}

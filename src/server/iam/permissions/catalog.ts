// Fonte da verdade (as code) — ajuste recursos/ações aqui
export const RESOURCES = ["customer", "item", "invoice", "estimate"] as const;
export const ACTIONS = ["view", "create", "edit", "delete"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type PermissionKey = `${Resource}:${Action}`;

// Catálogo completo
export const PERMISSIONS: PermissionKey[] = RESOURCES.flatMap((r) =>
  ACTIONS.map((a) => `${r}:${a}` as const),
);

// Implicações padrão: create/edit/delete ⇒ view
export const IMPLIED = new Map<PermissionKey, PermissionKey[]>(
  PERMISSIONS.map((k) => [k, []]),
);
for (const r of RESOURCES) {
  (IMPLIED.get(`${r}:create`) ?? []).push(`${r}:view`);
  (IMPLIED.get(`${r}:edit`) ?? []).push(`${r}:view`);
  (IMPLIED.get(`${r}:delete`) ?? []).push(`${r}:view`);
}

export function isValidPermissionKey(key: string): key is PermissionKey {
  return PERMISSIONS.includes(key as PermissionKey);
}

// Util para UI/admin
export function getPermissionsCatalog() {
  return PERMISSIONS.map((key) => {
    const [resource, action] = key.split(":") as [Resource, Action];
    return { key, resource, action, dependsOn: IMPLIED.get(key) ?? [] };
  });
}

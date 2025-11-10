import type { PermissionKey } from "../permissions/catalog";
import { IMPLIED } from "../permissions/catalog";

/**
 * Expande um conjunto de permissions aplicando implicações (ex.: edit ⇒ view).
 */
export function expandPermissions(keys: Iterable<PermissionKey>) {
  const out = new Set<PermissionKey>();

  const add = (k: PermissionKey) => {
    if (out.has(k)) return;
    out.add(k);
    const deps = IMPLIED.get(k) ?? [];
    for (const d of deps) add(d);
  };

  for (const k of keys) add(k);
  return out;
}

/**
 * Aplica overrides (allow/deny) sobre um Set base.
 * Retorna um novo Set expandido novamente.
 */
export function applyOverrides(
  base: Set<PermissionKey>,
  overrides: { key: PermissionKey; mode: "allow" | "deny" }[],
) {
  const copy = new Set(base);
  for (const ov of overrides) {
    if (ov.mode === "allow") copy.add(ov.key);
    if (ov.mode === "deny") copy.delete(ov.key);
  }
  return expandPermissions(copy);
}

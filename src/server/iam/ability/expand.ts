// src/server/iam/ability/expand.ts
import {
  PERMISSION_BY_KEY,
  type PermissionKey,
  type Ability,
} from "../permissions/catalog";

/**
 * Recebe um conjunto de PermissionKeys e retorna o conjunto de Abilities.
 * Usa apenas o catálogo em memória.
 */
export function expandPermissionKeysToAbilities(
  keys: Iterable<PermissionKey>,
): Set<Ability> {
  const acc = new Set<Ability>();
  for (const key of keys) {
    const def = PERMISSION_BY_KEY.get(key);
    if (!def) continue;
    for (const ab of def.abilities) acc.add(ab);
  }
  return acc;
}

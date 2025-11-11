import {
  type AbilityKey,
  ALL_ABILITIES,
  type AnyAbility,
  PERMISSIONS,
  WILDCARDS,
} from "../permissions/catalog";

// Mapa rápido de dependências cruzadas (inclusive CRUD->view já está no catálogo)
const DEP_MAP: Record<AbilityKey, AbilityKey[]> = PERMISSIONS.reduce(
  (acc, p) => {
    if (p.dependsOn?.length) acc[p.key] = p.dependsOn;
    return acc;
  },
  {} as Record<AbilityKey, AbilityKey[]>,
);

function expandWildcard(a: AnyAbility): AbilityKey[] {
  if (a in WILDCARDS) return WILDCARDS[a as keyof typeof WILDCARDS];
  return [a as AbilityKey];
}

/**
 * Expande uma lista de abilities (da role) aplicando:
 * - curingas (ex.: invoice:*)
 * - dependências cruzadas (ex.: invoice:create ⇒ customer:view, item:view, invoice:view)
 * Retorna um Set final, sem duplicatas.
 */
export function expandAbilities(input: AnyAbility[]): Set<AbilityKey> {
  const out = new Set<AbilityKey>();

  const stack: AbilityKey[] = [];
  // 1) expandir curingas
  for (const a of input) {
    for (const k of expandWildcard(a)) {
      stack.push(k);
    }
  }

  // 2) DFS de dependências
  while (stack.length) {
    const curr = stack.pop()!;
    if (out.has(curr)) continue;
    out.add(curr);
    const deps = DEP_MAP[curr];
    if (deps?.length) {
      for (const d of deps) stack.push(d);
    }
  }

  return out;
}

/**
 * Owner bypass: retorna TODAS as abilities do catálogo.
 */
export function expandAsOwner(): Set<AbilityKey> {
  return new Set(ALL_ABILITIES);
}

/**
 * Mescla múltiplas fontes: várias roles + overrides allow/deny.
 * - rolesAbilities: abilities declaradas das roles do usuário (podem conter curingas)
 * - allow: overrides de allow (chaves específicas; podem conter curingas)
 * - deny: overrides de deny (chaves específicas; podem conter curingas)
 */
export function resolveEffectiveAbilities(
  rolesAbilities: AnyAbility[],
  allow: AnyAbility[] = [],
  deny: AnyAbility[] = [],
  { ownerBypass = false }: { ownerBypass?: boolean } = {},
): Set<AbilityKey> {
  if (ownerBypass) return expandAsOwner();

  const roleSet = expandAbilities(rolesAbilities);
  const allowSet = expandAbilities(allow);
  const denySet = expandAbilities(deny);

  // union roles + allow
  const merged = new Set<AbilityKey>([...roleSet, ...allowSet]);
  // remove denies
  for (const d of denySet) merged.delete(d);

  return merged;
}

// src/components/layout/nav.resolve.ts
import type { MenuConfig, MenuItem, ResolvedMenu } from "./nav.types";

type ResolveInput = {
  config: MenuConfig;
  isOwner: boolean;
  permissions: Set<string>;
  features?: Record<string, boolean>;
};

function canSee(
  isOwner: boolean,
  permissions: Set<string>,
  features: Record<string, boolean> | undefined,
  item: {
    ownerOnly?: boolean;
    ability?: string;
    features?: string[];
  },
) {
  // 1) ownerOnly gate
  if (item.ownerOnly && !isOwner) return false;

  // 2) features gate (always enforced)
  if (item.features?.some((f) => !features?.[f])) return false;

  // 3) Owners can see everything that passed the gates above
  if (isOwner) return true;

  // 4) Non-owner: requires ability when defined
  if (item.ability && !permissions.has(item.ability)) return false;

  return true;
}

export function resolveMenu({
  config,
  isOwner,
  permissions,
  features,
}: ResolveInput): ResolvedMenu {
  const filterSection = <T extends { items: MenuItem[] }>(section: T) => ({
    ...section,
    items: section.items.filter((it) =>
      canSee(isOwner, permissions, features, it),
    ),
  });

  const main = config.main.map(filterSection).filter((s) => s.items.length > 0);
  const settings = config.settings
    .map(filterSection)
    .filter((s) => s.items.length > 0);

  return { main, settings };
}

import { type AbilityContext, canAny } from "./ability";
import type { BaseMenuItem } from "./menu";

export type FilterMenuInput<T extends BaseMenuItem = BaseMenuItem> = {
  items: readonly T[];
  ability: AbilityContext;
  isAuthenticated: boolean;
  enabledFeatures?: Set<string>;
};

function canSeeMenuItem(
  item: BaseMenuItem,
  ability: AbilityContext,
  isAuthenticated: boolean,
  enabledFeatures: Set<string>,
): boolean {
  if (item.feature && !enabledFeatures.has(item.feature)) {
    return false;
  }

  if (item.authOnly) {
    return isAuthenticated;
  }

  if (item.ownerOnly) {
    return ability.isOwner;
  }

  if (!item.permissions?.length) {
    return true;
  }

  return canAny(ability, item.permissions);
}

export function filterMenuByAbility<T extends BaseMenuItem>({
  items,
  ability,
  isAuthenticated,
  enabledFeatures = new Set(),
}: FilterMenuInput<T>): T[] {
  const result: T[] = [];

  for (const item of items) {
    if (!canSeeMenuItem(item, ability, isAuthenticated, enabledFeatures)) {
      continue;
    }

    result.push({ ...item });
  }

  return result;
}

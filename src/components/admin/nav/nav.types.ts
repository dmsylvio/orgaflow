// src/components/admin/nav/nav.types.ts
import type { ComponentType } from "react";

// Icon must be a React component (e.g., lucide-react)
export type IconType = ComponentType<{ className?: string }>;

/**
 * Individual navigation item
 */
export type MenuItem = {
  /** i18n translation key (e.g., "navigation.dashboard") */
  tKey?: string;
  /** Visible label in the menu (fallback when tKey is not used) */
  name: string;
  /** Absolute link within the app (e.g., "/app", "/app/customers") */
  href: string;
  /** Required icon (component) */
  icon: IconType;

  /**
   * If true, only owners can see this item.
   * The owner check is done in resolveMenu.
   */
  ownerOnly?: boolean;

  /**
   * Ability required for users who are NOT owners.
   * For owners, ability is ignored (as long as it passes ownerOnly).
   */
  ability?: string;

  /**
   * Key for badge counter (e.g., "invoicesDue")
   */
  counterKey?: string;

  /**
   * Feature flags required to display the item for any user.
   * If any listed flag is false, the item is hidden even for owners.
   */
  features?: string[];
};

/**
 * Item grouping (e.g., "Sales", "Setup", etc.)
 * `group` is just a numeric/order identifier used in the UI if desired
 */
export type MenuSection = {
  /** Group identifier or order in the UI */
  group: number | string;
  /** Translation key for the group title (e.g., "navigation.group.general") */
  title?: string;
  /** Items belonging to this group */
  items: MenuItem[];
};

/**
 * Full menu configuration (main and settings)
 */
export type MenuConfig = {
  main: MenuSection[];
  settings: MenuSection[];
};

/**
 * Resulting structure after applying visibility rules (owner, ability, features)
 */
export type ResolvedMenu = {
  main: MenuSection[];
  settings: MenuSection[];
};

/**
 * Resolution parameters used by resolveMenu
 * (kept here for shared type reference)
 */
export type ResolveMenuInput = {
  config: MenuConfig;
  isOwner: boolean;
  permissions: Set<string>;
  /** Feature flags active for the tenant/user (e.g., { reports: true }) */
  features?: Record<string, boolean>;
};

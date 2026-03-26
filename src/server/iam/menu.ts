import type { PermissionKey } from "./permissions";

/**
 * Section index in the **main** app menu (`0`, `1`, `2`, …).
 * Same number = same section (no divider between items); increment for a new section.
 */
export type MainMenuGroup = number;

export type BaseMenuItem = {
  key: string;
  label: string;
  href: string;
  icon?: string;
  authOnly?: boolean;
  ownerOnly?: boolean;
  permissions?: PermissionKey[];
  /** If set, item is only shown when this feature is enabled for the org. */
  feature?: string;
};

/** Main sidebar (`/app/*`). Includes a link into the settings area. */
export type MainMenuItem = BaseMenuItem & {
  group: MainMenuGroup;
};

/** Secondary sidebar under `/app/settings/*` (flat list; no numeric grouping). */
export type SettingsMenuItem = BaseMenuItem;

/**
 * Main application menu.
 */
export const appMenu: MainMenuItem[] = [
  {
    key: "app-home",
    label: "Dashboard",
    href: "/app",
    group: 0,
    permissions: ["dashboard:view"],
  },
  {
    key: "customers",
    label: "Customers",
    href: "/app/customers",
    group: 0,
    permissions: ["customer:view"],
  },
  {
    key: "items",
    label: "Items",
    href: "/app/items",
    group: 0,
    permissions: ["item:view"],
  },
  {
    key: "estimates",
    label: "Estimates",
    href: "/app/estimates",
    group: 1,
    permissions: ["estimate:view"],
  },
  {
    key: "invoices",
    label: "Invoices",
    href: "/app/invoices",
    group: 1,
    permissions: ["invoice:view"],
  },
  {
    key: "payments",
    label: "Payments",
    href: "/app/payments",
    group: 1,
    permissions: ["payment:view"],
  },
  {
    key: "expenses",
    label: "Expenses",
    href: "/app/expenses",
    group: 1,
    permissions: ["expense:view"],
  },
  {
    key: "tasks",
    label: "Tasks",
    href: "/app/tasks",
    group: 1,
    permissions: ["task:view"],
    feature: "kanban",
  },
  {
    key: "settings-entry",
    label: "Settings",
    href: "/app/settings",
    group: 4,
    authOnly: true,
  },
];

/**
 * Settings-only navigation (parallel sidebar when inside `/app/settings/*`).
 */
export const settingsMenu: SettingsMenuItem[] = [
  {
    key: "account",
    label: "Account Settings",
    href: "/app/settings/account",
    authOnly: true,
  },
  {
    key: "company",
    label: "Company Settings",
    href: "/app/settings/company",
    ownerOnly: true,
  },
  {
    key: "preferences",
    label: "Preferences",
    href: "/app/settings/preferences",
    ownerOnly: true,
  },
  {
    key: "roles",
    label: "Roles",
    href: "/app/settings/roles",
    ownerOnly: true,
  },
  {
    key: "team",
    label: "Team",
    href: "/app/settings/team",
    ownerOnly: true,
  },
  {
    key: "notifications",
    label: "Notifications",
    href: "/app/settings/notifications",
    ownerOnly: true,
  },
  {
    key: "tax-types",
    label: "Tax types",
    href: "/app/settings/tax-types",
    ownerOnly: true,
  },
  {
    key: "payment-modes",
    label: "Payment modes",
    href: "/app/settings/payment-modes",
    ownerOnly: true,
  },
  {
    key: "notes",
    label: "Notes",
    href: "/app/settings/notes",
    ownerOnly: true,
  },
  {
    key: "task-settings",
    label: "Task Settings",
    href: "/app/settings/kanban",
    ownerOnly: true,
  },
  {
    key: "automations",
    label: "Workflow automations",
    href: "/app/settings/automations",
    ownerOnly: true,
  },
  {
    key: "expense-categories",
    label: "Expense categories",
    href: "/app/settings/expense-categories",
    ownerOnly: true,
  },
  {
    key: "billing",
    label: "Billing & plan",
    href: "/app/settings/billing",
    ownerOnly: true,
  },
  {
    key: "danger",
    label: "Danger zone",
    href: "/app/settings/danger",
    ownerOnly: true,
  },
];

/** Optional section titles for the main menu (by `group`). */
export const APP_MENU_GROUP_LABELS: Partial<Record<MainMenuGroup, string>> = {
  0: "Overview",
  1: "Customers & catalog",
  2: "Documents & Finance",
  4: "System",
};

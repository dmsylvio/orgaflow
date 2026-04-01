/**
 * Canonical catalog of assignable permissions (`resource:action`).
 * Org settings / billing / company are not listed here — enforced via owner policy.
 */

const DEFINITIONS = [
  {
    key: "dashboard:view",
    label: "View dashboard",
    description: "Access the main dashboard.",
    group: "dashboard",
  },
  {
    key: "dashboard:view-prices",
    label: "View prices on dashboard & reports",
    description: "See revenue, expense, and financial metrics on the dashboard and reports pages.",
    group: "dashboard",
  },
  {
    key: "customer:view",
    label: "View customers",
    group: "customers",
  },
  {
    key: "customer:create",
    label: "Create customers",
    group: "customers",
    dependencies: ["customer:view"] as const,
  },
  {
    key: "customer:edit",
    label: "Edit customers",
    group: "customers",
    dependencies: ["customer:view"] as const,
  },
  {
    key: "customer:delete",
    label: "Delete customers",
    group: "customers",
    dependencies: ["customer:view"] as const,
  },
  {
    key: "item:view",
    label: "View items",
    group: "items",
  },
  {
    key: "item:view-prices",
    label: "View item prices",
    description: "See the price column in the items catalog.",
    group: "items",
    dependencies: ["item:view"] as const,
  },
  {
    key: "item:create",
    label: "Create items",
    group: "items",
    dependencies: ["item:view", "item:view-prices"] as const,
  },
  {
    key: "item:edit",
    label: "Edit items",
    group: "items",
    dependencies: ["item:view", "item:view-prices"] as const,
  },
  {
    key: "item:delete",
    label: "Delete items",
    group: "items",
    dependencies: ["item:view"] as const,
  },
  {
    key: "estimate:view",
    label: "View estimates",
    group: "estimates",
  },
  {
    key: "estimate:view-prices",
    label: "View estimate prices",
    description: "See totals, subtotals, and line item prices on estimates.",
    group: "estimates",
    dependencies: ["estimate:view"] as const,
  },
  {
    key: "estimate:create",
    label: "Create estimates",
    group: "estimates",
    dependencies: ["estimate:view", "customer:view", "item:view", "estimate:view-prices"] as const,
  },
  {
    key: "estimate:edit",
    label: "Edit estimates",
    group: "estimates",
    dependencies: ["estimate:view", "estimate:view-prices"] as const,
  },
  {
    key: "estimate:delete",
    label: "Delete estimates",
    group: "estimates",
    dependencies: ["estimate:view"] as const,
  },
  {
    key: "invoice:view",
    label: "View invoices",
    group: "invoices",
  },
  {
    key: "invoice:view-prices",
    label: "View invoice prices",
    description: "See totals, subtotals, and line item prices on invoices.",
    group: "invoices",
    dependencies: ["invoice:view"] as const,
  },
  {
    key: "invoice:create",
    label: "Create invoices",
    group: "invoices",
    dependencies: ["invoice:view", "customer:view", "item:view", "invoice:view-prices"] as const,
  },
  {
    key: "invoice:edit",
    label: "Edit invoices",
    group: "invoices",
    dependencies: ["invoice:view", "invoice:view-prices"] as const,
  },
  {
    key: "invoice:delete",
    label: "Delete invoices",
    group: "invoices",
    dependencies: ["invoice:view"] as const,
  },
  {
    key: "task:view",
    label: "View tasks",
    group: "tasks",
  },
  {
    key: "task:create",
    label: "Create tasks",
    group: "tasks",
    dependencies: ["task:view"] as const,
  },
  {
    key: "task:edit",
    label: "Edit tasks",
    group: "tasks",
    dependencies: ["task:view"] as const,
  },
  {
    key: "task:delete",
    label: "Delete tasks",
    group: "tasks",
    dependencies: ["task:view"] as const,
  },
  {
    key: "expense:view",
    label: "View expenses",
    group: "expenses",
  },
  {
    key: "expense:view-prices",
    label: "View expense amounts",
    description: "See the amount (value) of expenses.",
    group: "expenses",
    dependencies: ["expense:view"] as const,
  },
  {
    key: "expense:create",
    label: "Create expenses",
    group: "expenses",
    dependencies: ["expense:view", "expense:view-prices"] as const,
  },
  {
    key: "expense:edit",
    label: "Edit expenses",
    group: "expenses",
    dependencies: ["expense:view", "expense:view-prices"] as const,
  },
  {
    key: "expense:delete",
    label: "Delete expenses",
    group: "expenses",
    dependencies: ["expense:view"] as const,
  },
  {
    key: "payment:view",
    label: "View payments",
    group: "payments",
  },
  {
    key: "payment:view-prices",
    label: "View payment amounts",
    description: "See the amount and remaining balance on payments.",
    group: "payments",
    dependencies: ["payment:view"] as const,
  },
  {
    key: "payment:create",
    label: "Create payments",
    group: "payments",
    dependencies: ["payment:view", "payment:view-prices"] as const,
  },
  {
    key: "payment:edit",
    label: "Edit payments",
    group: "payments",
    dependencies: ["payment:view", "payment:view-prices"] as const,
  },
  {
    key: "payment:delete",
    label: "Delete payments",
    group: "payments",
    dependencies: ["payment:view"] as const,
  },
] as const;

export type PermissionKey = (typeof DEFINITIONS)[number]["key"];

export type PermissionDefinition = {
  key: PermissionKey;
  label: string;
  description?: string;
  group: string;
  ownerOnly?: boolean;
  dependencies?: PermissionKey[];
};

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = DEFINITIONS.map(
  (d): PermissionDefinition => {
    const def: PermissionDefinition = {
      key: d.key,
      label: d.label,
      group: d.group,
    };
    if ("description" in d && d.description) {
      def.description = d.description;
    }
    if ("dependencies" in d && d.dependencies) {
      def.dependencies = [...d.dependencies];
    }
    return def;
  },
);

const DEFINITION_BY_KEY = new Map(
  PERMISSION_DEFINITIONS.map((d) => [d.key, d] as const),
);

const PERMISSION_KEYS_SET = new Set<string>(
  PERMISSION_DEFINITIONS.map((d) => d.key),
);

export function isPermissionKey(value: string): value is PermissionKey {
  return PERMISSION_KEYS_SET.has(value);
}

export function getPermissionDefinition(
  permissionKey: PermissionKey,
): PermissionDefinition | undefined {
  return DEFINITION_BY_KEY.get(permissionKey);
}

export function listPermissionKeys(): PermissionKey[] {
  return PERMISSION_DEFINITIONS.map((d) => d.key);
}

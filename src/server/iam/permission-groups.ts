/**
 * Order and labels for permission groups in the UI (role editor, forms).
 */

export const PERMISSION_GROUP_ORDER = [
  "dashboard",
  "customers",
  "items",
  "estimates",
  "invoices",
  "recurring-invoices",
  "payments",
  "expenses",
  "tasks",
  "schedule",
] as const;

export type PermissionGroupId = (typeof PERMISSION_GROUP_ORDER)[number];

export const PERMISSION_GROUP_LABELS: Record<PermissionGroupId, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  items: "Items",
  estimates: "Estimates",
  invoices: "Invoices",
  "recurring-invoices": "Recurring invoices",
  payments: "Payments",
  expenses: "Expenses",
  tasks: "Tasks",
  schedule: "Schedule",
};

export function sortGroupKeys(groups: string[]): string[] {
  const order = new Map<string, number>(
    PERMISSION_GROUP_ORDER.map((id, index) => [id, index]),
  );
  return [...groups].sort((a, b) => {
    const ia = order.get(a) ?? PERMISSION_GROUP_ORDER.length;
    const ib = order.get(b) ?? PERMISSION_GROUP_ORDER.length;
    return ia - ib;
  });
}

// // Catálogo canônico de abilities do sistema (org-scoped).
// // Use estas chaves tanto no IAM quanto na UI (menu).

// export type AbilityKey =
//   | "dashboard"
//   | "role:manage"
//   | "member:manage"
//   | "settings:company:update"
//   | "report:financial:view"
//   // customers
//   | "customer:view"
//   | "customer:create"
//   | "customer:edit"
//   | "customer:delete"
//   // items
//   | "item:view"
//   | "item:create"
//   | "item:edit"
//   | "item:delete"
//   // estimates
//   | "estimate:view"
//   | "estimate:create"
//   | "estimate:edit"
//   | "estimate:delete"
//   | "estimate:approve"
//   // invoices
//   | "invoice:view"
//   | "invoice:create"
//   | "invoice:edit"
//   | "invoice:delete"
//   | "invoice:send"
//   | "invoice:refund"
//   // recurring invoices
//   | "recurring-invoice:view"
//   | "recurring-invoice:create"
//   | "recurring-invoice:edit"
//   | "recurring-invoice:delete"
//   // payments
//   | "payment:view"
//   | "payment:create"
//   | "payment:edit"
//   | "payment:delete"
//   // expenses
//   | "expense:view"
//   | "expense:create"
//   | "expense:edit"
//   | "expense:delete"
//   // settings (catálogo auxiliar)
//   | "tax-type:view"
//   | "tax-type:create"
//   | "tax-type:edit"
//   | "tax-type:delete"
//   | "payment-mode:view"
//   | "payment-mode:create"
//   | "payment-mode:edit"
//   | "payment-mode:delete"
//   | "custom-field:view"
//   | "custom-field:create"
//   | "custom-field:edit"
//   | "custom-field:delete"
//   | "note:view"
//   | "note:create"
//   | "note:edit"
//   | "note:delete";

// export type AbilityWildcard =
//   | "customer:*"
//   | "item:*"
//   | "estimate:*"
//   | "invoice:*"
//   | "recurring-invoice:*"
//   | "payment:*"
//   | "expense:*"
//   | "settings:*"
//   | "sales:*"
//   | "reports:*";

// export type AnyAbility = AbilityKey | AbilityWildcard;

// export type AbilityMeta = {
//   key: AbilityKey;
//   name: string;
//   description?: string;
//   dependsOn?: AbilityKey[]; // dependências cruzadas
// };

// export const PERMISSIONS: AbilityMeta[] = [
//   {
//     key: "dashboard",
//     name: "Dashboard",
//   },
//   {
//     key: "role:manage",
//     name: "Manage roles",
//   },
//   {
//     key: "member:manage",
//     name: "Manage members",
//   },
//   {
//     key: "settings:company:update",
//     name: "Update company settings",
//   },
//   {
//     key: "report:financial:view",
//     name: "View financial reports",
//   },

//   // customers
//   {
//     key: "customer:view",
//     name: "View customers",
//   },
//   {
//     key: "customer:create",
//     name: "Create customers",
//     dependsOn: ["customer:view"],
//   },
//   {
//     key: "customer:edit",
//     name: "Edit customers",
//     dependsOn: ["customer:view"],
//   },
//   {
//     key: "customer:delete",
//     name: "Delete customers",
//     dependsOn: ["customer:view"],
//   },

//   // items
//   { key: "item:view", name: "View items" },
//   { key: "item:create", name: "Create items", dependsOn: ["item:view"] },
//   { key: "item:edit", name: "Edit items", dependsOn: ["item:view"] },
//   { key: "item:delete", name: "Delete items", dependsOn: ["item:view"] },

//   // estimates
//   {
//     key: "estimate:view",
//     name: "View estimates",
//   },
//   {
//     key: "estimate:create",
//     name: "Create estimates",
//     dependsOn: ["estimate:view", "customer:view", "item:view"],
//   },
//   {
//     key: "estimate:edit",
//     name: "Edit estimates",
//     dependsOn: ["estimate:view"],
//   },
//   {
//     key: "estimate:delete",
//     name: "Delete estimates",
//     dependsOn: ["estimate:view"],
//   },
//   {
//     key: "estimate:approve",
//     name: "Approve estimates",
//     dependsOn: ["estimate:view"],
//   },

//   // invoices
//   { key: "invoice:view", name: "View invoices" },
//   {
//     key: "invoice:create",
//     name: "Create invoices",
//     dependsOn: ["invoice:view", "customer:view", "item:view"],
//   },
//   { key: "invoice:edit", name: "Edit invoices", dependsOn: ["invoice:view"] },
//   {
//     key: "invoice:delete",
//     name: "Delete invoices",
//     dependsOn: ["invoice:view"],
//   },
//   { key: "invoice:send", name: "Send invoices", dependsOn: ["invoice:view"] },
//   {
//     key: "invoice:refund",
//     name: "Refund invoices",
//     dependsOn: ["invoice:view", "payment:view"],
//   },

//   // recurring invoices
//   { key: "recurring-invoice:view", name: "View recurring invoices" },
//   {
//     key: "recurring-invoice:create",
//     name: "Create recurring invoices",
//     dependsOn: ["recurring-invoice:view", "customer:view", "item:view"],
//   },
//   {
//     key: "recurring-invoice:edit",
//     name: "Edit recurring invoices",
//     dependsOn: ["recurring-invoice:view"],
//   },
//   {
//     key: "recurring-invoice:delete",
//     name: "Delete recurring invoices",
//     dependsOn: ["recurring-invoice:view"],
//   },

//   // payments
//   { key: "payment:view", name: "View payments" },
//   {
//     key: "payment:create",
//     name: "Create payments",
//     dependsOn: ["payment:view", "invoice:view"],
//   },
//   { key: "payment:edit", name: "Edit payments", dependsOn: ["payment:view"] },
//   {
//     key: "payment:delete",
//     name: "Delete payments",
//     dependsOn: ["payment:view"],
//   },

//   // expenses
//   { key: "expense:view", name: "View expenses" },
//   {
//     key: "expense:create",
//     name: "Create expenses",
//     dependsOn: ["expense:view"],
//   },
//   { key: "expense:edit", name: "Edit expenses", dependsOn: ["expense:view"] },
//   {
//     key: "expense:delete",
//     name: "Delete expenses",
//     dependsOn: ["expense:view"],
//   },

//   // settings catalog
//   { key: "tax-type:view", name: "View tax types" },
//   {
//     key: "tax-type:create",
//     name: "Create tax types",
//     dependsOn: ["tax-type:view"],
//   },
//   {
//     key: "tax-type:edit",
//     name: "Edit tax types",
//     dependsOn: ["tax-type:view"],
//   },
//   {
//     key: "tax-type:delete",
//     name: "Delete tax types",
//     dependsOn: ["tax-type:view"],
//   },

//   { key: "payment-mode:view", name: "View payment modes" },
//   {
//     key: "payment-mode:create",
//     name: "Create payment modes",
//     dependsOn: ["payment-mode:view"],
//   },
//   {
//     key: "payment-mode:edit",
//     name: "Edit payment modes",
//     dependsOn: ["payment-mode:view"],
//   },
//   {
//     key: "payment-mode:delete",
//     name: "Delete payment modes",
//     dependsOn: ["payment-mode:view"],
//   },

//   { key: "custom-field:view", name: "View custom fields" },
//   {
//     key: "custom-field:create",
//     name: "Create custom fields",
//     dependsOn: ["custom-field:view"],
//   },
//   {
//     key: "custom-field:edit",
//     name: "Edit custom fields",
//     dependsOn: ["custom-field:view"],
//   },
//   {
//     key: "custom-field:delete",
//     name: "Delete custom fields",
//     dependsOn: ["custom-field:view"],
//   },

//   { key: "note:view", name: "View notes" },
//   { key: "note:create", name: "Create notes", dependsOn: ["note:view"] },
//   { key: "note:edit", name: "Edit notes", dependsOn: ["note:view"] },
//   { key: "note:delete", name: "Delete notes", dependsOn: ["note:view"] },
// ];

// // Grupos de curingas (agregadores)
// export const WILDCARDS: Record<AbilityWildcard, AbilityKey[]> = {
//   "customer:*": [
//     "customer:view",
//     "customer:create",
//     "customer:edit",
//     "customer:delete",
//   ],
//   "item:*": [
//     "item:view",
//     "item:create",
//     "item:edit",
//     "item:delete"
//   ],
//   "estimate:*": [
//     "estimate:view",
//     "estimate:create",
//     "estimate:edit",
//     "estimate:delete",
//     "estimate:approve",
//   ],
//   "invoice:*": [
//     "invoice:view",
//     "invoice:create",
//     "invoice:edit",
//     "invoice:delete",
//     "invoice:send",
//     "invoice:refund",
//   ],
//   "recurring-invoice:*": [
//     "recurring-invoice:view",
//     "recurring-invoice:create",
//     "recurring-invoice:edit",
//     "recurring-invoice:delete",
//   ],
//   "payment:*": [
//     "payment:view",
//     "payment:create",
//     "payment:edit",
//     "payment:delete",
//   ],
//   "expense:*": [
//     "expense:view",
//     "expense:create",
//     "expense:edit",
//     "expense:delete",
//   ],
//   "settings:*": [
//     "settings:company:update",
//     "tax-type:view",
//     "tax-type:create",
//     "tax-type:edit",
//     "tax-type:delete",
//     "payment-mode:view",
//     "payment-mode:create",
//     "payment-mode:edit",
//     "payment-mode:delete",
//     "custom-field:view",
//     "custom-field:create",
//     "custom-field:edit",
//     "custom-field:delete",
//     "note:view",
//     "note:create",
//     "note:edit",
//     "note:delete",
//   ],
//   "sales:*": [
//     "estimate:view",
//     "estimate:create",
//     "estimate:edit",
//     "estimate:delete",
//     "estimate:approve",
//     "invoice:view",
//     "invoice:create",
//     "invoice:edit",
//     "invoice:delete",
//     "invoice:send",
//     "invoice:refund",
//     "payment:view",
//   ],
//   "reports:*": [
//     "report:financial:view"
//   ],
// };

// // Conjunto com TODAS as abilities (útil para owner bypass)
// export const ALL_ABILITIES = new Set<AbilityKey>(PERMISSIONS.map((p) => p.key));
// src/server/iam/permissions/catalog.ts

export type Ability = string;

export type PermissionDef = {
  key: string; // ex.: "customer:view"
  name: string; // rótulo amigável
  description?: string;
  abilities: Ability[]; // abilities concedidas por esta permission
};

function A(...abilities: Ability[]): Ability[] {
  return abilities;
}

/**
 * Regras:
 * - Use permissions granulares (ex.: customer:view) e agregadoras (ex.: customer:manage).
 * - O menu e os guards sempre checam abilities.
 * - Roles dão permissions; permissions se expandem em abilities.
 */
export const PERMISSIONS: PermissionDef[] = [
  // Dashboard
  {
    key: "dashboard:access",
    name: "Acesso ao Dashboard",
    abilities: A("dashboard:access"),
  },

  // Customers
  { key: "customer:view", name: "Ver Clientes", abilities: A("customer:view") },
  {
    key: "customer:create",
    name: "Criar Clientes",
    abilities: A("customer:create"),
  },
  {
    key: "customer:edit",
    name: "Editar Clientes",
    abilities: A("customer:edit"),
  },
  {
    key: "customer:delete",
    name: "Excluir Clientes",
    abilities: A("customer:delete"),
  },
  {
    key: "customer:manage",
    name: "Gerenciar Clientes",
    abilities: A(
      "customer:view",
      "customer:create",
      "customer:edit",
      "customer:delete",
    ),
  },

  // Items
  { key: "item:view", name: "Ver Itens", abilities: A("item:view") },
  { key: "item:create", name: "Criar Itens", abilities: A("item:create") },
  { key: "item:edit", name: "Editar Itens", abilities: A("item:edit") },
  { key: "item:delete", name: "Excluir Itens", abilities: A("item:delete") },
  {
    key: "item:manage",
    name: "Gerenciar Itens",
    abilities: A("item:view", "item:create", "item:edit", "item:delete"),
  },

  // Estimates
  {
    key: "estimate:view",
    name: "Ver Orçamentos",
    abilities: A("estimate:view"),
  },
  {
    key: "estimate:create",
    name: "Criar Orçamentos",
    abilities: A("estimate:create"),
  },
  {
    key: "estimate:edit",
    name: "Editar Orçamentos",
    abilities: A("estimate:edit"),
  },
  {
    key: "estimate:delete",
    name: "Excluir Orçamentos",
    abilities: A("estimate:delete"),
  },
  {
    key: "estimate:manage",
    name: "Gerenciar Orçamentos",
    abilities: A(
      "estimate:view",
      "estimate:create",
      "estimate:edit",
      "estimate:delete",
    ),
  },

  // Invoices
  { key: "invoice:view", name: "Ver Faturas", abilities: A("invoice:view") },
  {
    key: "invoice:create",
    name: "Criar Faturas",
    abilities: A("invoice:create"),
  },
  { key: "invoice:edit", name: "Editar Faturas", abilities: A("invoice:edit") },
  {
    key: "invoice:delete",
    name: "Excluir Faturas",
    abilities: A("invoice:delete"),
  },
  {
    key: "invoice:manage",
    name: "Gerenciar Faturas",
    abilities: A(
      "invoice:view",
      "invoice:create",
      "invoice:edit",
      "invoice:delete",
    ),
  },

  // Members / IAM
  {
    key: "member:invite",
    name: "Convidar Membros",
    abilities: A("member:invite"),
  },
  {
    key: "member:manage",
    name: "Gerenciar Membros",
    abilities: A("member:manage"),
  },
  { key: "role:manage", name: "Gerenciar Roles", abilities: A("role:manage") },
  {
    key: "permission:override:manage",
    name: "Gerenciar Overrides de Permissões",
    abilities: A("permission:override:manage"),
  },
];

/** Índices auxiliares */
export const PERMISSION_BY_KEY = new Map(PERMISSIONS.map((p) => [p.key, p]));
export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

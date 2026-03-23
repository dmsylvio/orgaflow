# Orgaflow IAM — Technical Implementation Architecture

## Overview

Orgaflow IAM separates three access modes:

1. **Self access**
   - The signed-in user manages their own account (name, email, password, avatar).
   - In the product, this maps to **Settings > Account**.

2. **Owner access**
   - Full implicit access to the active organization.
   - The owner does not rely on a role or assigned permissions.
   - Some areas are owner-only.

3. **Role-based access**
   - Operational access inside the organization.
   - Non-owner members receive a role.
   - The role holds permissions the owner assigns.
   - Those permissions gate modules such as customers, items, estimates, and invoices.

---

## Core rules

### Owner
If `organization_members.is_owner = true`, the user:

- can access everything in the organization
- bypasses normal permission checks
- can create, edit, and assign roles
- can access all owner-only pages
- can access billing
- can access and manage the full org settings block

### Non-owner
If `is_owner = false`, the user:

- relies only on permissions from their role
- cannot access owner-only pages
- cannot be granted owner-only permissions
- only sees modules allowed by their role

### Self
Every authenticated user can access:

- `Settings > Account`

This is the only self-scoped area and acts as a fallback if the user loses all operational permissions.

---

## Settings scope

### Self
The only self option is:

- `Settings > Account`

Responsibilities: name, email, password, avatar.

Rules: authentication only; no org role; no org permissions.

### Owner-only
All other `Settings` screens are owner-only:

- Company, Preferences, Customization, Roles, Notifications, Tax Types, Payment Modes, Notes, Expense Categories, Billing.

Rules: `membership.isOwner === true`; not assignable to normal roles as permissions.

---

## Suggested folder layout

```txt
src/server/iam/
├─ permissions.ts
├─ permission-groups.ts
├─ permission-utils.ts
├─ ability.ts
├─ menu.ts
├─ filter-menu.ts
├─ role-utils.ts
├─ owner-policy.ts
└─ index.ts
```

---

## File responsibilities

### `permissions.ts`
Source of truth for assignable permissions: `PermissionKey`, `PermissionDefinition`, dependencies, optional `ownerOnly`, full catalog.

### `permission-groups.ts`
Group ordering and human-readable group labels for UI/forms.

### `permission-utils.ts`
Lookup definitions, owner-only checks, recursive dependency expansion, strip non-assignable keys, normalize role permission sets, group for display.

### `ability.ts`
`createAbility`, `can`, `canAny`, `canAll`, owner bypass.

### `menu.ts`
Declares **two menus**:
- **`appMenu`** (`MainMenuItem[]`): main app sidebar; each item has numeric **`group`** for section dividers; includes a **Settings** link to `/app/settings`.
- **`settingsMenu`** (`SettingsMenuItem[]`): **flat** list for `/app/settings/*` only; **no `group`** field.

Items may set `authOnly`, `ownerOnly`, or `permissions`.

### `filter-menu.ts`
Filters any `BaseMenuItem[]` by ability (flat list; no nesting).

### `role-utils.ts`
Prepare permissions for save; strip owner-only from assignable UI groups.

### `owner-policy.ts`
Helpers such as `isOwnerMembership`.

### `index.ts`
Barrel re-exports.

---

## Main types

### `PermissionKey`
Pattern: `resource:action` (e.g. `customer:view`, `invoice:create`).

### `PermissionDefinition`
Fields: `key`, `label`, optional `description`, `group`, optional `ownerOnly`, optional `dependencies`.

### `AbilityContext`
`isOwner`, `permissions`, optional `isAuthenticated` (useful for `authOnly` menu items).

---

## Permission rules

### Assignable permissions
Chosen by the owner when creating/editing a role (dashboard, customers, items, estimates, invoices — see `permissions.ts`).

### Owner-only (policy, not role form)
Org settings are enforced with `isOwner`, not role permissions. Optional future internal keys (`billing:manage`, etc.) stay outside the normal role flow.

### Dependencies
Example: `invoice:create` implies `invoice:view`, `customer:view`, `item:view`. The system expands dependencies automatically; the owner should not have to remember them.

---

## Ability layer

Maps `membership + role permissions` to a single `AbilityContext`. Owner always passes `can` / `canAny` / `canAll`.

---

## Navigation model

Mechanisms per item:

1. `authOnly` — signed in
2. `ownerOnly` — organization owner
3. `permissions` — requires matching permission(s)

### Main vs settings menus

- **Main menu** (`appMenu`): operational routes under `/app`; numeric **`group`** sections; ends with **Settings** entry (`authOnly`).
- **Settings menu** (`settingsMenu`): parallel sidebar when the user is under `/app/settings/*`; **no numeric groups**.

### tRPC

- `iam.navigation` — filtered `appMenu`
- `iam.settingsNavigation` — filtered `settingsMenu`

---

## Example: `menu.ts` (current shape)

```ts
import type { PermissionKey } from "./permissions";

export type BaseMenuItem = {
  key: string;
  label: string;
  href: string;
  icon?: string;
  authOnly?: boolean;
  ownerOnly?: boolean;
  permissions?: PermissionKey[];
};

export type MainMenuItem = BaseMenuItem & { group: number };
export type SettingsMenuItem = BaseMenuItem;

export const appMenu: MainMenuItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/app", group: 0, permissions: ["dashboard:view"] },
  // … customers, items, estimates, invoices …
  { key: "settings-entry", label: "Settings", href: "/app/settings", group: 3, authOnly: true },
];

export const settingsMenu: SettingsMenuItem[] = [
  { key: "account", label: "Account", href: "/app/settings/account", authOnly: true },
  // … owner-only org settings …
];
```

---

## Example: `filter-menu.ts` (flat)

```ts
import { canAny, type AbilityContext } from "./ability";
import type { BaseMenuItem } from "./menu";

export function filterMenuByAbility<T extends BaseMenuItem>({
  items,
  ability,
  isAuthenticated,
}: {
  items: readonly T[];
  ability: AbilityContext;
  isAuthenticated: boolean;
}): T[] {
  return items.filter((item) => {
    if (item.authOnly) return isAuthenticated;
    if (item.ownerOnly) return ability.isOwner;
    if (!item.permissions?.length) return true;
    return canAny(ability, item.permissions);
  }).map((item) => ({ ...item }));
}
```

---

## Role form flow

1. Accept selected permissions  
2. Drop non-assignable / owner-only  
3. Expand dependencies  
4. Persist normalized set  

See `role-utils.ts` / `normalizeRolePermissions`.

---

## Database mapping

- **`organization_members`**: `organization_id`, `user_id`, `role_id`, `is_owner`
- **`roles`**: `id`, `organization_id`, `key`, `name`, …
- **`role_permissions`**: `role_id`, `permission`

---

## Building the current user’s ability

1. Resolve active organization  
2. Load membership for that org  
3. If no membership → deny org-scoped access  
4. If `is_owner` → `isOwner: true`  
5. Else load role permissions → `isOwner: false`  

Implemented in `src/server/services/iam/get-current-ability.ts`.

---

## Backend integration

The server is the source of truth; the client only improves UX.

Every org-scoped procedure should: authenticate → validate membership → build ability → check owner or `can(permission)`.

```ts
if (!can(ability, "customer:create")) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have permission to perform this action.",
  });
}
```

---

## Self-service (`account` router)

Separate from org RBAC: `protectedProcedure` only (e.g. `me`, `updateProfile`). No org permission required.

---

## Suggested tRPC routers

`account` (self), domain routers (`customer`, `item`, …) with `organizationProcedure` + `requirePermission`, `role` / `organization` (owner or hybrid), `iam` (menus + session summary).

---

## Page policies

- **Auth-only:** `Settings > Account`  
- **Owner-only:** other settings screens  
- **Role-based:** dashboard, customers, items, estimates, invoices — active membership + owner or matching permission  

---

## Losing all operational permissions

The user must still reach `Settings > Account` to manage identity and credentials.

---

## Incremental rollout

1. `permissions`, `permission-utils`, `ability`, `menu`, `filter-menu`  
2. Wire `organization_members`, `roles`, `role_permissions`  
3. `account` + `role` routers, `getCurrentAbility`, dynamic sidebars  
4. Protect App Router layouts for owner-only vs role-based routes  

---

## Conclusion

Four principles:

1. **Owner is sovereign** — full org access without role dependency.  
2. **Roles are operational** — modules + automatic dependency expansion.  
3. **Settings are almost all owner-only** — except Account (self).  
4. **Self-service is separate from RBAC** — account endpoints do not require org permissions.  

This keeps the model predictable, secure, and easy to explain and implement.

# Orgaflow — UI Architecture, Design System, and Components

> **Atualização:** o projeto usa **Tailwind CSS** e **não** depende de Radix Themes. Os restantes capítulos abaixo descrevem princípios de arquitetura de UI; onde mencionam “Radix Themes”, interprete como **padrões equivalentes com Tailwind** + componentes em `src/components/ui/` (ou futuros **Radix Primitives** / **ShadCN** só quando precisares de comportamento acessível avançado, não como sistema visual base).

## Purpose

This document defines the Orgaflow UI architecture for the MVP, covering:

- use of **Tailwind CSS** as the primary styling system (`src/styles/styles.css` + utilitários nas páginas e componentes)
- use of **small UI primitives** under `src/components/ui/` (button, input, spinner, etc.) for consistency
- use of **custom components** when there is specific business logic
- separation between generic and domain components
- implementation conventions
- what may and may not be shared
- a practical strategy to ship the SaaS quickly without blocking future evolution

**Stack rule:** new screens and refactors should use **Tailwind** utility classes and shared primitives in `src/components/ui/`. Prefer semantic HTML and native controls where they are sufficient (e.g. `<select>`, `<button>`).

The goal is to deliver fast in the short term while keeping enough structure for the product to grow without becoming an inconsistent UI.

---

# 1. Main decision

The project’s UI decision is:

> Use **Radix Themes** as the MVP visual foundation and create **custom components** only when there is a real need for business rules, product-specific UX, or richer interaction.

That means:

- we do not rebuild every primitive from scratch
- we do not deeply customize everything up front
- we use the ready-made base to move faster
- we add custom components only where the product truly needs them

---

# 2. Chosen strategy

The official strategy is:

## 2.1 Foundation
**Radix Themes** will be the app’s visual foundation.

It will be used for:
- buttons
- cards
- basic inputs
- text fields
- dialogs
- dropdown menus
- tabs
- badges
- base table
- form layout
- common visual elements

## 2.2 Shared UI
We will have shared UI components on top of the base when it makes sense.

They will be:
- reusable
- lightweight
- free of specific business rules
- focused on visual consistency and ergonomics

## 2.3 Domain components
When a component has:
- its own business rules
- product-specific state
- Orgaflow-specific flows
- dependencies on domain entities

it should live in the corresponding domain.

---

# 3. Golden rule

## Shared components **must not** mix generic UI with heavy business logic

This is one of the project’s most important rules.

### Example of what **must not** happen
We should not build something like:

- `src/components/ui/select.tsx` that internally:
  - fetches customers
  - loads items
  - knows kanban triggers
  - understands roles
  - knows invoices

That is an architecture mistake.

## Correct rule
Shared components should be:
- visual
- generic
- reusable
- decoupled from a specific domain

Domain components belong in the domain.

---

# 4. What may be shared

The components below can be shared normally.

## Basic components
- input
- textarea
- field
- label
- checkbox
- radio
- switch
- simple select
- base table
- badge
- card
- avatar
- button
- icon button
- spinner
- skeleton
- empty state
- page header
- section header
- simple modal/dialog
- visual tabs
- tooltip
- generic action dropdown menu

These belong in the shared UI layer.

---

# 5. What **should not** be shared

The items below **should not** live in `ui/` or a generic shared layer if they carry product business logic.

## Examples of components that **should be domain**
- customer search select
- customer picker
- estimate item picker
- invoice item picker
- role permission matrix
- role permission group selector
- kanban trigger builder
- kanban category editor
- feature toggle card with system states
- payments provider configuration form
- stripe settings form
- storage usage summary
- invoice status timeline
- reusable notes selector with real domain integration
- notification rule builder

### Rationale
All of these:
- know domain entities
- have their own business rules
- depend on specific APIs
- hold product state
- are not truly generic

Therefore they belong inside the matching domain.

---

# 6. Recommended `src/components` structure

```txt
src/components/
├─ ui/
│  ├─ button.tsx
│  ├─ icon-button.tsx
│  ├─ input.tsx
│  ├─ textarea.tsx
│  ├─ field.tsx
│  ├─ label.tsx
│  ├─ checkbox.tsx
│  ├─ radio-group.tsx
│  ├─ switch.tsx
│  ├─ select.tsx
│  ├─ table.tsx
│  ├─ badge.tsx
│  ├─ card.tsx
│  ├─ avatar.tsx
│  ├─ spinner.tsx
│  ├─ skeleton.tsx
│  ├─ empty-state.tsx
│  ├─ page-header.tsx
│  ├─ section-header.tsx
│  ├─ dialog.tsx
│  ├─ dropdown-menu.tsx
│  ├─ tabs.tsx
│  └─ tooltip.tsx
│
├─ account/
│  ├─ account-profile-form.tsx
│  └─ account-security-form.tsx
│
├─ customers/
│  ├─ customer-search-select.tsx
│  ├─ customer-summary-card.tsx
│  └─ customer-form.tsx
│
├─ items/
│  ├─ item-search-select.tsx
│  └─ item-form.tsx
│
├─ estimates/
│  ├─ estimate-item-picker.tsx
│  ├─ estimate-items-table.tsx
│  ├─ estimate-summary.tsx
│  ├─ estimate-status-badge.tsx
│  └─ estimate-form.tsx
│
├─ invoices/
│  ├─ invoice-item-picker.tsx
│  ├─ invoice-items-table.tsx
│  ├─ invoice-summary.tsx
│  ├─ invoice-status-badge.tsx
│  └─ invoice-form.tsx
│
├─ kanban/
│  ├─ kanban-trigger-builder.tsx
│  ├─ kanban-category-form.tsx
│  ├─ kanban-board.tsx
│  ├─ kanban-column.tsx
│  └─ kanban-feature-card.tsx
│
├─ payments/
│  ├─ payments-feature-card.tsx
│  ├─ stripe-settings-form.tsx
│  ├─ payment-method-form.tsx
│  └─ payment-readiness-alert.tsx
│
├─ roles/
│  ├─ role-form.tsx
│  ├─ role-permission-matrix.tsx
│  └─ permission-group.tsx
│
├─ notifications/
│  ├─ notification-settings-form.tsx
│  └─ notification-rule-row.tsx
│
├─ tax-types/
│  ├─ tax-type-form.tsx
│  └─ tax-type-table.tsx
│
├─ payment-modes/
│  ├─ payment-mode-form.tsx
│  └─ payment-mode-table.tsx
│
├─ notes/
│  ├─ note-form.tsx
│  ├─ notes-table.tsx
│  └─ reusable-note-picker.tsx
│
└─ expense-categories/
   ├─ expense-category-form.tsx
   └─ expense-category-table.tsx
```

## 6.1 Auth routes, split layout, and Zod validation

### Auth layout (`(auth)`)
- **`src/app/(auth)/layout.tsx`** — layout **split**: painel lateral **cover** (marca, gradiente com tokens Radix) + coluna do formulário (`<main id="auth-main">`), partilhado por login, registo, forgot-password e reset-password.
- Em viewports estreitas o cover empilha por cima; a partir de `md` fica em duas colunas.

### Auth — formulários colocados na rota (padrão único)
Cada fluxo tem `page.tsx` + `*-form.tsx` na mesma pasta; componentes genéricos (`AuthCard`, `AuthField`) ficam em `src/components/auth/`.

| Rota | Página | Formulário (client) |
| ---- | ------ | ------------------- |
| `/login` | `login/page.tsx` | `login/login-form.tsx` → `LoginForm` |
| `/register` | `register/page.tsx` | `register/register-form.tsx` → `RegisterForm` |
| `/forgot-password` | `forgot-password/page.tsx` | `forgot-password/forgot-password-form.tsx` → `ForgotPasswordForm` |
| `/reset-password` | `reset-password/page.tsx` | `reset-password/reset-password-form.tsx` → `ResetPasswordForm` |

- **`reset-password/page.tsx`** lê `searchParams.token` (query do email) e passa `initialToken` ao formulário; as restantes páginas só montam o form.

### Zod — um ficheiro por fluxo (sem misturar)
| Ficheiro | Conteúdo |
| -------- | -------- |
| `src/schemas/login.ts` | Apenas sign-in: `loginSchema`, `LoginFormValues`. |
| `src/schemas/register.ts` | Apenas registo: `registerSchema`, `RegisterFormValues`. |
| `src/schemas/forgot-password.ts` | Apenas pedido de reset: `forgotPasswordSchema`, `ForgotPasswordFormValues`. |
| `src/schemas/reset-password.ts` | Apenas nova password com token: `resetPasswordSchema`, `ResetPasswordFormValues`. |
| `src/schemas/zod-field-errors.ts` | Apenas utilitário `zodErrorToFieldErrors` para server actions (sem regras de negócio). |

**Regra:** não voltar a agregar schemas de login/registo/reset num único `auth.ts` — cada fluxo mantém o seu módulo.

## 6.2 Área autenticada: `(private)/app/*`

Alinhado ao IAM ([`docs/iam-architecture-technical.md`](./iam-architecture-technical.md): menu principal e settings sob **`/app`**, **`/app/settings`**).

### Convenção de pastas (App Router)

| Pasta | URL | Função |
| ----- | --- | ------ |
| `src/app/(private)/app/layout.tsx` | **`/app/*`** | **Raiz com acesso restrito:** exige sessão; redireciona para `/login` se anónimo. O nome `(private)` é *route group* (não aparece na URL). |
| `src/app/(private)/app/workspace/` | `/app/workspace` | Escolher ou criar organização (fluxo workspace). UI: `workspace-screen.tsx` + `workspace-ui.tsx` (textos e opções de plano no próprio módulo). |
| `src/app/(private)/app/(home)/` | **`/app`** | Raiz da app autenticada (mock / futuro painel; requer cookie de org ativa + membership). O segmento `(home)` é *route group* (não aparece na URL). |

- Novas páginas autenticadas (clientes, faturas, **`/app/settings`**, etc.) devem viver sob **`src/app/(private)/app/...`**.
- Rotas públicas (marketing, health) ficam fora de `(private)/app` (ex.: `src/app/page.tsx` → `/`).
- Auth UI permanece em **`src/app/(auth)/`** (`/login`, `/register`, …).
- **URLs canónicas** da área privada: usar `appPaths` em [`src/lib/app-paths.ts`](../src/lib/app-paths.ts) (`workspace`, `home`, …) para não hardcodar strings em client/server.

### Compatibilidade

- **`/workspace`** → **`/app/workspace`**: redirect em `next.config.ts` (sem rota dedicada em `src/app/workspace/`).
- **`/dashboard`** → **`/app`**: redirect permanente em `next.config.ts` (sem página `src/app/dashboard/`).

---

# 7. UI layers

Orgaflow UI is organized into three main layers.

## 7.1 Foundation layer
Based on Radix Themes.

Responsibility:
- visual consistency
- theme tokens
- basic visual components
- development speed

## 7.2 Shared UI layer
Project-wide shared components.

Responsibility:
- combine ergonomics with consistency
- encapsulate repeated visual patterns
- underpin pages and forms

These components **must not** carry heavy domain logic.

## 7.3 Domain UI layer
Product-specific components.

Responsibility:
- real business flows
- components with domain-specific state
- integration with APIs/domain logic
- Orgaflow-specific experiences

---

# 8. Formal sharing rule

## A component may live in `src/components/ui` only if:

1. it does not depend on a specific product entity
2. it does not need to know business rules
3. it does not directly depend on domains such as customer, estimate, invoice, kanban, or payments
4. it can be reused anywhere in the app without business semantics

If any rule breaks, the component must leave `ui/` and move to the matching domain.

---

# 9. Practical examples

## 9.1 May be shared
### `Field`
Responsible for:
- label
- hint
- error
- default field layout

Without knowing:
- what a customer is
- what an estimate is
- what a role is

### `Table`
Responsible for:
- visual table structure
- header
- body
- row
- cell

Without knowing:
- invoice status
- item price
- feature readiness

### `Input`
Responsible for:
- visual input
- size
- disabled state
- error styling

Without knowing:
- customer masks
- Stripe logic
- invoice state

---

## 9.2 Must not be shared
### `CustomerSearchSelect`
Should not live in `ui/` because:
- it knows customers
- it likely triggers search
- it has customer-specific selection behavior

It belongs in:
```txt
src/components/customers/customer-search-select.tsx
```

### `RolePermissionMatrix`
Should not live in `ui/` because:
- it knows permissions
- it knows groupings
- it knows owner-only rules and dependencies

It belongs in:
```txt
src/components/roles/role-permission-matrix.tsx
```

### `KanbanTriggerBuilder`
Should not live in `ui/` because:
- it knows estimate/invoice
- it knows statuses
- it knows org-level logic

It belongs in:
```txt
src/components/kanban/kanban-trigger-builder.tsx
```

---

# 10. Implementation with Radix Themes

## 10.1 Technical decision

MVP UI will be based on **Radix Themes** to accelerate development within ~45 days.

### Rationale
- ready-made components
- visual consistency
- lower initial design-system effort
- good MVP coverage

## 10.2 What Radix Themes handles well
- button
- card
- text field
- badge
- dialog
- dropdown menu
- tabs
- simple select
- form layouts
- base table

## 10.3 What should not be forced into it
- complex searchable select
- advanced combobox
- domain components with heavy rules
- product-specific entity selectors
- complex builders and configurators

In those cases we build custom components.

---

# 11. Official component strategy

## 11.1 Use Radix Themes directly when:
- the component is visually generic
- behavior is already solved
- there is no strong business rule
- the component API can stay simple

## 11.2 Create a shared component when:
- there is meaningful visual repetition
- the component stays generic
- encapsulating app ergonomics helps
- there is still no domain coupling

## 11.3 Create a domain component when:
- there is specific business logic
- there is product-specific behavior
- there is a domain dependency
- the component uses APIs or data from that module

---

# 12. Implementation conventions

## 12.1 Naming
- shared components in `ui/` should have generic names
- domain components should have explicit domain names

### Good examples
- `input.tsx`
- `field.tsx`
- `table.tsx`
- `customer-search-select.tsx`
- `estimate-item-picker.tsx`
- `stripe-settings-form.tsx`

### Bad examples
- `smart-select.tsx`
- `entity-selector.tsx`
- `advanced-table.tsx`

These names hide responsibility and usually become catch-all components.

---

## 12.2 Shared component API
Shared components should have a simple, predictable API.

### Examples
- `variant`
- `size`
- `disabled`
- `loading`
- `className`
- `children`

They should not have props like:
- `customerId`
- `invoiceStatus`
- `organizationFeatureState`
- `rolePermissions`

If those are needed, it is no longer shared.

---

## 12.3 State and side effects
Shared components should avoid:
- fetching from the backend
- knowing endpoints
- heavy business logic

If a component needs to:
- fetch customers
- fetch items
- load permissions
- resolve feature readiness

it belongs in the domain.

---

# 13. Form pattern

## Shared components that may exist
- `Field`
- `FieldLabel`
- `FieldHint`
- `FieldError`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Switch`

These are fully acceptable in the shared layer.

## Domain form components
Examples:
- `CustomerForm`
- `EstimateForm`
- `StripeSettingsForm`
- `RoleForm`

These stay in the domain even if they use `Field`, `Input`, and `Select` internally.

---

# 14. Table pattern

## Shared
A base table may exist in `ui/`:

- `Table`
- `TableHeader`
- `TableBody`
- `TableRow`
- `TableCell`

## Domain
Real tables belong in the domain when they carry product semantics.

Examples:
- `TaxTypeTable`
- `PaymentModeTable`
- `EstimateItemsTable`
- `RolePermissionsTable`

Because these know columns, rules, and domain actions.

---

# 15. Search / select / dropdown

## 15.1 Simple select
May be shared.

## 15.2 Complex searchable select
Should not be shared if coupled to the domain.

### Example
`CustomerSearchSelect`
- belongs in the customers domain

### Example
`ItemSearchSelect`
- belongs in the items domain

## 15.3 Simple dropdown menu
May be shared.

## 15.4 Dropdown with product logic
Should be domain-level.

Examples:
- invoice action menu
- kanban state menu
- feature action menu

---

# 16. What may be reused across domains

A domain component may be reused across pages of the same domain.

Example:
- `estimate-status-badge` may be used on multiple estimate screens
- `kanban-feature-card` may be used on kanban-domain pages

That does not automatically make it globally shared.

## Rule
If the component stays semantically tied to the domain, it stays in the domain.

---

# 17. When an “almost generic” component in `ui/` starts to grow

If a component in `ui/` starts getting:
- too many props
- too many conditions
- branches per domain
- specific integrations

it should be reassessed.

### Rule
If it “knows too much”, it must leave `ui/`.

---

# 18. Suggested implementation order

## Phase 1 — Foundation
Create/organize basic shared components:
- button
- input
- textarea
- field
- label
- table
- badge
- card
- spinner
- skeleton
- empty state
- dialog
- dropdown menu
- tabs

## Phase 2 — Shared UI
Create useful, generic wrappers:
- page header
- section header
- form layout pieces
- modal wrappers
- action bars

## Phase 3 — Domain components
Create specific components:
- role permission matrix
- estimate item picker
- kanban trigger builder
- stripe settings form
- payments readiness alert
- feature cards
- entity search selects

---

# 19. Final architecture rule

The final Orgaflow UI rule is:

## Foundation
Radix Themes

## Shared UI
Basic, generic components

## Domain UI
Business-specific components

### And the most important rule:
> Shared components **must not** mix generic semantics with heavy business logic.

---

# 20. Executive summary

## What may be shared
- input
- field
- label
- textarea
- simple select
- base table
- button
- badge
- card
- dialog
- tabs
- simple dropdown menu

## What should not be shared
- customer search select
- estimate item picker
- role permission matrix
- kanban trigger builder
- stripe settings form
- feature readiness card
- invoice workflow widgets
- any component that knows domain business rules

## MVP strategy
- use Radix Themes to move faster
- add custom components only where there is real product value
- keep `ui/` clean
- keep heavy components inside the matching domain

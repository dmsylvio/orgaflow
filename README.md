# Orgaflow

**Multi-tenant SaaS** for the full client workflow: customers, estimates, approval, invoices, payments, and operational execution — in one product.

## Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| App & routes | **Next.js** (App Router)            |
| Typed API    | **tRPC**                            |
| Auth         | **Auth.js** (NextAuth v5)           |
| Database     | **PostgreSQL** + **Drizzle ORM**    |
| Validation   | **Zod**                             |
| UI           | **React** + **Tailwind CSS** (utility-first layout and visuals) + pequenos primitives em `src/components/ui/` |

**Styling:** **Tailwind CSS** v3; entrada global em [`src/styles/styles.css`](./src/styles/styles.css) (importada no root layout). Ver também [`docs/orgaflow-ui-architecture.md`](./docs/orgaflow-ui-architecture.md).

**Zod (forms):** um ficheiro por fluxo em `src/schemas/` (`login.ts`, `register.ts`, `forgot-password.ts`, `reset-password.ts`); util partilhado em `zod-field-errors.ts`. Ver secção **6.1** em [`docs/orgaflow-ui-architecture.md`](./docs/orgaflow-ui-architecture.md).

## IAM (identity and access)

Full IAM architecture: **[`docs/iam-architecture-technical.md`](./docs/iam-architecture-technical.md)**. Summary:

### Three access modes

1. **Self** — the signed-in user’s account (`Settings > Account`: name, email, password, avatar). Requires authentication only; **no** org role or org permissions.
2. **Owner** — if `organization_members.is_owner = true`, full access to the active org **without** relying on the permission catalog. Billing and most of Settings are **owner-only**.
3. **Role-based** — non-owners get a **role** with `resource:action` permissions (e.g. `customer:view`, `invoice:create`). The **owner bypasses** these checks.

### Rules

- The **backend** is the security source of truth; the frontend only improves UX.
- Org-scoped mutations/queries: authenticate → membership in active org → `ability` → `can` / owner bypass.
- **Permission dependencies** are expanded automatically when saving roles (e.g. `invoice:create` pulls `invoice:view`, `customer:view`, `item:view`).
- The **`account`** router (self) is separate from org RBAC; e.g. `updateProfile` uses a session-protected procedure without org permissions.

### Implementation

- **`src/server/iam/`** — `PermissionKey` catalog, `ability` (`can` / `canAny` / `canAll`), dependency helpers, **`appMenu`** (numeric `group` sections) + **`settingsMenu`** (flat, no `group`), `filterMenuByAbility`, role helpers.
- **`src/server/services/iam/get-current-ability.ts`** — resolves membership + role permissions + `AbilityContext` for `(userId, organizationId)`.
- **tRPC** (`src/server/trpc/init.ts`): `protectedProcedure`, `organizationProcedure` (active org via `x-organization-id` or `active_organization_id` cookie + membership + `ability`), `ownerProcedure`, `requirePermission("resource:action")`.
- **Routers:** `account` (self), `iam` (`navigation` = main menu, `settingsNavigation` = settings sidebar, `session`), `role` (role CRUD + permission catalog, owner-only).

Always send the active organization on calls that use `organizationProcedure` / `ownerProcedure`.

### Área autenticada (`/app/*`)

- Estrutura: **`src/app/(private)/app/`** — route group `(private)` + segmento **`app`** na URL. Ver **`docs/orgaflow-ui-architecture.md` §6.2**.
- Após login/registo → **`/app/workspace`**: escolher organização ou criar. **Criar org** exige nome, **morada** (linhas, cidade, região opcional, código postal, país), **telefone opcional**, **moeda padrão**; o **slug** URL é gerado a partir do nome. Catálogos **moedas** e **países** são preenchidos na primeira listagem se as tabelas estiverem vazias. Depois escolhe-se o plano; **`/app`** com org ativa.
- URLs canónicas: `src/lib/app-paths.ts` (`appPaths.workspace`, `appPaths.home`). **`/workspace`** → **`/app/workspace`** em `next.config.ts`; **`/dashboard`** → **`/app`**.
- Planos / Stripe: Free sem Checkout; pagos usam `STRIPE_PRICE_GROWTH_*` e `STRIPE_PRICE_SCALE_*` (mensal/anual) — ver `.env.example`. O plano **`scale`** na BD corresponde ao produto **Scale** no Stripe. Intervalo: `STRIPE_DEFAULT_BILLING_INTERVAL=monthly|annual`. Se faltar preço ou chave, fluxo manual de ativação. Migração `0003_subscription_plan_scale.sql`: renomeia o valor enum antigo `enterprise` → `scale`.

---

## Getting started

### Prerequisites

- Node.js (compatible with Next 16)
- pnpm (or npm/yarn)
- PostgreSQL

### Install

```bash
pnpm install
```

Create **`.env`** at the repo root (do not commit) with at least:

- `DATABASE_URL` — PostgreSQL connection string (required for Drizzle and the Auth adapter)
- **Auth.js / NextAuth** variables (e.g. `AUTH_SECRET`, URLs, providers — see `auth.ts` / `auth.config.ts`)

### Database

```bash
pnpm db:generate   # generate migrations from schemas
pnpm db:migrate    # apply migrations (prints full errors; uses drizzle-orm migrator)
# or in development:
pnpm db:push       # push schema (avoid in production carelessly)
```

**`pnpm db:migrate` fails with “already exists” (types/tables)?**  
That usually means the database already has objects from `db:push` (or manual SQL) but **`drizzle.__drizzle_migrations` is empty**, so Drizzle tries to run `0000_*.sql` again.

Pick one:

1. **Clean dev database** (destructive): drop/recreate the DB or `public` schema, then `pnpm db:migrate`.
2. **Baseline** (keep data, only if the live schema matches the migration file): insert a row for each applied migration. Get the hash with:

   ```bash
   node -e "const fs=require('fs');const c=require('crypto');const q=fs.readFileSync('drizzle/0000_tiny_shockwave.sql');console.log(c.createHash('sha256').update(q).digest('hex'));"
   ```

   Then in SQL (use `created_at` from `drizzle/meta/_journal.json` → `entries[].when` for that file):

   ```sql
   INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
   VALUES ('<hash from command above>', <when from journal>);
   ```

**Why not raw `drizzle-kit migrate`?** Its progress UI calls `process.exit(1)` on failure without printing the underlying Postgres error, so this project uses a small **inline** `tsx` migrator to surface `DrizzleQueryError` / `cause`.

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command          | Description        |
| ---------------- | ------------------ |
| `pnpm dev`       | Dev server         |
| `pnpm build`     | Production build   |
| `pnpm start`     | Production server  |
| `pnpm lint`      | Biome check        |
| `pnpm format`    | Biome format       |
| `pnpm db:studio` | Drizzle Studio     |

---

## Repository layout

```text
src/app/           # App Router pages and layouts
src/server/trpc/   # Context, procedures, routers, errors, viewer helper (`index.ts` barrel)
src/server/db/     # Drizzle schemas and DB access
docs/              # Architecture, product, IAM, pricing, etc.
```

IAM doc also suggests domain routers: `account`, `customer`, `item`, `estimate`, `invoice`, `member`, `role`, `organization`.

---

## Documentation

**Index:** **[`docs/README.md`](./docs/README.md)** — grouped table of every guide (all **English**).

| Document | Contents |
| -------- | -------- |
| [`docs/iam-architecture-technical.md`](./docs/iam-architecture-technical.md) | **Canonical IAM** — owner, roles, permissions, menus, tRPC |
| [`docs/orgaflow-implementation-strategy.md`](./docs/orgaflow-implementation-strategy.md) | Master implementation strategy vs repository reality |
| [`docs/orgaflow-server-architecture.md`](./docs/orgaflow-server-architecture.md) | `src/server` layout, DB imports, IAM, features, Kanban, payments |
| [`docs/orgaflow-domains-iam-features-architecture.md`](./docs/orgaflow-domains-iam-features-architecture.md) | Domains, IAM, features, quotas, Kanban & payments (product architecture) |
| [`docs/orgaflow-ui-architecture.md`](./docs/orgaflow-ui-architecture.md) | UI layers, Tailwind, shared vs domain components |
| [`docs/orgaflow-payments-stripe-connect-architecture.md`](./docs/orgaflow-payments-stripe-connect-architecture.md) | Payments domain + Stripe Connect |
| [`docs/orgaflow-docs-architecture.md`](./docs/orgaflow-docs-architecture.md) | How documentation is organized |
| [`docs/orgaflow-pricing-strategy.md`](./docs/orgaflow-pricing-strategy.md) / [`docs/orgaflow-free-plan-limit-strategy.md`](./docs/orgaflow-free-plan-limit-strategy.md) | Pricing & Starter limits |
| More | See [`docs/README.md`](./docs/README.md) — lifecycle, public links, attachments, events, automations, Kanban, settings |

Product narrative (high level): [`README_orgaflow.md`](./README_orgaflow.md). For **stack, IAM, and implementation**, prefer this README + [`docs/`](./docs/).

---

## License

Private project (`"private": true` in `package.json`) unless stated otherwise.

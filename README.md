# Orgaflow

A multi-tenant SaaS platform for business management, built with Next.js, tRPC, and a flexible role-based access control (RBAC) system.

## Overview

Orgaflow helps organizations manage customers, estimates, invoices, payments, expenses, and team members—all within a single, tenant-isolated application. Each organization has its own workspace with configurable roles and permissions.

## Features

### Core Modules

- **Dashboard** — Overview and key metrics
- **Customers** — Customer database with contact info
- **Items** — Product/service catalog
- **Estimates** — Create and manage quotes
- **Invoices** — Billing and invoicing
- **Recurring Invoices** — Subscription-style billing
- **Payments** — Payment tracking
- **Expenses** — Expense management
- **Reports** — Financial reporting

### Organization & Access

- **Multi-tenancy** — Subdomain-based tenant isolation (e.g. `acme.yourdomain.com`)
- **Organization switching** — Users can belong to multiple orgs and switch between them
- **Invitations** — Invite members by email with optional role assignment
- **Roles & Permissions** — Granular RBAC with roles, permissions, and ability-based guards
- **Permission overrides** — Per-user allow/deny overrides for fine-grained control

### Authentication

- **NextAuth** — Credentials and OAuth support
- **Sign up / Sign in** — Email + password authentication
- **Password recovery** — Forgot password flow

## Tech Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) |
| UI         | React 19, Radix UI, Tailwind CSS   |
| API        | tRPC v11 with React Query          |
| Auth       | NextAuth v4                        |
| Database   | PostgreSQL                         |
| ORM        | Drizzle                            |
| Validation | Zod v4                             |
| Forms      | React Hook Form + Zod resolver     |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public pages (signin, signup, pricing)
│   ├── (dashboard)/        # Protected app (customers, invoices, settings)
│   └── api/                # API routes (tRPC, NextAuth)
├── components/             # Shared UI components
├── lib/                    # Utilities, auth, tenant resolution
├── server/
│   ├── api/                # tRPC routers and procedures
│   ├── db/                 # Drizzle schema
│   └── iam/                # Permissions, abilities, guards
└── validations/            # Zod schemas
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL

### Installation

```bash
pnpm install
```

### Environment

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/orgaflow"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Database

```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (optional)
pnpm db:studio
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed Data (optional)

If a seed script is configured, it typically creates:

- Organization **XYZ** with slug `xyz`
- **Owner**: `owner@xyz.com` / `Passw0rd!`
- **Member** (manager role): `member@xyz.com` / `Passw0rd!`

## IAM (Identity & Access Management)

Orgaflow uses a permission-based model:

1. **Permissions** — Granular actions (e.g. `customer:view`, `invoice:create`)
2. **Roles** — Groups of permissions, scoped per organization
3. **Abilities** — Resolved from roles + overrides; used for UI and API guards
4. **Owners** — Full access within their organization

Permissions are defined in `src/server/iam/permissions/catalog.ts` and synced to the database on seed.

## Multi-Tenancy

- **Subdomain resolution** — `{slug}.yourdomain.com` maps to an organization
- **Context** — Active org is resolved from host or user's `activeOrgId`
- **Isolation** — All queries are scoped to the current organization

## Scripts

| Command            | Description                 |
| ------------------ | --------------------------- |
| `pnpm dev`         | Start development server    |
| `pnpm build`       | Production build            |
| `pnpm start`       | Start production server     |
| `pnpm lint`        | Run Biome linter            |
| `pnpm format`      | Format code with Biome      |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate`  | Run migrations              |
| `pnpm db:studio`   | Open Drizzle Studio         |

## License

Private — All rights reserved.

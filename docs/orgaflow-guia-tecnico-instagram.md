# Orgaflow - Technical And Informational Guide For Instagram Content

Generated on 2026-04-22 from the project source code.

This document is a technical and product-content reference for creating Instagram posts, carousels, reels, captions, behind-the-scenes content, and founder/build-in-public material about Orgaflow. It combines product narrative with real implementation details: architecture, modules, HTTP endpoints, tRPC procedures, database design, security, billing, files, PDFs, workflow automations, and content angles.

## 1. Product Summary

Orgaflow is a multi-tenant SaaS platform for managing the full client workflow:

Customer -> Estimate -> Approval -> Invoice -> Payment -> Work Execution

It is designed for businesses that need to turn sales requests into operational work without juggling multiple disconnected tools. It combines a lightweight CRM, item catalog, estimates, invoices, payments, expenses, tasks, automations, public client links, file attachments, and organization settings.

Ideal users:

- print shops;
- custom apparel and promotional product businesses;
- small agencies;
- design studios;
- event decorators;
- local service businesses;
- teams that sell through estimates and deliver through tasks.

## 2. Technical Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.2.0 with App Router |
| UI | React 19.2.4 |
| Type-safe API | tRPC 11.13.4 |
| Cache/client state | TanStack React Query 5.91.0 |
| Database | PostgreSQL |
| ORM/migrations | Drizzle ORM + Drizzle Kit |
| Auth | Auth.js / NextAuth v5 beta with Credentials Provider |
| Validation | Zod 4 |
| Forms | React Hook Form |
| UI primitives | Radix UI, Vaul, custom components in `src/components/ui` |
| Styling | Tailwind CSS 3.4 |
| PDF generation | `@react-pdf/renderer` |
| File storage | Vercel Blob |
| SaaS billing | Stripe Subscriptions |
| Email | Resend and Nodemailer |
| Internal jobs | `node-cron` |
| Tooling | TypeScript 5, pnpm 10, Biome |
| Chat | Optional Tawk.to integration |

Next.js 16 note: the project uses `proxy.ts`, the current convention that replaces the old middleware naming. HTTP endpoints are implemented as `route.ts` files inside `src/app`. Route groups such as `(marketing)` and `(private)` are organizational folders and do not appear in the URL.

## 3. Overall Architecture

Orgaflow separates responsibilities like this:

- `src/app`: App Router routes, pages, layouts, and HTTP endpoints.
- `src/server`: database access, schemas, services, auth, IAM, Stripe, and tRPC routers.
- `src/trpc`: tRPC client wiring, React Query integration, and server/client helpers.
- `src/components`: shared UI components.
- `src/schemas`: Zod schemas used by forms and server inputs.
- `docs`: architecture and product strategy documentation.
- `drizzle`: SQL migrations and schema snapshots.

The backend is the source of truth for authentication, active organization resolution, permissions, plan limits, and business rules. The UI primarily consumes the backend through tRPC.

## 4. Multi-Tenant Model

Orgaflow is multi-tenant: each organization is an isolated workspace. A single user can belong to multiple organizations.

Every domain action needs an active organization. It is resolved in `src/server/trpc/context.ts`:

- first from the `x-organization-id` header;
- then from the `active_organization_id` cookie.

That `organizationId` enters the tRPC context and is used to filter queries, validate membership, and prevent cross-organization data access.

## 5. Authentication

Auth.js/NextAuth v5 is configured through:

- `auth.ts`;
- `src/server/auth/auth.config.ts`;
- `src/server/auth/credentials.ts`;
- `src/app/api/auth/[...nextauth]/route.ts`.

Main characteristics:

- credential-based login;
- JWT sessions;
- Drizzle adapter;
- sign-in page at `/login`;
- required `AUTH_SECRET`;
- JWT callback stores `user.id` in `token.sub`;
- session callback copies `token.sub` into `session.user.id`.

Related server actions:

- `registerAction`: creates a user with a bcrypt password hash using 12 rounds.
- `forgotPasswordAction`: generates a reset token with a 1-hour TTL.
- `resetPasswordAction`: validates the token and updates the password.

## 6. Proxy And Route Protection

File: `proxy.ts`.

Main rules:

- direct public routes: `/` and `/pricing`;
- auth routes: `/login`, `/register`, `/auth/error`;
- authenticated users visiting auth routes are redirected to `/app`;
- unauthenticated users trying to access `/app/*` are redirected to `/login?next=...`;
- APIs, Next.js assets, and static image files are excluded from the matcher.

This proxy performs an optimistic access check. Real data authorization still happens in the backend/tRPC layer.

## 7. IAM, Roles, And Permissions

IAM lives in `src/server/iam` and `src/server/services/iam`.

Access modes:

- Self: personal account data.
- Owner: organization owner with full bypass.
- Role-based: members receive `resource:action` permissions.

Permission catalog:

- `dashboard:view`
- `dashboard:view-prices`
- `customer:view`, `customer:create`, `customer:edit`, `customer:delete`
- `item:view`, `item:view-prices`, `item:create`, `item:edit`, `item:delete`
- `estimate:view`, `estimate:view-prices`, `estimate:create`, `estimate:edit`, `estimate:delete`
- `invoice:view`, `invoice:view-prices`, `invoice:create`, `invoice:edit`, `invoice:delete`
- `task:view`, `task:create`, `task:edit`, `task:delete`
- `expense:view`, `expense:view-prices`, `expense:create`, `expense:edit`, `expense:delete`
- `payment:view`, `payment:view-prices`, `payment:create`, `payment:edit`, `payment:delete`
- `recurring-invoice:view`, `recurring-invoice:view-prices`, `recurring-invoice:create`, `recurring-invoice:edit`, `recurring-invoice:delete`

The system expands permission dependencies automatically. For example, creating an invoice also implies viewing invoices, customers, items, and invoice prices.

Menus are also filtered by permissions, ownership, and feature availability. The main menu includes Dashboard, Customers, Items, Estimates, Invoices, Recurring Invoice, Payments, Expenses, Tasks, Reports, and Settings.

## 8. Plans, Limits, And SaaS Billing

Plans:

- Starter;
- Growth;
- Scale.

Prices defined in code:

- Starter: US$9.99/month.
- Growth: US$24.99/month.
- Scale: US$44.99/month.
- annual billing applies a 30% discount.
- 15-day trial.

Current Starter limits:

- 50 customers;
- 50 items;
- 50 estimates;
- 50 invoices.

Plan-gated features:

- Kanban/tasks and workflow automations require the `scale` plan.

Stripe:

- Subscription Checkout is created in `src/server/stripe/organization-checkout.ts`.
- Webhooks are processed in `src/server/stripe/webhook-handler.ts`.
- Handled events: `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.

## 9. Functional Modules

### 9.1 Dashboard

Shows high-level metrics, monthly revenue, pending estimates, pending invoices, and recent activity. Access is protected by `dashboard:view`; financial values can depend on `dashboard:view-prices`.

### 9.2 Customers

Central customer database. A customer connects to estimates, invoices, payments, expenses, and document history.

Functions:

- list customers;
- create;
- update;
- delete;
- measure usage against plan limits.

### 9.3 Items

Reusable product/service catalog. Items help build estimates, invoices, and recurring invoices quickly.

Functions:

- list items;
- create/update/delete;
- use units;
- use default currency;
- control price visibility through permissions.

### 9.4 Estimates

Estimate/proposal module.

Functions:

- create an estimate with customer, currency, line items, taxes, discounts, and notes;
- generate a sequential estimate number;
- attach files;
- export PDF;
- send by email;
- generate public link;
- let the client view, approve, or reject;
- trigger automations on approval/rejection.

Estimate statuses:

- `DRAFT`
- `SENT`
- `VIEWED`
- `APPROVED`
- `REJECTED`
- `EXPIRED`

### 9.5 Invoices

Invoice module.

Functions:

- create invoices manually;
- create invoices from estimates;
- clone invoices;
- update invoices;
- change status;
- send by email;
- generate PDF;
- provide a public link;
- attach files;
- track payments and remaining balance.

Invoice statuses:

- `DRAFT`
- `PENDING`
- `SENT`
- `VIEWED`
- `PARTIALLY_PAID`
- `PAID`
- `OVERDUE`
- `VOID`

### 9.6 Recurring Invoices

Recurring invoice module.

Functions:

- create recurring templates;
- configure frequency;
- configure date-based or count-based limits;
- generate invoices automatically via cron;
- send automatically by email when configured;
- list invoices generated from a template.

Database frequencies:

- daily;
- weekly;
- monthly;
- quarterly;
- yearly.

The job runs hourly through `src/instrumentation.ts`.

### 9.7 Payments

Incoming payment registry.

Functions:

- list payments;
- create payment;
- update;
- delete;
- choose invoice;
- calculate invoice status based on paid amount;
- list customers and payment modes;
- generate the next payment number.

### 9.8 Expenses

Operational expense tracking.

Functions:

- create expense;
- update;
- delete;
- categorize;
- associate with customer when applicable;
- attach receipts/files;
- use default currency;
- choose payment mode.

### 9.9 Tasks / Kanban

Operational execution module. Requires the Scale plan.

Functions:

- enable/disable Kanban;
- create stages;
- update stages;
- reorder stages;
- delete stages;
- list tasks;
- create/update/delete tasks;
- link a task to an estimate or invoice;
- fetch the linked document.

### 9.10 Workflow Automations

Automations connect document events to task creation. Requires Scale and owner access.

Examples:

- estimate approved -> create a task;
- estimate rejected -> create a follow-up;
- invoice paid -> create a delivery task;
- invoice overdue -> create a collection task.

Rules support:

- trigger document: estimate or invoice;
- trigger status;
- title and description templates with placeholders;
- assignment strategy;
- Kanban stage;
- relative due date;
- linked document reference.

Supported placeholders:

- `{{ invoice.number }}`
- `{{ estimate.number }}`
- `{{ customer.name }}`

### 9.11 Settings

Central settings area:

- account;
- company;
- preferences;
- roles;
- team;
- notifications;
- tax types;
- payment modes;
- notes;
- Kanban settings;
- workflow automations;
- expense categories;
- billing and plan;
- danger zone.

Most organization settings are owner-only.

### 9.12 Public Client Pages

Token-based public pages:

- `/estimate/[token]`;
- `/invoice/[token]`;
- `/invite/[token]`.

Clients can view estimates/invoices without an account. Public links can expire according to organization preferences. Public PDFs also respect token validity and expiration.

## 10. Real HTTP Endpoints

All endpoints below are App Router `route.ts` files.

| Method | Endpoint | File | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | Internal Auth.js endpoints: login, callback, session, and signout according to NextAuth. |
| GET/POST | `/api/trpc/[trpc]` | `src/app/api/trpc/[trpc]/route.ts` | tRPC gateway. Receives type-safe queries/mutations with SuperJSON and disables caching. |
| POST | `/api/upload` | `src/app/api/upload/route.ts` | Upload attachments for expense, estimate, or invoice to Vercel Blob. |
| POST | `/api/upload/logo` | `src/app/api/upload/logo/route.ts` | Upload organization logo. |
| DELETE | `/api/upload/logo` | `src/app/api/upload/logo/route.ts` | Remove current organization logo and clear `logoUrl`. |
| GET | `/api/pdf/estimate/[id]` | `src/app/api/pdf/estimate/[id]/route.ts` | Private authenticated, org-scoped estimate PDF. |
| GET | `/api/pdf/invoice/[id]` | `src/app/api/pdf/invoice/[id]/route.ts` | Private authenticated, org-scoped invoice PDF. |
| GET | `/api/pdf/estimate/public/[token]` | `src/app/api/pdf/estimate/public/[token]/route.ts` | Public estimate PDF by token, with expiration. |
| GET | `/api/pdf/invoice/public/[token]` | `src/app/api/pdf/invoice/public/[token]/route.ts` | Public invoice PDF by token, with expiration. |
| POST | `/api/stripe/webhook` | `src/app/api/stripe/webhook/route.ts` | Receives Stripe webhooks with raw body and validates `stripe-signature`. |
| GET | `/api/workspace/checkout/success` | `src/app/api/workspace/checkout/success/route.ts` | Checkout success callback: validates Stripe session, sets active organization, and redirects to `/app`. |

### Attachment Upload

Endpoint: `POST /api/upload`.

Expected `FormData` fields:

- `file`;
- `resourceType`: `expense`, `estimate`, or `invoice`;
- `resourceId`.

Validations:

- authenticated user;
- active organization;
- user is a member of the organization;
- resource belongs to the organization;
- maximum size: 25 MB;
- allowed MIME types: JPEG, PNG, GIF, SVG, WebP, PDF, DOCX, and ZIP.

The file is stored in Vercel Blob and a metadata record is created in `document_files`.

### Logo Upload

Endpoint: `POST /api/upload/logo`.

Validations:

- authenticated user;
- active organization;
- user is a member of the organization;
- maximum size: 5 MB;
- allowed MIME types: JPEG, PNG, WebP, GIF, and SVG.

When a new logo is uploaded, the previous logo is removed from Blob if it exists.

## 11. Page Routes

### Marketing And Public

| URL | Purpose |
| --- | --- |
| `/` | Landing page |
| `/about` | About |
| `/pricing` | Pricing |
| `/contact` | Contact |
| `/changelog` | Changelog |
| `/roadmap` | Roadmap |
| `/privacy-policy` | Privacy policy |
| `/cookie-policy` | Cookie policy |
| `/terms-of-service` | Terms of service |
| `/estimate/[token]` | Public estimate page |
| `/invoice/[token]` | Public invoice page |
| `/invite/[token]` | Invitation acceptance |

### Auth

| URL | Purpose |
| --- | --- |
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Request password reset |
| `/reset-password` | Reset password by token |

### Private App

| URL | Purpose |
| --- | --- |
| `/app` | Dashboard |
| `/app/workspace` | Workspace selection/creation |
| `/app/customers` | Customers |
| `/app/items` | Items |
| `/app/estimates` | Estimate list |
| `/app/estimates/create` | Create estimate |
| `/app/estimates/edit` | Edit estimate |
| `/app/estimates/[id]` | Estimate detail |
| `/app/invoices` | Invoice list |
| `/app/invoices/create` | Create invoice |
| `/app/invoices/edit` | Edit invoice |
| `/app/invoices/[id]` | Invoice detail |
| `/app/recurring-invoices` | Recurring invoices |
| `/app/recurring-invoices/create` | Create recurring invoice |
| `/app/recurring-invoices/[id]/edit` | Edit recurring invoice |
| `/app/payments` | Payments |
| `/app/expenses` | Expenses |
| `/app/expenses/[id]` | Expense detail |
| `/app/tasks` | Kanban/tasks |
| `/app/reports` | Reports |
| `/app/settings` | Settings |
| `/app/settings/account` | Account |
| `/app/settings/company` | Company |
| `/app/settings/preferences` | Preferences |
| `/app/settings/roles` | Roles |
| `/app/settings/team` | Team |
| `/app/settings/notifications` | Notifications |
| `/app/settings/tax-types` | Tax types |
| `/app/settings/payment-modes` | Payment modes |
| `/app/settings/notes` | Default notes |
| `/app/settings/kanban` | Kanban configuration |
| `/app/settings/automations` | Automations |
| `/app/settings/expense-categories` | Expense categories |
| `/app/settings/billing` | Billing and plan |
| `/app/settings/danger` | Danger zone |
| `/app/settings/[section]` | Dynamic settings section fallback |

## 12. tRPC Procedures

All procedures are accessed through `/api/trpc/[trpc]`, using GET or POST according to the tRPC client. The logical procedure name is the real contract used by the UI.

Protection levels:

- `publicProcedure`: no required login.
- `protectedProcedure`: authenticated user.
- `organizationProcedure`: authenticated user, active organization, validated membership, and loaded ability.
- `ownerProcedure`: organizationProcedure + organization owner.

### Root

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `health` | query | public | Healthcheck with `ok` and current date. |
| `viewer` | query | protected | Returns user/session payload. |

### account

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `account.me` | query | protected | Current account data. |
| `account.updateProfile` | mutation | protected | Updates profile/name. |
| `account.updatePassword` | mutation | protected | Changes password after validating the current password. |

### workspace

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `workspace.listMyOrganizations` | query | protected | Lists the user's workspaces. |
| `workspace.listCurrencies` | query | protected | Lists currencies. |
| `workspace.listLanguages` | query | protected | Lists languages. |
| `workspace.setActiveOrganization` | mutation | protected | Sets the active organization. |
| `workspace.createOrganization` | mutation | protected | Creates organization, defaults, and Checkout when applicable. |
| `workspace.resumeOrganizationCheckout` | mutation | protected | Resumes organization Checkout. |

### iam

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `iam.navigation` | query | organization | Main menu filtered by permissions/features. |
| `iam.settingsNavigation` | query | organization | Settings menu filtered by owner access. |
| `iam.session` | query | organization | IAM session, membership, and ability. |

### role

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `role.assignablePermissionGroups` | query | owner | Lists assignable permission groups. |
| `role.list` | query | owner | Lists organization roles. |
| `role.byId` | query | owner | Fetches a role by id. |
| `role.create` | mutation | owner | Creates a role and permissions. |
| `role.update` | mutation | owner | Updates role and permissions. |
| `role.delete` | mutation | owner | Deletes a role. |

### team

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `team.list` | query | owner | Lists members and invitations. |
| `team.createInvitation` | mutation | owner | Creates member invitation. |
| `team.cancelInvitation` | mutation | owner | Cancels invitation. |
| `team.resendInvitation` | mutation | owner | Resends invitation. |
| `team.getInvitationByToken` | query | public | Reads public invitation by token. |
| `team.acceptInvitation` | mutation | protected | Authenticated user accepts invitation. |

### dashboard

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `dashboard.getStats` | query | organization + `dashboard:view` | Indicator cards. |
| `dashboard.getMonthlyRevenue` | query | organization + `dashboard:view` | Monthly revenue. |
| `dashboard.getPendingEstimates` | query | organization + `estimate:view` | Pending estimates. |
| `dashboard.getPendingInvoices` | query | organization + `invoice:view` | Pending invoices. |
| `dashboard.getRecentActivity` | query | organization + `dashboard:view` | Recent activity. |

### customers

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `customers.list` | query | `customer:view` | Lists customers. |
| `customers.getUsage` | query | `customer:view` | Current usage vs plan limit. |
| `customers.create` | mutation | `customer:create` | Creates customer. |
| `customers.update` | mutation | `customer:edit` | Updates customer. |
| `customers.delete` | mutation | `customer:delete` | Deletes customer. |

### items

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `items.list` | query | `item:view` | Lists items. |
| `items.listUnits` | query | `item:view` | Lists units. |
| `items.getDefaultCurrency` | query | `item:view` | Default currency. |
| `items.getUsage` | query | `item:view` | Current usage vs limit. |
| `items.create` | mutation | `item:create` | Creates item. |
| `items.update` | mutation | `item:edit` | Updates item. |
| `items.delete` | mutation | `item:delete` | Deletes item. |

### estimates

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `estimates.list` | query | `estimate:view` | Lists estimates. |
| `estimates.getById` | query | `estimate:view` | Private detail. |
| `estimates.getPublicByToken` | query | public | Public detail by token. |
| `estimates.approvePublic` | mutation | public | Client approves estimate. |
| `estimates.rejectPublic` | mutation | public | Client rejects estimate with optional reason. |
| `estimates.getUsage` | query | `estimate:view` | Current usage vs limit. |
| `estimates.getFormMeta` | query | `estimate:view` | Form metadata. |
| `estimates.create` | mutation | `estimate:create` | Creates estimate. |
| `estimates.update` | mutation | `estimate:edit` | Updates estimate. |
| `estimates.setStatus` | mutation | `estimate:edit` | Changes status. |
| `estimates.sendEmail` | mutation | `estimate:edit` | Sends estimate by email and generates public link. |
| `estimates.delete` | mutation | `estimate:delete` | Deletes estimate. |
| `estimates.listFiles` | query | `estimate:view` | Lists attachments. |
| `estimates.deleteFile` | mutation | `estimate:edit` | Removes attachment. |
| `estimates.toggleFileVisibility` | mutation | `estimate:edit` | Toggles whether attachment appears on public link. |

### invoices

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `invoices.list` | query | `invoice:view` | Lists invoices. |
| `invoices.getById` | query | `invoice:view` | Private detail. |
| `invoices.getPublicByToken` | query | public | Public detail by token. |
| `invoices.getUsage` | query | `invoice:view` | Current usage vs limit. |
| `invoices.getFormMeta` | query | `invoice:view` | Form metadata. |
| `invoices.create` | mutation | `invoice:create` | Creates invoice. |
| `invoices.createFromEstimate` | mutation | `invoice:create` + `estimate:view` | Generates invoice from estimate. |
| `invoices.update` | mutation | `invoice:edit` | Updates invoice. |
| `invoices.sendEmail` | mutation | `invoice:edit` | Sends invoice by email and generates public link. |
| `invoices.setStatus` | mutation | `invoice:edit` | Changes status. |
| `invoices.clone` | mutation | `invoice:create` | Clones invoice. |
| `invoices.delete` | mutation | `invoice:delete` | Deletes invoice. |
| `invoices.listFiles` | query | `invoice:view` | Lists attachments. |
| `invoices.deleteFile` | mutation | `invoice:edit` | Removes attachment. |

### recurringInvoices

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `recurringInvoices.list` | query | `recurring-invoice:view` | Lists recurring templates. |
| `recurringInvoices.getById` | query | `recurring-invoice:view` | Template detail. |
| `recurringInvoices.getFormMeta` | query | `recurring-invoice:view` | Form metadata. |
| `recurringInvoices.create` | mutation | `recurring-invoice:create` | Creates recurring template. |
| `recurringInvoices.update` | mutation | `recurring-invoice:edit` | Updates template. |
| `recurringInvoices.setStatus` | mutation | `recurring-invoice:edit` | Pauses/activates/completes template. |
| `recurringInvoices.delete` | mutation | `recurring-invoice:delete` | Removes template. |
| `recurringInvoices.listGeneratedInvoices` | query | `recurring-invoice:view` + `invoice:view` | Lists invoices created by the template. |

### payments

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `payments.list` | query | `payment:view` | Lists payments. |
| `payments.create` | mutation | `payment:create` | Creates payment. |
| `payments.update` | mutation | `payment:edit` | Updates payment. |
| `payments.delete` | mutation | `payment:delete` | Deletes payment. |
| `payments.listInvoiceOptions` | query | `payment:view` | Lists eligible invoices. |
| `payments.getDefaultCurrency` | query | `payment:view` | Default currency. |
| `payments.listPaymentModes` | query | `payment:view` | Payment modes. |
| `payments.listCustomers` | query | `payment:view` | Customers for filter/form. |
| `payments.getNextPaymentNumber` | query | `payment:create` | Next payment number. |

### expenses

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `expenses.getById` | query | `expense:view` | Expense detail. |
| `expenses.list` | query | `expense:view` | Lists expenses. |
| `expenses.create` | mutation | `expense:create` | Creates expense. |
| `expenses.update` | mutation | `expense:edit` | Updates expense. |
| `expenses.delete` | mutation | `expense:delete` | Deletes expense. |
| `expenses.listFiles` | query | `expense:view` | Lists attachments. |
| `expenses.deleteFile` | mutation | `expense:edit` | Removes attachment. |
| `expenses.getDefaultCurrency` | query | `expense:view` | Default currency. |
| `expenses.listCategories` | query | `expense:view` | Categories. |
| `expenses.listCustomers` | query | `expense:view` | Customers. |
| `expenses.listPaymentModes` | query | `expense:view` | Payment modes. |

### tasks

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `tasks.listStages` | query | `task:view` + Scale | Lists Kanban stages. |
| `tasks.createStage` | mutation | owner + Scale | Creates stage. |
| `tasks.updateStage` | mutation | owner + Scale | Updates stage. |
| `tasks.reorderStages` | mutation | owner + Scale | Reorders stages. |
| `tasks.deleteStage` | mutation | owner + Scale | Deletes stage. |
| `tasks.getKanbanEnabled` | query | `task:view` | Returns whether Kanban is enabled. |
| `tasks.setKanbanEnabled` | mutation | owner + Scale | Enables/disables Kanban. |
| `tasks.listTasks` | query | `task:view` + Scale | Lists tasks. |
| `tasks.createTask` | mutation | `task:create` + Scale | Creates task. |
| `tasks.updateTask` | mutation | `task:edit` + Scale | Updates task. |
| `tasks.getLinkedDocument` | query | `task:view` + Scale | Fetches linked estimate/invoice. |
| `tasks.deleteTask` | mutation | `task:delete` + Scale | Removes task. |

### automations

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `automations.listRules` | query | owner + Scale | Lists rules. |
| `automations.createRule` | mutation | owner + Scale | Creates rule. |
| `automations.updateRule` | mutation | owner + Scale | Updates rule. |
| `automations.deleteRule` | mutation | owner + Scale | Removes rule. |

### reports

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `reports.getMonthlyOverview` | query | `dashboard:view` | Monthly overview. |
| `reports.getEstimateStats` | query | `estimate:view` | Estimate stats. |
| `reports.getInvoiceStats` | query | `invoice:view` | Invoice stats. |
| `reports.getTopCustomers` | query | `payment:view` | Customer ranking. |

### settings

| Procedure | Type | Access | Purpose |
| --- | --- | --- | --- |
| `settings.getCompany` | query | owner | Company data. |
| `settings.updateCompanyLogo` | mutation | owner | Updates logo URL. |
| `settings.getStorageUsage` | query | organization | Storage usage. |
| `settings.updateCompany` | mutation | owner | Updates company. |
| `settings.listPaymentModes` | query | owner | Lists payment modes. |
| `settings.createPaymentMode` | mutation | owner | Creates payment mode. |
| `settings.updatePaymentMode` | mutation | owner | Updates payment mode. |
| `settings.deletePaymentMode` | mutation | owner | Removes payment mode. |
| `settings.listExpenseCategories` | query | owner | Lists categories. |
| `settings.createExpenseCategory` | mutation | owner | Creates category. |
| `settings.updateExpenseCategory` | mutation | owner | Updates category. |
| `settings.deleteExpenseCategory` | mutation | owner | Removes category. |
| `settings.getPreferences` | query | owner | Organization preferences. |
| `settings.updatePreferences` | mutation | owner | Updates preferences. |
| `settings.getNotificationSettings` | query | owner | Notification settings. |
| `settings.updateNotificationSettings` | mutation | owner | Updates notifications. |
| `settings.getSubscriptionStatus` | query | organization | Subscription status. |
| `settings.getPlanSummary` | query | organization | Plan and limits. |
| `settings.getBilling` | query | owner | Billing data. |
| `settings.createBillingPortalSession` | mutation | owner | Creates Stripe Billing Portal session. |
| `settings.createUpgradeSession` | mutation | owner | Creates upgrade Checkout. |
| `settings.deleteOrganization` | mutation | owner | Deletes organization with confirmation. |
| `settings.listTaxTypes` | query | owner | Lists taxes. |
| `settings.updateTaxPerItem` | mutation | owner | Sets tax-per-item behavior. |
| `settings.createTaxType` | mutation | owner | Creates tax. |
| `settings.updateTaxType` | mutation | owner | Updates tax. |
| `settings.deleteTaxType` | mutation | owner | Removes tax. |
| `settings.listNotes` | query | owner | Lists default notes. |
| `settings.createNote` | mutation | owner | Creates note. |
| `settings.updateNote` | mutation | owner | Updates note. |
| `settings.deleteNote` | mutation | owner | Removes note. |

## 13. Database

Main Drizzle tables/schemas:

- Auth: `users`, `accounts`, `sessions`, `verificationTokens`, `authenticators`.
- Multi-tenant: `organizations`, `organizationMembers`, `organizationSubscriptions`, `organizationPreferences`, `organizationFeatures`, `organizationNotificationSettings`.
- IAM: `roles`, `rolePermissions`, `invitations`.
- Catalog: `customers`, `items`, `units`, `currencies`, `languages`, `taxTypes`.
- Documents: `estimates`, `estimateItems`, `invoices`, `invoiceItems`.
- Recurrence: `recurringInvoiceTemplates`, `recurringInvoiceTemplateItems`.
- Finance: `payments`, `paymentModes`, `expenses`, `expenseCategories`.
- Operations: `tasks`, `taskStages`, `automationRules`.
- Files and notes: `documentFiles`, `notes`.

Important enums:

- `estimate_status`;
- `invoice_status`;
- `recurring_frequency`;
- `recurring_limit_type`;
- `recurring_status`;
- `subscription_plan`;
- `subscription_status`;
- `document_resource_type`;
- `note_type`;
- item discount enums.

## 14. PDFs

PDFs use `@react-pdf/renderer` and components in `src/lib/pdf`.

Templates:

- estimates: `estimate-1`, `estimate-2`, `estimate-3`;
- invoices: `invoice-1`, `invoice-2`, `invoice-3`.

Private endpoints require session, active organization, and a document that belongs to that organization. Public endpoints require a valid token and check public link expiration.

## 15. Emails And Notifications

Main services:

- `sendTransactionalEmail` through Resend/Nodemailer;
- invitation emails;
- estimate/invoice emails;
- website contact form;
- notifications for document viewed, payment received, invoice overdue, and estimate status changes.

The contact form includes:

- Zod validation;
- `website` honeypot;
- 1.5-second minimum submit timing to reduce spam;
- delivery to internal emails configured in code.

## 16. Files And Attachments

Files are stored in Vercel Blob. Metadata is stored in `document_files`.

Resources that accept attachments:

- expense;
- estimate;
- invoice.

Controlled fields:

- organization;
- resource type;
- resource id;
- file name;
- storage key / URL;
- MIME type;
- file size;
- public visibility;
- uploading user.

Estimates can toggle public visibility for attachments. This allows internal files to stay private while client-facing files appear in the public portal.

## 17. Security And Isolation

Architecture strengths:

- every domain query is filtered by `organizationId`;
- membership is validated server-side;
- owner bypass is explicit;
- permissions are granular by resource/action;
- plan gating is validated server-side;
- uploads validate type, size, and ownership;
- private PDFs validate session and organization;
- public PDFs validate token and expiration;
- Stripe webhook validates signature;
- public tokens use long random values;
- password reset expires after 1 hour.

## 18. Environment Variables

Main variables:

- `DATABASE_URL`;
- `BLOB_READ_WRITE_TOKEN`;
- `AUTH_SECRET`;
- `NEXT_PUBLIC_APP_URL`;
- `AUTH_URL`;
- `RESEND_API_KEY`;
- `RESEND_FROM_EMAIL`;
- `RESEND_REPLY_TO_EMAIL`;
- `STRIPE_SECRET_KEY`;
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`;
- `STRIPE_WEBHOOK_SECRET`;
- `STRIPE_DEFAULT_BILLING_INTERVAL`;
- `STRIPE_PRICE_STARTER_MONTHLY`;
- `STRIPE_PRICE_STARTER_ANNUAL`;
- `STRIPE_PRICE_GROWTH_MONTHLY`;
- `STRIPE_PRICE_GROWTH_ANNUAL`;
- `STRIPE_PRICE_SCALE_MONTHLY`;
- `STRIPE_PRICE_SCALE_ANNUAL`;
- `NEXT_PUBLIC_TAWK_PROPERTY_ID`;
- `NEXT_PUBLIC_TAWK_WIDGET_ID`.

## 19. Instagram Post Ideas

### Product Content

1. "From estimate to payment in one workflow"
   - Show the journey: Customer -> Estimate -> Approval -> Invoice -> Payment -> Task.

2. "Why public client links reduce friction"
   - The client can approve/reject without login, download a PDF, and view attachments.

3. "How to turn an approved estimate into executable work"
   - An approved estimate can trigger a Kanban task.

4. "The problem with spreadsheets, WhatsApp, loose PDFs, and separate payment records"
   - Position Orgaflow as the workflow hub.

5. "Recurring invoices without manual work every month"
   - Explain templates, frequency, and automatic sending.

### Technical Content

1. "How multi-tenancy works in a real SaaS"
   - Active organization header/cookie, membership, and `organizationId` filters.

2. "RBAC in practice: owner, roles, and permissions"
   - Show examples like `invoice:create`, `estimate:view`, `task:edit`.

3. "Why I used tRPC instead of REST for most of the app"
   - Type-safe contracts, React Query, SuperJSON.

4. "Secure file uploads in a multi-tenant SaaS"
   - Validate login, organization, ownership, MIME type, size, and database metadata.

5. "Generating PDFs on the server with React"
   - React PDF, templates, and private/public endpoints.

6. "Stripe webhooks done properly"
   - Raw body, `stripe-signature`, events, and subscription sync.

7. "Next.js 16: `proxy.ts` instead of middleware"
   - Explain auth redirects in the app.

8. "How to build plan limits without scattering UI conditionals everywhere"
   - `requirePlan`, `getUsageLimit`, backend validation.

### Behind-The-Scenes Content

1. "The invisible table that makes public links safe"
   - Token + createdAt + expiration.

2. "How Orgaflow decides what each user can see in the menu"
   - Menu filtered by ability, owner status, and feature gates.

3. "What happens when an invoice is paid?"
   - Payment recorded, invoice recalculated, automation may create a task.

4. "How a small business can gain process without becoming bureaucratic"
   - Show essential modules without overcomplication.

5. "Inside a SaaS: routes, APIs, database, and jobs"
   - Technical carousel with architecture.

### Educational Content For Business Owners

1. "5 signs your sales process is leaking money"
   - Forgotten estimates, overdue invoices, untracked payments, ownerless tasks, lost files.

2. "The difference between selling and operationalizing"
   - Estimate closes the sale; task delivers the promise.

3. "Why approving an estimate through a link is better than approving it through a loose message"
   - Traceability, status, date, customer, and document.

4. "How to organize partial payments"
   - Invoice can move to `PARTIALLY_PAID`.

5. "The hidden cost of not tracking expenses by customer/project"
   - Expenses support margin and reporting.

## 20. Ready-To-Use Carousel Scripts

### Carousel 1: "Inside A SaaS: Orgaflow"

1. Cover: "How Orgaflow works under the hood"
2. "The product solves the full workflow: customer, estimate, invoice, payment, and task."
3. "The architecture is multi-tenant: every business gets an isolated workspace."
4. "The main API uses tRPC: typed contracts from server to UI."
5. "Permissions use RBAC: owner, roles, and `resource:action`."
6. "Files go to Vercel Blob, but metadata stays in PostgreSQL."
7. "PDFs are generated server-side with React PDF."
8. "Stripe handles SaaS subscriptions; webhooks keep the plan synchronized."
9. "Automations connect sales events to operational tasks."
10. CTA: "Want more SaaS engineering behind the scenes?"

### Carousel 2: "The Workflow That Gets Businesses Out Of The Mess"

1. Cover: "From estimate to payment without chaos"
2. "Everything starts with the customer."
3. "You create an estimate with items, taxes, notes, and attachments."
4. "The client receives a public link and approves or rejects it."
5. "The approved estimate can become an invoice."
6. "The invoice gets a PDF, public link, and status."
7. "Payments update the financial picture."
8. "Automations can create tasks for execution."
9. "Result: sales, finance, and operations in one workflow."

### Carousel 3: "RBAC Explained With A Real Product"

1. Cover: "Permissions in SaaS: how Orgaflow does it"
2. "Not every user should see everything."
3. "The owner has full access."
4. "Members receive roles."
5. "Roles have permissions like `invoice:create` and `customer:view`."
6. "Some permissions automatically pull dependencies."
7. "Menus are also filtered by permission."
8. "The backend validates everything again before touching data."
9. "This is the kind of detail that makes SaaS security real."

### Carousel 4: "Public Links Without Opening The Whole System"

1. Cover: "How to show an invoice to a client without login"
2. "The client receives a public token."
3. "The token points to a specific document."
4. "The public page only shows what should be visible."
5. "Attachments can be marked public or private."
6. "Links can expire."
7. "The public PDF also validates token and expiration."
8. "Simple experience for the client, control for the business."

## 21. Short Hooks And Caption Lines

- "An approved estimate should not die inside a chat thread."
- "Good SaaS is not just pretty screens: it is permissions, plans, tenants, and workflow integrity."
- "The client does not need to create an account to approve a document."
- "Every invoice should know its status, payments, and attachments."
- "Multi-tenant is not just adding `organizationId` to a table. It is validating it at every boundary."
- "A useful automation turns an event into work."
- "PDFs, public links, and attachments need to speak to the same database."
- "A dashboard is only trustworthy when the entire process is connected."

## 22. Reel Topics

1. "Building a SaaS: today I will show how I protect private routes."
2. "This is the real flow of a client approving an estimate without login."
3. "How I generate invoice PDFs on the server with React."
4. "Why every Orgaflow query goes through an active organization."
5. "A simple automation: invoice paid -> task created."
6. "How Stripe tells my app that a subscription changed."
7. "What happens when a user without permission tries to open a module."

## 23. Technical Differentiators That Become Marketing

- Multi-tenant: isolation and professionalism.
- RBAC: team control.
- Public links: better client experience.
- Server-side PDFs: professional documents.
- Vercel Blob + database: organized file management.
- Stripe subscriptions: real SaaS billing.
- Automations: productivity.
- Recurring invoices: predictability.
- Plan gating: scalable product model.
- tRPC: development speed and type safety.

## 24. How To Explain Orgaflow In A Bio Or Caption

Short version:

> Orgaflow centralizes customers, estimates, invoices, payments, and tasks in one workflow for small businesses that sell through proposals.

Technical version:

> Orgaflow is a multi-tenant SaaS built with Next.js, tRPC, PostgreSQL, Drizzle, Auth.js, Stripe, and Vercel Blob to manage the full workflow of customers, documents, payments, and operational execution.

Business version:

> Stop losing information across spreadsheets, PDFs, and messages. Orgaflow connects sales, billing, and delivery in one simple process.


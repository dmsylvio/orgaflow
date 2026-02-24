import { authRouter } from "./routers/auth";
import { billingRouter } from "./routers/billing";
import { customersRouter } from "./routers/customers";
import { dashboardRouter } from "./routers/dashboard";
import { invitationsRouter } from "./routers/invitations";
import { meRouter } from "./routers/me";
import { membersRouter } from "./routers/members";
import { orgRouter } from "./routers/org";
import { overridesRouter } from "./routers/overrides";
import { permissionsRouter } from "./routers/permissions";
import { rolesRouter } from "./routers/roles";
import { router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  me: meRouter,
  billing: billingRouter,
  dashboard: dashboardRouter,
  org: orgRouter,
  invitations: invitationsRouter,
  roles: rolesRouter,
  members: membersRouter,
  overrides: overridesRouter,
  permissions: permissionsRouter,
  customers: customersRouter,
});

export type AppRouter = typeof appRouter;

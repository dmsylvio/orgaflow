import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { crudRouter } from "./routers/crud";
import { customersRouter } from "./routers/legacy/customers";
import { dashboardRouter } from "./routers/legacy/dashboard";
import { invitationsRouter } from "./routers/legacy/invitations";
import { meRouter } from "./routers/legacy/me";
import { membersRouter } from "./routers/legacy/members";
import { orgRouter } from "./routers/legacy/org";
import { overridesRouter } from "./routers/legacy/overrides";
import { permissionsRouter } from "./routers/legacy/permissions";
import { rolesRouter } from "./routers/legacy/roles";

export const appRouter = router({
  auth: authRouter,
  crud: crudRouter,
  me: meRouter,
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

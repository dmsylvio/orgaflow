import { router } from "../trpc";
import { authSignupRouter } from "./auth.signup";
import { customersRouter } from "./customers";
import { dashboardRouter } from "./dashboard";
import { invitationsRouter } from "./invitations";
import { meRouter } from "./me";
import { membersRouter } from "./members";
import { orgRouter } from "./org";
import { permissionsRouter } from "./permissions";
import { rolesRouter } from "./roles";
import { overridesRouter } from "./overrides";

export const appRouter = router({
  me: meRouter,
  dashboard: dashboardRouter,
  org: orgRouter,
  authSignup: authSignupRouter,
  invitations: invitationsRouter,
  roles: rolesRouter,
  members: membersRouter,
  overrides: overridesRouter,
  permissions: permissionsRouter,
  customers: customersRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;

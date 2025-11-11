import { router } from "../trpc";
import { authRouter } from "./auth";
import { customersRouter } from "./customers";
import { dashboardRouter } from "./dashboard";
import { meRouter } from "./me";
import { orgRouter } from "./org";

export const appRouter = router({
  auth: authRouter,
  org: orgRouter,
  customers: customersRouter,
  dashboard: dashboardRouter,
  me: meRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;

import { router } from "../trpc";
import { authRouter } from "./auth";
import { customersRouter } from "./customers";
import { orgRouter } from "./org";

export const appRouter = router({
  auth: authRouter,
  org: orgRouter,
  customers: customersRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;

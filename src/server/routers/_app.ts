import { z } from "zod";
import { procedure, router } from "../trpc";
import { customersRouter } from "./customers";
export const appRouter = router({
  hello: procedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
  customers: customersRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;

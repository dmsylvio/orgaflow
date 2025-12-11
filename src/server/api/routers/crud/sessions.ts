import { createCrudRouter } from "./base";
import { sessionCreateSchema, sessionUpdateSchema } from "./schemas";

export const sessionsRouter = createCrudRouter({
  model: "session",
  createSchema: sessionCreateSchema,
  updateSchema: sessionUpdateSchema,
});

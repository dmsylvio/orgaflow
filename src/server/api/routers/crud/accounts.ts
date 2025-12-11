import { createCrudRouter } from "./base";
import { accountCreateSchema, accountUpdateSchema } from "./schemas";

export const accountsRouter = createCrudRouter({
  model: "account",
  createSchema: accountCreateSchema,
  updateSchema: accountUpdateSchema,
});

import { createCrudRouter } from "./base";
import { userCreateSchema, userUpdateSchema } from "./schemas";

export const usersRouter = createCrudRouter({
  model: "user",
  createSchema: userCreateSchema,
  updateSchema: userUpdateSchema,
});

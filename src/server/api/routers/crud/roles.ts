import { createCrudRouter } from "./base";
import { roleCreateSchema, roleUpdateSchema } from "./schemas";

export const rolesCrudRouter = createCrudRouter({
  model: "role",
  createSchema: roleCreateSchema,
  updateSchema: roleUpdateSchema,
});

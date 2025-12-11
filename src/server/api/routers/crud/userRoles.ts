import { createCrudRouter } from "./base";
import { userRoleCreateSchema, userRoleUpdateSchema } from "./schemas";

export const userRolesRouter = createCrudRouter({
  model: "userRole",
  createSchema: userRoleCreateSchema,
  updateSchema: userRoleUpdateSchema,
});

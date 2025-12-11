import { createCrudRouter } from "./base";
import { rolePermissionCreateSchema, rolePermissionUpdateSchema } from "./schemas";

export const rolePermissionsRouter = createCrudRouter({
  model: "rolePermission",
  createSchema: rolePermissionCreateSchema,
  updateSchema: rolePermissionUpdateSchema,
});

import { createCrudRouter } from "./base";
import { permissionCreateSchema, permissionUpdateSchema } from "./schemas";

export const permissionsCrudRouter = createCrudRouter({
  model: "permission",
  createSchema: permissionCreateSchema,
  updateSchema: permissionUpdateSchema,
});

import { createCrudRouter } from "./base";
import { userPermissionOverrideCreateSchema, userPermissionOverrideUpdateSchema } from "./schemas";

export const userPermissionOverridesRouter = createCrudRouter({
  model: "userPermissionOverride",
  createSchema: userPermissionOverrideCreateSchema,
  updateSchema: userPermissionOverrideUpdateSchema,
});

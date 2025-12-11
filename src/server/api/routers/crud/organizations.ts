import { createCrudRouter } from "./base";
import { organizationCreateSchema, organizationUpdateSchema } from "./schemas";

export const organizationsRouter = createCrudRouter({
  model: "organization",
  createSchema: organizationCreateSchema,
  updateSchema: organizationUpdateSchema,
});

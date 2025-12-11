import { createCrudRouter } from "./base";
import { customerCreateSchema, customerUpdateSchema } from "./schemas";

export const customersCrudRouter = createCrudRouter({
  model: "customer",
  createSchema: customerCreateSchema,
  updateSchema: customerUpdateSchema,
});

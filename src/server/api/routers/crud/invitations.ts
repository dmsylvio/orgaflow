import { createCrudRouter } from "./base";
import { invitationCreateSchema, invitationUpdateSchema } from "./schemas";

export const invitationsCrudRouter = createCrudRouter({
  model: "invitation",
  createSchema: invitationCreateSchema,
  updateSchema: invitationUpdateSchema,
});

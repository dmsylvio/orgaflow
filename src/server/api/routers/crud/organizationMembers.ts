import { createCrudRouter } from "./base";
import { organizationMemberCreateSchema, organizationMemberUpdateSchema } from "./schemas";

export const organizationMembersRouter = createCrudRouter({
  model: "organizationMember",
  createSchema: organizationMemberCreateSchema,
  updateSchema: organizationMemberUpdateSchema,
});

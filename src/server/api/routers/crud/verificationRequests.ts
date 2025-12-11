import { createCrudRouter } from "./base";
import {
  verificationRequestCreateSchema,
  verificationRequestUpdateSchema,
} from "./schemas";

export const verificationRequestsRouter = createCrudRouter({
  model: "verificationRequest",
  createSchema: verificationRequestCreateSchema,
  updateSchema: verificationRequestUpdateSchema,
});

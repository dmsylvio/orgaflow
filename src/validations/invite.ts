import { z } from "zod";

export const inviteCreateSchema = z.object({
  orgId: z.uuid(),
  email: z.email(),
  roleId: z.uuid().optional().nullable(),
  expiresInDays: z.number().min(1).max(90).default(7),
});

export const inviteTokenSchema = z.object({
  token: z.string().min(10),
});

export type InviteCreateInput = z.infer<typeof inviteCreateSchema>;

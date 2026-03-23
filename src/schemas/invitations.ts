import { z } from "zod";

export const invitationTokenSchema = z.string().trim().min(1).max(255);

export const createInvitationSchema = z.object({
  email: z.string().trim().email().max(320),
  roleId: z.string().trim().min(1).max(255).nullable().optional(),
});

export const invitationActionSchema = z.object({
  id: z.string().trim().min(1).max(255),
});

export const acceptInvitationSchema = z.object({
  token: invitationTokenSchema,
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

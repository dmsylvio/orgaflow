import { z } from "zod";

export const inviteCreateInput = z.object({
  orgId: z.string().uuid(),
  email: z.string().email(),
  roleId: z.string().uuid().optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const inviteTokenInput = z.object({ token: z.string().uuid() });

export const listPendingInvitesInput = z.object({ orgId: z.string().uuid() });

export const revokeInviteInput = z.object({ inviteId: z.string().uuid() });

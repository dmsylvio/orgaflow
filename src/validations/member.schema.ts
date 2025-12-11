import { z } from "zod";

export const listMembersByOrgInput = z.object({ orgId: z.string().uuid() });

export const assignRolesInput = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  roleIds: z.array(z.string().uuid()),
});

export const removeMemberInput = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const transferOwnershipInput = z.object({
  orgId: z.string().uuid(),
  toUserId: z.string().uuid(),
});

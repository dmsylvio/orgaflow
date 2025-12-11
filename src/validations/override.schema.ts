import { z } from "zod";

export const createOverrideInput = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  permissionId: z.string().uuid(),
  mode: z.enum(["allow", "deny"]),
});

export const updateOverrideInput = z.object({
  id: z.string().uuid(),
  mode: z.enum(["allow", "deny"]),
});

export const deleteOverrideInput = z.object({ id: z.string().uuid() });

export const listOverridesByUserInput = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
});

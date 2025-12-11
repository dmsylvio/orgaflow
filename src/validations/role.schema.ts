import { z } from "zod";

export const orgScopeInput = z.object({ orgId: z.string().uuid() });

export const createRoleInput = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(2),
  key: z
    .string()
    .min(2)
    .regex(/^[a-z0-9:_-]+$/i)
    .optional(),
});

export const updateRoleInput = z.object({
  roleId: z.string().uuid(),
  name: z.string().min(2),
});

export const deleteRoleInput = z.object({
  roleId: z.string().uuid(),
});

export const setRolePermsInput = z.object({
  roleId: z.string().uuid(),
  permissionIds: z.array(z.string().uuid()),
});

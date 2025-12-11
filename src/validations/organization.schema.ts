import { z } from "zod";

export const createOrganizationInput = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/i),
});

export const updateOrganizationInput = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/i),
});

export const deleteOrganizationInput = z.object({
  orgId: z.string().uuid(),
});

export const switchOrganizationInput = z.object({
  orgId: z.string().uuid(),
});

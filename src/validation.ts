import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const orgSwitchSchema = z.object({ orgId: z.string().uuid() });
export const orgCreateSchema = z.object({ name: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/) });
export const orgUpdateSchema = z.object({ orgId: z.string().uuid(), name: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/) });
export const orgDeleteSchema = z.object({ orgId: z.string().uuid() });

export const listCustomersSchema = z.object({
  q: z.string().optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const customerIdSchema = z.object({ id: z.string().uuid() });
export const createCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
export const updateCustomerSchema = createCustomerSchema.extend({ id: z.string().uuid() });

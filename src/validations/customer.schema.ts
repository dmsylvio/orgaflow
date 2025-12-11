import { z } from "zod";

export const listCustomersInput = z.object({
  q: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
});

export const getCustomerByIdInput = z.object({
  id: z.string().uuid(),
});

export const createCustomerInput = z.object({
  name: z.string().min(2),
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

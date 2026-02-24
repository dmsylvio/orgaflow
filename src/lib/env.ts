import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .refine(
      (url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
      "DATABASE_URL must start with postgres:// or postgresql://",
    ),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().optional(),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PUBLIC_KEY: z.string().min(1),
  STRIPE_PRICE_GROWTH_MONTHLY: z.string().min(1),
  STRIPE_PRICE_GROWTH_ANNUAL: z.string().min(1),
  STRIPE_PRICE_ENTERPRISE_MONTHLY: z.string().min(1),
  STRIPE_PRICE_ENTERPRISE_ANNUAL: z.string().min(1),
});

export const env = envSchema.parse(process.env);

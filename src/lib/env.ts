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
});

export const env = envSchema.parse(process.env);

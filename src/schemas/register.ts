import { z } from "zod";

const PASSWORD_MIN = 8;

const registerPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`);

/**
 * Validação exclusiva do fluxo de **registo**.
 * Não misturar com login / reset / forgot — cada fluxo tem o seu ficheiro.
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    email: z.email({
      message: "Enter a valid email",
    }),
    password: registerPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

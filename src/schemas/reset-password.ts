import { z } from "zod";

const PASSWORD_MIN = 8;

const resetPasswordFieldSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`);

/**
 * Validação exclusiva do fluxo **reset password** (novo token + nova password).
 * Regras de password alinhadas ao registo, mas definidas aqui para não acoplar ficheiros.
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset link is invalid or expired"),
    password: resetPasswordFieldSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

import { z } from "zod";

/**
 * Validação exclusiva do fluxo **forgot password** (pedido de link).
 */
export const forgotPasswordSchema = z.object({
  email: z.email({
    message: "Enter a valid email",
  }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

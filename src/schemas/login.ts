import { z } from "zod";

/**
 * Validação exclusiva do fluxo de **sign-in** (credenciais).
 * Não misturar com register / reset / forgot — ver ficheiros dedicados.
 */
export const loginSchema = z.object({
  email: z.email({
    message: "Enter a valid email",
  }),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

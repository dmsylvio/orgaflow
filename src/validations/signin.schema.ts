import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type SignInInput = z.infer<typeof signInSchema>;

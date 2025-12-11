import { z } from "zod";

export const signupAccountSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
});

export const signupOrgSchema = z.object({
  orgName: z.string().min(2, "Informe o nome da organização"),
  slug: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use minúsculas, números e hífen"),
});

export const signupFullSchema = signupAccountSchema.merge(signupOrgSchema);
export type SignupFullInput = z.infer<typeof signupFullSchema>;

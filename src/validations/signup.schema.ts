import { z } from "zod";

export const signupUserSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome"),
    email: z.email("E-mail inválido"),
    password: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmPassword: z.string().min(6, "Mínimo de 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type SignupUserInput = z.infer<typeof signupUserSchema>;

export const signupOrgSchema = z.object({
  orgName: z.string().min(2, "Informe o nome da organização"),
});
export type SignupOrgInput = z.infer<typeof signupOrgSchema>;

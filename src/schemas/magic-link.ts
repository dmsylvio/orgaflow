import { z } from "zod";

/** Passwordless sign-in: just an email. */
export const magicLinkLoginSchema = z.object({
  email: z.email({ message: "Enter a valid email" }),
});

/** Passwordless sign-up: name + email (the account is created on first click). */
export const magicLinkRegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email({ message: "Enter a valid email" }),
});

export type MagicLinkLoginValues = z.infer<typeof magicLinkLoginSchema>;
export type MagicLinkRegisterValues = z.infer<typeof magicLinkRegisterSchema>;

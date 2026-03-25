import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your Orgaflow account.",
  robots: { index: false, follow: false },
};

/**
 * Página forgot-password: formulário colocado na rota (`forgot-password-form.tsx`).
 * Ver `docs/orgaflow-ui-architecture.md`.
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

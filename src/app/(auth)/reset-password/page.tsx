import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Orgaflow account.",
  robots: { index: false, follow: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Página reset-password: `token` na query (email) + formulário na rota
 * (`reset-password-form.tsx`). Ver `docs/orgaflow-ui-architecture.md`.
 */
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return <ResetPasswordForm initialToken={token} />;
}

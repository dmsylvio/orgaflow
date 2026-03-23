import { ResetPasswordForm } from "./reset-password-form";

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

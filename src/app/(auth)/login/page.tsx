import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Orgaflow account.",
  robots: { index: false, follow: false },
};

/**
 * Página de login: formulário colocado na rota (`login-form.tsx`).
 * Ver `docs/orgaflow-ui-architecture.md`.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

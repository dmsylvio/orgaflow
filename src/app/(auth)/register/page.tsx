import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Orgaflow account and start your free plan.",
  robots: { index: false, follow: false },
};

/**
 * Página de registo: formulário colocado na rota (`register-form.tsx`).
 * Ver `docs/orgaflow-ui-architecture.md`.
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

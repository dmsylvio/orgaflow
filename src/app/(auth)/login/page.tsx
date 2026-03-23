import { Suspense } from "react";
import { LoginForm } from "./login-form";

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

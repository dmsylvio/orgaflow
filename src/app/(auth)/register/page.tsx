import { Suspense } from "react";
import { RegisterForm } from "./register-form";

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

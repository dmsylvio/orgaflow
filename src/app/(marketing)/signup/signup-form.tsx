// app/signup/page.tsx ou components/SignupForm.tsx
"use client";

import { useState } from "react";
import { OrgCreationForm } from "./org-creation-form";
import { UserSignupForm } from "./user-signup-form";

export default function SignupForm() {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div className="rounded border p-6 shadow-sm bg-white">
      <h1 className="text-xl font-semibold mb-1">Criar conta</h1>
      <p className="text-sm text-neutral-500 mb-6">
        {step === 1
          ? "Informe seus dados para criar sua conta."
          : "Agora, crie sua organização para começar."}
      </p>

      {step === 2 ? (
        <UserSignupForm onSuccess={() => setStep(2)} />
      ) : (
        <OrgCreationForm />
      )}
    </div>
  );
}

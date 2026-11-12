import type { Metadata } from "next";
import { Suspense } from "react";
import { MagicLinkRegisterForm } from "./magic-link-register-form";

export const metadata: Metadata = {
  title: "Create account with an email link",
  description: "Create your Orgaflow account without a password.",
  robots: { index: false, follow: false },
};

export default function MagicLinkRegisterPage() {
  return (
    <Suspense fallback={null}>
      <MagicLinkRegisterForm />
    </Suspense>
  );
}

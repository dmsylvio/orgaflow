import type { Metadata } from "next";
import { Suspense } from "react";
import { MagicLinkLoginForm } from "./magic-link-login-form";

export const metadata: Metadata = {
  title: "Sign in with an email link",
  description: "Get a one-time link to sign in to Orgaflow without a password.",
  robots: { index: false, follow: false },
};

export default function MagicLinkLoginPage() {
  return (
    <Suspense fallback={null}>
      <MagicLinkLoginForm />
    </Suspense>
  );
}

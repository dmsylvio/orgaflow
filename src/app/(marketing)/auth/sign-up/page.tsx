import { Suspense } from "react";
import SignupForm from "../../signup/signup-form";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-sm text-neutral-500">Loading…</div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

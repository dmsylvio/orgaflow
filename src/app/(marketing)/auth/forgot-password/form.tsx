"use client";

import Link from "next/link";

export default function ForgotForm() {
  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Forgot your password?</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Enter your email and we’ll send you a secure reset link.
      </p>

      <form className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Send reset link
        </button>
      </form>

      <div className="mt-6 text-sm text-neutral-600">
        <Link href="/auth/sign-in" className="hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

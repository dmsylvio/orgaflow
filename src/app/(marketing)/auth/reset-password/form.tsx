"use client";

import Link from "next/link";

export default function ResetForm() {
  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Choose a new password for your account.
      </p>

      <form className="mt-6 space-y-4">
        <div>
          <label htmlFor="token" className="text-sm font-medium">
            Recovery code
          </label>
          <input
            id="token"
            type="text"
            placeholder="Enter your code"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Update password
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

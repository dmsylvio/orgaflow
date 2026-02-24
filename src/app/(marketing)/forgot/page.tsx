import Link from "next/link";

export default function ForgotPage() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold mb-1">Forgot password</h1>
      <p className="text-sm text-neutral-600">
        Enter your email and we’ll send you a reset link.
      </p>

      <form className="mt-4 space-y-3">
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

      <div className="mt-4 text-center text-sm">
        <Link href="/signin" className="underline text-neutral-600">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

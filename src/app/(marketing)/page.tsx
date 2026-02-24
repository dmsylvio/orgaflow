import Link from "next/link";

export default function Page() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Orgaflow</h1>
        <p className="text-sm text-neutral-600">
          A modern multi-tenant workspace to manage your organization.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        <Link
          href="/signin"
          className="w-full rounded-md bg-black px-4 py-2 text-center text-sm font-medium text-white"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="w-full rounded-md border px-4 py-2 text-center text-sm font-medium"
        >
          Create account
        </Link>
        <Link
          href="/forgot"
          className="text-center text-sm text-neutral-600 underline"
        >
          Forgot password?
        </Link>
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        By continuing, you agree to our Terms and Privacy Policy.
      </div>
    </div>
  );
}

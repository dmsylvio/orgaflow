import Link from "next/link";

export default function RecoverPage() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold mb-1">Reset password</h1>
      <p className="text-sm text-neutral-600">
        Set a new password for your account.
      </p>

      <form className="mt-4 space-y-3">
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

      <div className="mt-4 text-center text-sm">
        <Link href="/signin" className="underline text-neutral-600">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

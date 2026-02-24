import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 p-10 text-white">
        <div>
          <Link href="/" className="text-sm font-semibold tracking-wide">
            Orgaflow
          </Link>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">
            Run every entity with one operating system.
          </h1>
          <p className="text-sm text-neutral-200">
            Billing, expenses, and team access — all in a secure multi-tenant
            workspace.
          </p>
        </div>
        <div className="text-xs text-neutral-300">orgaflow.vercel.app</div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">{children}</div>
      </section>
    </main>
  );
}

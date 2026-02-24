import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-[70vh] space-y-16">
      <header className="flex items-center justify-between rounded-lg border bg-white px-6 py-4 shadow-sm">
        <div className="text-lg font-semibold">Orgaflow</div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/features" className="text-neutral-600 hover:text-black">
            Features
          </Link>
          <Link href="/pricing" className="text-neutral-600 hover:text-black">
            Pricing
          </Link>
          <Link href="/signin" className="text-neutral-600 hover:text-black">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-black px-3 py-2 text-white"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="grid gap-8 rounded-lg border bg-white p-8 shadow-sm md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold md:text-4xl">
            Run your organization in one place.
          </h1>
          <p className="text-sm text-neutral-600">
            Orgaflow keeps customers, estimates, invoices, and team permissions
            together in a clean, multi-tenant workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Create account
            </Link>
            <Link
              href="/signin"
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Sign in
            </Link>
          </div>
          <p className="text-xs text-neutral-500">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
        <div className="grid gap-4 rounded-lg border bg-neutral-50 p-4 text-sm text-neutral-700">
          <div className="font-medium">Why teams choose Orgaflow</div>
          <ul className="space-y-2">
            <li>• Multi-tenant workspaces with role-based access.</li>
            <li>• Fast invoicing, estimates, and payment tracking.</li>
            <li>• Unified customer and item management.</li>
            <li>• Clear reporting and organization switching.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Stay organized",
            text: "Keep customers, items, and documents in one shared hub.",
          },
          {
            title: "Invoice with confidence",
            text: "Create invoices, track payments, and automate recurring billing.",
          },
          {
            title: "Control access",
            text: "Assign roles and permissions to keep teams aligned.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            <h3 className="text-base font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{card.text}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col items-start gap-3 rounded-lg border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to get started?</h2>
          <p className="text-sm text-neutral-600">
            Create your organization in minutes and invite your team.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Start free
          </Link>
          <Link
            href="/signin"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}

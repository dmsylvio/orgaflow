import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Orgaflow | Business management platform",
  description:
    "Orgaflow is a modern multi-tenant platform for managing customers, invoices, payments, expenses, and team access in one place.",
  openGraph: {
    title: "Orgaflow | Business management platform",
    description:
      "Run billing, expenses, and reporting across multiple companies with Orgaflow.",
    type: "website",
  },
};


const metrics = [
  { label: "Average invoice cycle", value: "-32%" },
  { label: "Monthly revenue visibility", value: "+24%" },
  { label: "Operational time saved", value: "120h" },
];

const capabilities = [
  {
    title: "Revenue operations",
    text: "Quotes, invoices, recurring billing, and payments aligned in one workflow.",
  },
  {
    title: "Customer intelligence",
    text: "Organize contacts, activity, and documents with a clear customer timeline.",
  },
  {
    title: "Expense control",
    text: "Track expenses and approvals while keeping budgets visible to owners.",
  },
  {
    title: "Governance & access",
    text: "Granular permissions, roles, and audit-friendly organization switching.",
  },
];

const modules = [
  "Dashboard",
  "Customers",
  "Items",
  "Estimates",
  "Invoices",
  "Recurring Billing",
  "Payments",
  "Expenses",
  "Reports",
  "Team & Roles",
];

export default function Page() {
  return (
    <div className="space-y-16">
      <header className="flex flex-col gap-4 rounded-2xl border bg-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
            OF
          </div>
          <div>
            <div className="text-lg font-semibold">Orgaflow</div>
            <div className="text-xs text-neutral-500">
              Business management platform
            </div>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/features" className="text-neutral-600 hover:text-black">
            Platform
          </Link>
          <Link href="/pricing" className="text-neutral-600 hover:text-black">
            Pricing
          </Link>
          <Link href="/auth/sign-in" className="text-neutral-600 hover:text-black">
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-full bg-black px-4 py-2 text-white"
          >
            Start now
          </Link>
        </nav>
      </header>

      <section className="grid gap-10 rounded-3xl border bg-white p-10 shadow-sm md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
            Built for multi-entity organizations
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            A modern operating system for finance and operations teams.
          </h1>
          <p className="text-base text-neutral-600">
            Orgaflow consolidates billing, expenses, reporting, and access
            control in a secure multi-tenant platform — so leaders can manage
            growth without adding complexity.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth/sign-up"
              className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white"
            >
              Get started
            </Link>
            <Link
              href="/auth/sign-in"
              className="rounded-md border px-5 py-2.5 text-sm font-medium"
            >
              Schedule a demo
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border bg-neutral-50 px-4 py-3"
              >
                <div className="text-lg font-semibold text-black">
                  {metric.value}
                </div>
                <div className="text-xs text-neutral-500">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-neutral-50 p-6">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Executive summary</span>
            <span>Updated 2h ago</span>
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-neutral-500">Revenue pipeline</div>
              <div className="mt-2 text-2xl font-semibold">$1.82M</div>
              <div className="mt-1 text-xs text-green-600">+18% quarter</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-neutral-500">Cash collected</div>
              <div className="mt-2 text-2xl font-semibold">$312,400</div>
              <div className="mt-1 text-xs text-neutral-500">
                92% on-time payments
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-neutral-500">Team workload</div>
              <div className="mt-2 text-2xl font-semibold">14 active</div>
              <div className="mt-1 text-xs text-neutral-500">
                4 approvals pending
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {capabilities.map((capability) => (
          <div
            key={capability.title}
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >
            <h3 className="text-base font-semibold">{capability.title}</h3>
            <p className="mt-3 text-sm text-neutral-600">
              {capability.text}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 rounded-3xl border bg-white p-8 shadow-sm md:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Enterprise-grade foundation</h2>
          <p className="text-sm text-neutral-600">
            From compliance to permissions, Orgaflow is designed to support
            operational rigor while giving teams the speed they need.
          </p>
          <div className="space-y-3 text-sm text-neutral-700">
            <div className="rounded-xl border bg-neutral-50 px-4 py-3">
              Role-based access control with per-user overrides
            </div>
            <div className="rounded-xl border bg-neutral-50 px-4 py-3">
              Multi-tenant segregation by organization and workspace
            </div>
            <div className="rounded-xl border bg-neutral-50 px-4 py-3">
              Audit-ready records for every billing and expense action
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-neutral-50 p-6">
          <div className="text-sm font-semibold">Core modules</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {modules.map((module) => (
              <div
                key={module}
                className="rounded-lg border bg-white px-3 py-2 text-sm"
              >
                {module}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border bg-white p-8 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Designed for leadership</h2>
          <p className="mt-3 text-sm text-neutral-600">
            Give executives instant visibility while teams stay focused on
            execution. Orgaflow brings planning, billing, and reporting into a
            single command center.
          </p>
        </div>
        <div className="rounded-2xl border bg-neutral-50 p-6 text-sm text-neutral-600">
          <p className="text-sm font-semibold text-black">
            “Orgaflow gave us one system to manage billing, approvals, and
            reporting across three entities. The time savings are immediate.”
          </p>
          <div className="mt-4 text-xs text-neutral-500">
            Finance Director · Services Group
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-3xl border bg-black px-8 py-10 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Move faster with Orgaflow</h2>
          <p className="mt-2 text-sm text-neutral-300">
            Launch a new organization, bring your team, and start issuing
            invoices in minutes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/auth/sign-up"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black"
          >
            Start free
          </Link>
          <Link
            href="/auth/sign-in"
            className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-medium"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-neutral-500 md:flex-row">
        <div>© {new Date().getFullYear()} Orgaflow. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-black">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-black">
            Terms
          </Link>
          <Link href="/auth/sign-in" className="hover:text-black">
            Support
          </Link>
        </div>
      </footer>
    </div>
  );
}

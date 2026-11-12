import { Instagram } from "lucide-react";
import Link from "next/link";
import MainLogo from "../logo";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Product tour", href: "/#tour" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  Compare: [
    { label: "All comparisons", href: "/compare" },
    { label: "vs FreshBooks", href: "/compare/freshbooks" },
    { label: "vs QuickBooks", href: "/compare/quickbooks" },
    { label: "vs Jobber", href: "/compare/jobber" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="on-dark relative mx-3 mb-3 overflow-hidden rounded-[2rem] bg-ink text-slate-300 sm:mx-5 sm:mb-5">
      <div aria-hidden className="bg-grid absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <MainLogo className="h-auto w-36 fill-white" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Estimate and invoice software for small businesses, from the first
              quote to the finished job.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="https://x.com/orgaflowapp"
                aria-label="Orgaflow on X"
                rel="noopener"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-white/30 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <title>Twitter / X</title>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href="https://www.instagram.com/orgaflow.app"
                rel="noopener"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-white/30 hover:text-white"
              >
                <Instagram className="h-4 w-4" aria-hidden />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 text-sm font-bold text-white">{group}</h3>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            © {new Date().getFullYear()} Orgaflow LLC. All rights reserved.
          </p>
          <p className="text-center text-xs text-slate-500 sm:text-right">
            Estimate, invoice, and job software for small businesses.
          </p>
        </div>
      </div>
    </footer>
  );
}

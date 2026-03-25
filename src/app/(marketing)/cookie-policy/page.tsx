import type { Metadata } from "next";
import NextLink from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — Orgaflow",
  description: "How Orgaflow uses cookies and similar tracking technologies.",
};

const LAST_UPDATED = "March 24, 2026";
const EFFECTIVE_DATE = "March 24, 2026";

interface CookieRow {
  name: string;
  type: string;
  purpose: string;
  duration: string;
}

const COOKIES: CookieRow[] = [
  {
    name: "authjs.session-token",
    type: "Essential",
    purpose: "Maintains your authenticated session.",
    duration: "30 days",
  },
  {
    name: "authjs.csrf-token",
    type: "Essential",
    purpose: "Prevents cross-site request forgery attacks.",
    duration: "Session",
  },
  {
    name: "active_organization_id",
    type: "Functional",
    purpose: "Remembers your last active workspace.",
    duration: "30 days",
  },
  {
    name: "__stripe_mid",
    type: "Third-party",
    purpose: "Stripe fraud prevention and payment security.",
    duration: "1 year",
  },
  {
    name: "__stripe_sid",
    type: "Third-party",
    purpose: "Stripe session identification during checkout.",
    duration: "30 minutes",
  },
];

const TYPE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Essential:   { bg: "bg-primary/8",   text: "text-primary",   border: "border-primary/20" },
  Functional:  { bg: "bg-blue-50",     text: "text-blue-700",  border: "border-blue-200" },
  "Third-party": { bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200" },
};

export default function CookiePolicyPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="border-b border-border bg-muted/40 py-16 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Cookie Policy
          </h1>
          <p className="text-muted-foreground">
            Effective: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-base leading-relaxed text-muted-foreground">
          This Cookie Policy explains how Orgaflow ("we", "us", "our") uses
          cookies and similar technologies when you visit our website or use our
          platform. By using Orgaflow, you consent to the use of cookies as
          described below.
        </p>

        {/* What are cookies */}
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">1. What Are Cookies?</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cookies are small text files placed on your device by a website when you visit it.
            They are widely used to make websites work properly, remember preferences, and
            provide information to the site owners. Cookies set by us are called "first-party
            cookies". Cookies set by third parties (like Stripe) are called "third-party cookies".
          </p>
        </div>

        {/* Types */}
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">2. Types of Cookies We Use</h2>
          <div className="flex flex-col gap-5">
            {[
              {
                type: "Essential",
                description:
                  "These cookies are strictly necessary to provide you with the Service. Without them, authentication and core functionality would not work. They cannot be disabled.",
              },
              {
                type: "Functional",
                description:
                  "These cookies remember your preferences and choices (like your active workspace) to improve your experience. Disabling them may affect some features.",
              },
              {
                type: "Third-party",
                description:
                  "These cookies are set by our service providers (primarily Stripe) for payment security and fraud prevention. We do not control these cookies directly.",
              },
            ].map(({ type, description }) => {
              const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.Essential;
              return (
                <div key={type} className="rounded-xl border border-border bg-background p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {type}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cookie table */}
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-foreground">3. Cookies We Set</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Cookie</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Purpose</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COOKIES.map(({ name, type, purpose, duration }) => {
                  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.Essential;
                  return (
                    <tr key={name} className="bg-background">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{name}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{purpose}</td>
                      <td className="px-4 py-3 text-muted-foreground">{duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Managing */}
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">4. Managing Cookies</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You can control and delete cookies through your browser settings. Each browser
            is different — consult your browser's help documentation to learn how to manage
            cookies. Please note that disabling essential cookies will prevent you from
            signing in and using the Service.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Common browser cookie settings:
          </p>
          <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-muted-foreground">
            <li>Chrome: Settings → Privacy and security → Cookies</li>
            <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
            <li>Safari: Preferences → Privacy → Manage Website Data</li>
            <li>Edge: Settings → Cookies and site permissions</li>
          </ul>
        </div>

        {/* Third-party */}
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">5. Third-Party Cookies</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Stripe, our payment processor, may set cookies on your device when you complete
            a purchase or interact with billing features. These cookies are governed by{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stripe's Privacy Policy
            </a>
            . We do not use third-party advertising or analytics cookies.
          </p>
        </div>

        {/* Changes */}
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">6. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update this Cookie Policy to reflect changes in our practices or applicable
            law. Material changes will be communicated via email or an in-platform notice.
            Continued use of the Service after changes take effect constitutes your acceptance.
          </p>
        </div>

        {/* Contact */}
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-foreground">7. Contact</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            For questions about our use of cookies, contact us at{" "}
            <strong className="text-foreground">privacy@orgaflow.io</strong> or via our{" "}
            <NextLink href="/contact" className="text-primary hover:underline">
              contact page
            </NextLink>
            .
          </p>
        </div>

        {/* Legal nav */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-border pt-8">
          <NextLink href="/privacy-policy" className="text-sm text-primary hover:underline">
            Privacy Policy
          </NextLink>
          <NextLink href="/terms-of-service" className="text-sm text-primary hover:underline">
            Terms of Service
          </NextLink>
          <NextLink href="/contact" className="text-sm text-primary hover:underline">
            Contact us
          </NextLink>
        </div>
      </section>
    </div>
  );
}

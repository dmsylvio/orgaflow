import type { Metadata } from "next";
import NextLink from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Orgaflow collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy-policy" },
};

const LAST_UPDATED = "March 24, 2026";
const EFFECTIVE_DATE = "March 24, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="border-b border-border bg-muted/40 py-16 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Effective: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="lead text-base leading-relaxed text-muted-foreground">
            At Orgaflow ("we", "us", or "our"), your privacy is a priority. This
            Privacy Policy explains what information we collect, how we use it,
            and your rights regarding your data when you use our platform at{" "}
            <strong>orgaflow.io</strong>.
          </p>

          {[
            {
              title: "1. Information We Collect",
              content: (
                <>
                  <p>We collect information you provide directly and information generated as you use our service:</p>
                  <ul>
                    <li><strong>Account information:</strong> name, email address, and password when you register.</li>
                    <li><strong>Organization data:</strong> company name, address, tax information, and preferences you enter into your workspace.</li>
                    <li><strong>Business data:</strong> customers, estimates, invoices, payments, tasks, and expenses you create within the platform.</li>
                    <li><strong>Billing information:</strong> payment details processed securely by Stripe. We do not store card numbers.</li>
                    <li><strong>Usage data:</strong> pages visited, features used, timestamps, IP address, browser type, and device information.</li>
                    <li><strong>Communications:</strong> messages you send to our support team.</li>
                  </ul>
                </>
              ),
            },
            {
              title: "2. How We Use Your Information",
              content: (
                <>
                  <p>We use the collected information to:</p>
                  <ul>
                    <li>Provide, operate, and maintain the Orgaflow platform.</li>
                    <li>Process payments and manage your subscription via Stripe.</li>
                    <li>Send transactional emails (account confirmations, password resets, invoices).</li>
                    <li>Provide customer support and respond to your requests.</li>
                    <li>Monitor and improve the security, performance, and reliability of our service.</li>
                    <li>Comply with legal obligations.</li>
                  </ul>
                  <p>We do <strong>not</strong> sell your personal data to third parties.</p>
                </>
              ),
            },
            {
              title: "3. Data Sharing",
              content: (
                <>
                  <p>We share your data only with trusted third-party services necessary to operate Orgaflow:</p>
                  <ul>
                    <li><strong>Stripe</strong> — payment processing and subscription management.</li>
                    <li><strong>Resend / Nodemailer</strong> — transactional email delivery.</li>
                    <li><strong>PostgreSQL hosting provider</strong> — secure database storage.</li>
                    <li><strong>Vercel</strong> — platform hosting and edge network.</li>
                  </ul>
                  <p>All sub-processors are bound by data processing agreements and applicable privacy laws.</p>
                </>
              ),
            },
            {
              title: "4. Data Retention",
              content: (
                <p>
                  We retain your data for as long as your account is active. If you cancel your
                  subscription, your data is retained for 30 days during which you can request an
                  export. After this period, your data is permanently deleted from our systems.
                  Some data may be retained longer to comply with legal obligations.
                </p>
              ),
            },
            {
              title: "5. Security",
              content: (
                <p>
                  We implement industry-standard security measures including TLS encryption in
                  transit, encrypted storage at rest, access controls, and regular security
                  reviews. However, no system is 100% secure. We encourage you to use a strong
                  unique password and enable two-factor authentication when available.
                </p>
              ),
            },
            {
              title: "6. Your Rights",
              content: (
                <>
                  <p>Depending on your location, you may have the following rights:</p>
                  <ul>
                    <li><strong>Access:</strong> request a copy of your personal data.</li>
                    <li><strong>Correction:</strong> request correction of inaccurate data.</li>
                    <li><strong>Deletion:</strong> request deletion of your account and data.</li>
                    <li><strong>Portability:</strong> export your business data in a machine-readable format.</li>
                    <li><strong>Objection:</strong> object to certain processing activities.</li>
                  </ul>
                  <p>To exercise any of these rights, contact us at <strong>privacy@orgaflow.io</strong>.</p>
                </>
              ),
            },
            {
              title: "7. Cookies",
              content: (
                <p>
                  We use cookies and similar technologies to operate and improve our service.
                  For details, see our{" "}
                  <NextLink href="/cookie-policy" className="text-primary hover:underline">
                    Cookie Policy
                  </NextLink>
                  .
                </p>
              ),
            },
            {
              title: "8. Children's Privacy",
              content: (
                <p>
                  Orgaflow is not directed to children under 16. We do not knowingly collect
                  personal data from children. If you believe a child has provided us with
                  personal data, please contact us and we will delete it promptly.
                </p>
              ),
            },
            {
              title: "9. Changes to This Policy",
              content: (
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of
                  material changes via email or a prominent notice within the platform at least
                  7 days before changes take effect. Continued use of the service after the
                  effective date constitutes acceptance.
                </p>
              ),
            },
            {
              title: "10. Contact",
              content: (
                <p>
                  For privacy-related questions or to exercise your rights, contact our Data
                  Protection team at <strong>privacy@orgaflow.io</strong> or via our{" "}
                  <NextLink href="/contact" className="text-primary hover:underline">
                    contact page
                  </NextLink>
                  .
                </p>
              ),
            },
          ].map(({ title, content }) => (
            <div key={title} className="mt-10">
              <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5">
                {content}
              </div>
            </div>
          ))}
        </div>

        {/* Legal nav */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-border pt-8">
          <NextLink href="/terms-of-service" className="text-sm text-primary hover:underline">
            Terms of Service
          </NextLink>
          <NextLink href="/cookie-policy" className="text-sm text-primary hover:underline">
            Cookie Policy
          </NextLink>
          <NextLink href="/contact" className="text-sm text-primary hover:underline">
            Contact us
          </NextLink>
        </div>
      </section>
    </div>
  );
}

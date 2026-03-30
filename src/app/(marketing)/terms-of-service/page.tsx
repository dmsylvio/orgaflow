import type { Metadata } from "next";
import NextLink from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions governing your use of Orgaflow.",
  alternates: { canonical: "/terms-of-service" },
  openGraph: {
    title: "Terms of Service - Orgaflow",
    description: "The terms and conditions governing your use of Orgaflow.",
    url: "/terms-of-service",
    type: "website",
  },
  twitter: {
    title: "Terms of Service - Orgaflow",
    description: "The terms and conditions governing your use of Orgaflow.",
  },
};

const LAST_UPDATED = "March 30, 2026";
const EFFECTIVE_DATE = "March 30, 2026";

export default function TermsOfServicePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="border-b border-border bg-muted/40 py-16 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Legal
          </p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Effective: {EFFECTIVE_DATE} | Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-foreground">
          <p className="text-base leading-relaxed text-muted-foreground">
            These Terms of Service ("Terms") govern your access to and use of
            the Orgaflow platform ("Service") operated by Orgaflow LLC
            ("Orgaflow", "we", "us"). By creating an account or using the
            Service, you agree to these Terms. If you do not agree, do not use
            the Service.
          </p>

          {[
            {
              title: "1. Accounts",
              items: [
                "You must be at least 18 years old and capable of entering a binding contract.",
                "You are responsible for maintaining the confidentiality of your login credentials.",
                "You are responsible for all activity that occurs under your account.",
                "You must notify us immediately of any unauthorized access at app@orgaflow.dev.",
                "You may not share your account with others or create accounts on behalf of others without authorization.",
              ],
            },
            {
              title: "2. Acceptable Use",
              items: [
                "You may use the Service only for lawful business purposes.",
                "You may not use the Service to transmit spam, malware, or illegal content.",
                "You may not attempt to reverse-engineer, scrape, or disrupt the platform.",
                "You may not use the Service to store or process data you do not have the right to use.",
                "Violation of these rules may result in immediate suspension or termination.",
              ],
            },
            {
              title: "3. Subscriptions & Payment",
              items: [
                "Paid plans are billed in advance on a monthly or annual cycle via Stripe.",
                "All fees are non-refundable except as required by law or as stated in our refund policy.",
                "You authorize Orgaflow to charge your payment method for recurring fees.",
                "Failed payments may result in service suspension after a grace period of 7 days.",
                "Plan changes take effect immediately; downgrades apply at the end of the current billing cycle.",
              ],
            },
            {
              title: "4. Your Data",
              items: [
                "You retain full ownership of all data you submit to the Service.",
                "You grant Orgaflow a limited license to store, process, and display your data solely to provide the Service.",
                "We do not sell or share your data with third parties for advertising purposes.",
                "You are responsible for ensuring your data complies with applicable laws.",
                "Upon account termination, your data is deleted within 30 days unless required by law.",
              ],
            },
            {
              title: "5. Intellectual Property",
              items: [
                "The Orgaflow platform, brand, and all associated software are owned by Orgaflow LLC.",
                "You are granted a limited, non-exclusive, non-transferable license to use the Service.",
                "You may not copy, modify, distribute, or create derivative works from the Service.",
                "Feedback you provide may be used by us to improve the Service without obligation to you.",
              ],
            },
            {
              title: "6. Uptime & Service Availability",
              items: [
                "We target 99%+ uptime but do not guarantee uninterrupted access.",
                "We may perform scheduled maintenance with advance notice when possible.",
                "We are not liable for downtime caused by third-party infrastructure, force majeure, or events outside our control.",
              ],
            },
            {
              title: "7. Limitation of Liability",
              items: [
                'The Service is provided "as is" without warranties of any kind.',
                "Orgaflow's total liability to you shall not exceed the fees paid by you in the 12 months preceding the claim.",
                "We are not liable for indirect, incidental, consequential, or punitive damages.",
                "Some jurisdictions do not allow liability limitations — in those cases, the minimum liability permitted by law applies.",
              ],
            },
            {
              title: "8. Termination",
              items: [
                "You may cancel your subscription at any time from the billing settings. Access continues until the end of the period.",
                "We may suspend or terminate your account for violation of these Terms, with or without notice.",
                "Upon termination, you may export your data within 30 days before it is permanently deleted.",
              ],
            },
            {
              title: "9. Changes to Terms",
              items: [
                "We may update these Terms at any time. Material changes will be communicated via email or in-app notice at least 7 days in advance.",
                "Continued use of the Service after changes take effect constitutes your acceptance.",
              ],
            },
            {
              title: "10. Governing Law",
              items: [
                "These Terms are governed by the laws of the State of Florida, USA, without regard to conflict of law principles.",
                "Any disputes shall be resolved through binding arbitration in Tampa, FL, except where prohibited by law.",
              ],
            },
            {
              title: "11. Contact",
              items: [
                "For questions about these Terms, contact us at app@orgaflow.dev or via our contact page.",
                "Mailing address: Orgaflow LLC, 1600 E 8th Ave A200, Tampa, FL 33605.",
              ],
            },
          ].map(({ title, items }) => (
            <div key={title} className="mt-10">
              <h2 className="mb-3 text-lg font-bold text-foreground">
                {title}
              </h2>
              <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal nav */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-border pt-8">
          <NextLink
            href="/privacy-policy"
            className="text-sm text-primary hover:underline"
          >
            Privacy Policy
          </NextLink>
          <NextLink
            href="/cookie-policy"
            className="text-sm text-primary hover:underline"
          >
            Cookie Policy
          </NextLink>
          <NextLink
            href="/contact"
            className="text-sm text-primary hover:underline"
          >
            Contact us
          </NextLink>
        </div>
      </section>
    </div>
  );
}

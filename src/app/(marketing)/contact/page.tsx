import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { marketingMetadata } from "@/lib/marketing-metadata";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = marketingMetadata({
  title: "Contact Support",
  description:
    "Ask a question, get help with your account, or share feedback. Email app@orgaflow.dev or send a message, and the founder of Orgaflow will reply.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Write to the person who builds Orgaflow."
      >
        Ask a question, report a bug, or tell us what's missing. We read every
        message.
      </PageHero>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[3fr_2fr] lg:gap-16">
        <div>
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Send a message
          </h2>
          <ContactForm />
        </div>

        <div className="lg:pt-14">
          <dl className="rounded-3xl bg-muted px-6 py-2">
            <div className="border-t border-foreground/15 py-4 first:border-t-0">
              <dt className="font-bold">Email</dt>
              <dd className="mt-1">
                <a
                  href="mailto:app@orgaflow.dev"
                  className="text-primary underline underline-offset-4"
                >
                  app@orgaflow.dev
                </a>
              </dd>
            </div>
            <div className="border-t border-foreground/15 py-4 first:border-t-0">
              <dt className="font-bold">Mailing address</dt>
              <dd className="mt-1 text-muted-foreground">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=1600%20E%208th%20Ave%20A200%2C%20Tampa%2C%20FL%2033605"
                  className="underline underline-offset-4"
                >
                  1600 E 8th Ave A200, Tampa, FL 33605
                </a>
              </dd>
            </div>
            <div className="border-t border-foreground/15 py-4">
              <dt className="font-bold">Phone support</dt>
              <dd className="mt-1 text-muted-foreground">
                We don't offer phone support right now. Email is the best way to
                reach us.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}

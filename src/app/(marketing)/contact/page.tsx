import { Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Orgaflow LLC. Email us at app@orgaflow.dev and we'll get back to you as soon as we can.",
  keywords: [
    "contact Orgaflow",
    "support",
    "feature request",
    "business software help",
  ],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact - Orgaflow",
    description:
      "Contact Orgaflow LLC. Email us at app@orgaflow.dev and we'll get back to you as soon as we can.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    title: "Contact - Orgaflow",
    description:
      "Contact Orgaflow LLC. Email us at app@orgaflow.dev and we'll get back to you as soon as we can.",
  },
};

const CONTACT_ITEMS = [
  {
    Icon: Mail,
    label: "Email",
    value: "app@orgaflow.dev",
    href: "mailto:app@orgaflow.dev",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    Icon: MapPin,
    label: "Address",
    value: "1600 E 8th Ave A200, Tampa, FL 33605",
    href: "https://www.google.com/maps/search/?api=1&query=1600%20E%208th%20Ave%20A200%2C%20Tampa%2C%20FL%2033605",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    border: "border-violet-100",
  },
];

const TOPICS = [
  "General inquiry",
  "Sales & pricing",
  "Technical support",
  "Billing",
  "Partnership",
  "Other",
];

export default function ContactPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative pb-16 pt-20 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 h-80 w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-2xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Contact
          </p>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Let's talk
          </h1>
          <p className="text-lg text-muted-foreground">
            Whether you have a question, need support, or want to share feedback
            - email us at app@orgaflow.dev.
          </p>
        </div>
      </section>

      {/* Contact info cards */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {CONTACT_ITEMS.map(
            ({ Icon, label, value, href, iconColor, iconBg, border }) => (
              <a
                key={label}
                href={href}
                className={`group flex flex-col gap-3 rounded-2xl border ${border} bg-background p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {value}
                  </p>
                </div>
              </a>
            ),
          )}
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                Send us a message
              </h2>
              <p className="mb-8 text-sm text-muted-foreground">
                We read every message and reply as soon as we can.
              </p>

              <form className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>First name</Label>
                    <Input placeholder="John" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Last name</Label>
                    <Input placeholder="Doe" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Work email</Label>
                  <Input type="email" placeholder="john@company.com" />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Topic</Label>
                  <select className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/20">
                    <option value="">Select a topic</option>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full shadow-md shadow-primary/20"
                >
                  Send message
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By sending this form you agree to our Privacy Policy.
                </p>
              </form>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            {/* What to expect */}
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-foreground">
                What to expect
              </h3>
              <ul className="flex flex-col gap-4">
                {[
                  {
                    title: "Founder-led support",
                    desc: "You'll hear back from the person building Orgaflow.",
                  },
                  {
                    title: "Email-first",
                    desc: "We don't offer phone support right now - email is the best way to reach us.",
                  },
                  {
                    title: "Feedback welcome",
                    desc: "Bug reports and feature requests help us improve faster.",
                  },
                ].map(({ title, desc }) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {title}
                      </p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

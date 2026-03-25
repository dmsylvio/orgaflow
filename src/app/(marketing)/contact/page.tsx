import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Orgaflow team. We'd love to hear from you.",
  alternates: { canonical: "/contact" },
};

const CONTACT_ITEMS = [
  {
    Icon: Mail,
    label: "Email",
    value: "hello@orgaflow.io",
    href: "mailto:hello@orgaflow.io",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    Icon: Phone,
    label: "Phone",
    value: "+1 (888) 555-0100",
    href: "tel:+18885550100",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    Icon: MapPin,
    label: "Address",
    value: "San Francisco, CA · Remote-first",
    href: "#",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    Icon: MessageSquare,
    label: "Live chat",
    value: "Available Mon–Fri, 9–6 PT",
    href: "#",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    border: "border-amber-100",
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
            Whether you have a question, need support, or want to explore a
            custom plan — our team is here to help.
          </p>
        </div>
      </section>

      {/* Contact info cards */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_ITEMS.map(({ Icon, label, value, href, iconColor, iconBg, border }) => (
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
          ))}
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
                We typically reply within a few hours on business days.
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

                <Button type="submit" size="lg" className="w-full shadow-md shadow-primary/20">
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
                    title: "Fast response",
                    desc: "We reply to all messages within 4 business hours.",
                  },
                  {
                    title: "No gatekeeping",
                    desc: "You'll talk to a real person, not a bot.",
                  },
                  {
                    title: "Expert help",
                    desc: "Our team knows the product inside out.",
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

            {/* Office hours */}
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-foreground">
                Office hours
              </h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { day: "Monday – Friday", time: "9:00 AM – 6:00 PM PT" },
                  { day: "Saturday", time: "10:00 AM – 2:00 PM PT" },
                  { day: "Sunday", time: "Closed" },
                ].map(({ day, time }) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{day}</span>
                    <span className="font-medium text-foreground">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="mb-2 font-semibold text-foreground">
                Enterprise sales
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Looking for a custom plan or volume pricing? Our enterprise team
                can build a solution tailored to your needs.
              </p>
              <a
                href="mailto:enterprise@orgaflow.io"
                className="text-sm font-medium text-primary hover:underline"
              >
                enterprise@orgaflow.io →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

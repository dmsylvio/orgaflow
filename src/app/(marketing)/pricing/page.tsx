import type { Metadata } from "next";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Orgaflow Pricing | Plans for growing teams",
  description:
    "Compare Orgaflow pricing plans for teams managing invoices, estimates, payments, and multi-entity operations.",
  openGraph: {
    title: "Orgaflow Pricing | Plans for growing teams",
    description:
      "Start free, then scale with plans built for teams managing billing and operations.",
    type: "website",
  },
};

export default function Page() {
  return <PricingClient />;
}

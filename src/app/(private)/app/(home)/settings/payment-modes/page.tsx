import type { Metadata } from "next";
import PaymentModesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Payment modes",
  description: "Manage payment modes available on invoices and documents.",
};

export default function PaymentModesPage() {
  return <PaymentModesClientPage />;
}


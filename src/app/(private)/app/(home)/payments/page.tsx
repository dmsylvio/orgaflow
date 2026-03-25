import type { Metadata } from "next";
import PaymentsClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Payments",
  description: "Track payments and payment status across your documents.",
};

export default function PaymentsPage() {
  return <PaymentsClientPage />;
}


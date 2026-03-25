import type { Metadata } from "next";
import InvoicesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Create, send, and track invoices.",
};

export default function InvoicesPage() {
  return <InvoicesClientPage />;
}


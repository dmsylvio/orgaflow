import type { Metadata } from "next";
import InvoiceClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Invoice",
};

export default function InvoicePage() {
  return <InvoiceClientPage />;
}


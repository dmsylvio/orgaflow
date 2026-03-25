import type { Metadata } from "next";
import TaxTypesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Tax types",
  description: "Manage tax types used on invoices and estimates.",
};

export default function TaxTypesPage() {
  return <TaxTypesClientPage />;
}


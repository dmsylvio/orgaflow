import type { Metadata } from "next";
import { PageShell } from "../invoice-ui";
import { CreateInvoiceForm } from "./create-form";

export const metadata: Metadata = {
  title: "Create invoice",
  description: "Build a new invoice using your customer and item catalogs.",
};

export default function CreateInvoicePage() {
  return (
    <PageShell
      title="Create Invoice"
      description="Build a new invoice using your customer and item catalogs."
    >
      <CreateInvoiceForm />
    </PageShell>
  );
}

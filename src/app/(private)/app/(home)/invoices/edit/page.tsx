import type { Metadata } from "next";
import { PageShell } from "../invoice-ui";
import { EditInvoiceForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Edit invoice",
  description: "Update invoice details and line items.",
};

export default function EditInvoicePage() {
  return (
    <PageShell
      title="Edit Invoice"
      description="Update invoice details and line items on a dedicated page."
    >
      <EditInvoiceForm />
    </PageShell>
  );
}

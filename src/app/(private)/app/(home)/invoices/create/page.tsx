import { PageShell } from "../invoice-ui";
import { CreateInvoiceForm } from "./create-form";

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

import type { Metadata } from "next";
import { CreateRecurringInvoiceForm } from "./create-form";

export const metadata: Metadata = {
  title: "New Recurring Invoice",
};

export default function CreateRecurringInvoicePage() {
  return <CreateRecurringInvoiceForm />;
}

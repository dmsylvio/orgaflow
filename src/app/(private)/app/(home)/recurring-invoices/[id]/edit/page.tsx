import type { Metadata } from "next";
import { EditRecurringInvoiceForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Edit Recurring Invoice",
};

export default async function EditRecurringInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditRecurringInvoiceForm id={id} />;
}

import type { Metadata } from "next";
import RecurringInvoicesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Recurring Invoices",
  description: "Automate invoice generation on a recurring schedule.",
};

export default function RecurringInvoicesPage() {
  return <RecurringInvoicesClientPage />;
}

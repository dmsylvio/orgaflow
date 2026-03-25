import type { Metadata } from "next";
import ExpensesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Expenses",
  description: "Record and organize business expenses.",
};

export default function ExpensesPage() {
  return <ExpensesClientPage />;
}


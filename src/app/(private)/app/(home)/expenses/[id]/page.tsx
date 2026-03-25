import type { Metadata } from "next";
import ExpenseClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Expense",
};

export default function ExpensePage() {
  return <ExpenseClientPage />;
}


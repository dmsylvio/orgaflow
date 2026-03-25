import type { Metadata } from "next";
import ExpenseCategoriesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Expense categories",
  description: "Manage categories to organize expenses.",
};

export default function ExpenseCategoriesPage() {
  return <ExpenseCategoriesClientPage />;
}


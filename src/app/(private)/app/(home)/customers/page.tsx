import type { Metadata } from "next";
import CustomersClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage your customer list and activity.",
};

export default function CustomersPage() {
  return <CustomersClientPage />;
}


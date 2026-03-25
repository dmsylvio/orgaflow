import type { Metadata } from "next";
import ItemsClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Items",
  description: "Manage your products and services in Orgaflow.",
};

export default function ItemsPage() {
  return <ItemsClientPage />;
}


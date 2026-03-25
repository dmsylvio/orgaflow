import type { Metadata } from "next";
import EstimatesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Estimates",
  description: "Create, send, and track estimates.",
};

export default function EstimatesPage() {
  return <EstimatesClientPage />;
}


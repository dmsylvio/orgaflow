import type { Metadata } from "next";
import EstimateClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Estimate",
};

export default function EstimatePage() {
  return <EstimateClientPage />;
}


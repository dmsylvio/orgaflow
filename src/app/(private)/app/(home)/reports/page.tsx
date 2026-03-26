import type { Metadata } from "next";
import { ReportsClientPage } from "./client-page";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportsClientPage />;
}

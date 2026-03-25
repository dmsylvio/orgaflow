import type { Metadata } from "next";
import DangerClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Danger zone",
  description: "High-impact settings for your organization.",
};

export default function DangerPage() {
  return <DangerClientPage />;
}


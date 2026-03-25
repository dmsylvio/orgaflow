import type { Metadata } from "next";
import AutomationsClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Automations",
  description: "Configure workflow automations and triggers.",
};

export default function AutomationsPage() {
  return <AutomationsClientPage />;
}


import type { Metadata } from "next";
import BillingSettingsClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your plan, billing interval, and subscription settings.",
};

export default function BillingSettingsPage() {
  return <BillingSettingsClientPage />;
}


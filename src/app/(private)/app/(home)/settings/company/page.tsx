import type { Metadata } from "next";
import CompanySettingsClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Company",
  description: "Manage your organization profile and branding details.",
};

export default function CompanySettingsPage() {
  return <CompanySettingsClientPage />;
}


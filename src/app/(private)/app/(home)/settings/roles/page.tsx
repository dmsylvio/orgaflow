import type { Metadata } from "next";
import RolesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Roles",
  description: "Manage roles and permissions for your organization.",
};

export default function RolesPage() {
  return <RolesClientPage />;
}


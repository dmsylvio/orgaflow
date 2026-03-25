import type { Metadata } from "next";
import AccountClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your personal account settings.",
};

export default function AccountPage() {
  return <AccountClientPage />;
}


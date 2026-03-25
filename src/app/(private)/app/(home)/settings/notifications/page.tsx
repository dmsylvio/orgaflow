import type { Metadata } from "next";
import NotificationsClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Configure notification preferences and email settings.",
};

export default function NotificationsPage() {
  return <NotificationsClientPage />;
}


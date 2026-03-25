import type { Metadata } from "next";
import PreferencesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Preferences",
  description: "Set your workspace preferences.",
};

export default function PreferencesPage() {
  return <PreferencesClientPage />;
}


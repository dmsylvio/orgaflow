import type { Metadata } from "next";
import { MockAppPage } from "../mock-app-page";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsHomePage() {
  return <MockAppPage title="Settings" />;
}

import { notFound } from "next/navigation";

// All known settings sections have their own directories.
// Any URL that falls through to this catch-all is not a valid section.
export default function SettingsSectionPage() {
  notFound();
}

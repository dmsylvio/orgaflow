import type { Metadata } from "next";
import { MockAppPage } from "../../mock-app-page";

interface SettingsSectionPageProps {
  params: Promise<{ section: string }>;
}

function formatSectionTitle(section: string): string {
  return section
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: SettingsSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  return { title: `Settings: ${formatSectionTitle(section)}` };
}

export default async function SettingsSectionPage({
  params,
}: SettingsSectionPageProps) {
  const { section } = await params;
  return <MockAppPage title={`Settings · ${formatSectionTitle(section)}`} />;
}

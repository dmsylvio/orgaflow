import type { Metadata } from "next";
import { EstimatePublicScreen } from "./public-screen";

export const metadata: Metadata = {
  title: "Estimate",
  description: "View an estimate shared with you on Orgaflow.",
  robots: { index: false, follow: false },
};

interface EstimatePublicPageProps {
  params: Promise<{ token: string }>;
}

export default async function EstimatePublicPage({
  params,
}: EstimatePublicPageProps) {
  const { token } = await params;

  return <EstimatePublicScreen token={token} />;
}

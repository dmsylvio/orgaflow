import type { Metadata } from "next";
import { InvoicePublicScreen } from "./public-screen";

export const metadata: Metadata = {
  title: "Invoice",
  description: "View an invoice shared with you on Orgaflow.",
  robots: { index: false, follow: false },
};

interface InvoicePublicPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvoicePublicPage({
  params,
}: InvoicePublicPageProps) {
  const { token } = await params;

  return <InvoicePublicScreen token={token} />;
}

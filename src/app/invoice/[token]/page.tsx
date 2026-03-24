import { InvoicePublicScreen } from "./public-screen";

interface InvoicePublicPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvoicePublicPage({
  params,
}: InvoicePublicPageProps) {
  const { token } = await params;

  return <InvoicePublicScreen token={token} />;
}

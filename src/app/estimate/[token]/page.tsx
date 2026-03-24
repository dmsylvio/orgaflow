import { EstimatePublicScreen } from "./public-screen";

interface EstimatePublicPageProps {
  params: Promise<{ token: string }>;
}

export default async function EstimatePublicPage({
  params,
}: EstimatePublicPageProps) {
  const { token } = await params;

  return <EstimatePublicScreen token={token} />;
}

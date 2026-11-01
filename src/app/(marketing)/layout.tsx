import { GoogleAnalytics } from "@next/third-parties/google";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { TawkChat } from "@/components/tawk/tawk-chat";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <div className="flex min-h-dvh flex-col bg-background overflow-visible">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <TawkChat />
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </div>
  );
}

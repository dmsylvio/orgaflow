import { GoogleAnalytics } from "@next/third-parties/google";
import { SiteJsonLd } from "@/components/json-ld";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { schibsted } from "@/lib/fonts";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <div
      className={`marketing ${schibsted.variable} flex min-h-dvh flex-col overflow-visible bg-background`}
    >
      <SiteJsonLd />
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </div>
  );
}

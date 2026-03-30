import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { TawkChat } from "@/components/tawk/tawk-chat";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <TawkChat />
    </div>
  );
}

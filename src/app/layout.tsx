import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { getAppBaseUrl } from "@/lib/base-url";
import { poppins } from "@/lib/fonts";
import { TRPCReactProvider } from "@/trpc/client";
import "@/styles/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "Orgaflow",
    template: "%s | Orgaflow",
  },
  description:
    "Estimate and invoice software for small businesses. Send estimates clients approve from a link, then invoice, record payment, and start the work.",
  applicationName: "Orgaflow",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Orgaflow",
    description:
      "Estimate and invoice software for small businesses. Send estimates clients approve from a link, then invoice, record payment, and start the work.",
    siteName: "Orgaflow",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orgaflow",
    description:
      "Estimate and invoice software for small businesses. Send estimates clients approve from a link, then invoice, record payment, and start the work.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <AuthSessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { getAppBaseUrl } from "@/lib/base-url";
import { appFont } from "@/lib/fonts";
import { TRPCReactProvider } from "@/trpc/client";
import "@/styles/styles.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FC" },
    { media: "(prefers-color-scheme: dark)", color: "#070A1A" },
  ],
};

const DESCRIPTION =
  "Estimate, invoice, and job software for small businesses. Clients approve estimates from a link, then you invoice, track payment, and start the work automatically. Free plan.";

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "Orgaflow",
    template: "%s | Orgaflow",
  },
  description: DESCRIPTION,
  applicationName: "Orgaflow",
  keywords: [
    "estimate software",
    "quoting software",
    "invoice software",
    "estimate and invoice app",
    "small business invoicing",
    "job management software",
    "quote to cash",
    "FreshBooks alternative",
    "QuickBooks alternative",
    "Jobber alternative",
  ],
  category: "business",
  creator: "Orgaflow LLC",
  publisher: "Orgaflow LLC",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Orgaflow",
    description: DESCRIPTION,
    siteName: "Orgaflow",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orgaflow",
    description: DESCRIPTION,
    site: "@orgaflowapp",
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
      className={`${appFont.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}

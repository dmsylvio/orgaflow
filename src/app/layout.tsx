import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { getAppBaseUrl } from "@/lib/base-url";
import { poppins } from "@/lib/fonts";
import { TRPCReactProvider } from "@/trpc/client";
import "@/styles/styles.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "Orgaflow",
    template: "%s | Orgaflow",
  },
  description:
    "CRM, estimates, invoices, payments, tasks, and workflow automations for small businesses.",
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
      "CRM, estimates, invoices, payments, tasks, and workflow automations for small businesses.",
    siteName: "Orgaflow",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orgaflow",
    description:
      "CRM, estimates, invoices, payments, tasks, and workflow automations for small businesses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body>
        <AuthSessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}

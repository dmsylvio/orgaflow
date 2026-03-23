import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { poppins } from "@/lib/fonts";
import { TRPCReactProvider } from "@/trpc/client";
import "@/styles/styles.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Orgaflow",
  description: "Multi-tenant SaaS",
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

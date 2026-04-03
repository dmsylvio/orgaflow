import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "App",
  robots: { index: false, follow: false },
};

/**
 * Raiz da área com acesso restrito: todas as rotas em `/app/*`.
 * O segmento `(private)` é apenas agrupamento (não aparece na URL).
 */
export default async function PrivateAppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  return children;
}

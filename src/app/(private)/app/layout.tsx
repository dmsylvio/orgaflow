import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "../../../../auth";

/**
 * Raiz da área com acesso restrito: todas as rotas em `/app/*`.
 * O segmento `(private)` é apenas agrupamento (não aparece na URL).
 */
export default async function PrivateAppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return children;
}

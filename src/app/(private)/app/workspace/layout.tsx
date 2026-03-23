import type { ReactNode } from "react";

/**
 * Shell visual do fluxo workspace (escolher/criar org). A sessão é validada em `(private)/app/layout.tsx`.
 */
export default function WorkspaceShellLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <div className="min-h-dvh bg-muted/40">{children}</div>;
}

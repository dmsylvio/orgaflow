import NextLink from "next/link";
import type { ReactNode } from "react";
import MainLogo from "@/components/logo";
import { WorkspaceUserMenu } from "./workspace-user-menu";

/**
 * Visual shell for the workspace flow (choose or create an organization).
 * The session is validated in `(private)/app/layout.tsx`.
 */
export default function WorkspaceShellLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <NextLink href="/" aria-label="Orgaflow home">
            <MainLogo className="h-auto w-28 fill-foreground" />
          </NextLink>
          <WorkspaceUserMenu />
        </div>
      </header>
      <main className="app-fade-in">{children}</main>
    </div>
  );
}

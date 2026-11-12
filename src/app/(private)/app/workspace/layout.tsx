import NextLink from "next/link";
import type { ReactNode } from "react";
import MainLogo from "@/components/logo";

/**
 * Visual shell for the workspace flow (choose or create an organization).
 * The session is validated in `(private)/app/layout.tsx`.
 */
export default function WorkspaceShellLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Ink band with aurora behind the top of the page */}
      <div
        aria-hidden
        className="absolute inset-x-3 top-3 h-72 overflow-hidden rounded-[1.75rem] bg-[#070A1A]"
      >
        <div className="app-aurora absolute inset-0" />
        <div className="app-grid absolute inset-0" />
      </div>
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-8 pt-9">
        <NextLink href="/" aria-label="Orgaflow home">
          <MainLogo className="h-auto w-28 fill-white" />
        </NextLink>
      </header>
      <div className="relative app-fade-in">{children}</div>
    </div>
  );
}

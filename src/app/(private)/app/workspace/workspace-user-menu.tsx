"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAndRedirect, useSession } from "@/lib/auth-client";

export function WorkspaceUserMenu() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {session.user.email}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => void signOutAndRedirect("/")}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  );
}

"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminUserMenu() {
  const router = useRouter();
  const { data: user } = trpc.me.profile.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const raw = (user?.name ?? user?.email ?? "").replace(/[\s.]/g, "");
  const initials = raw.slice(0, 2).toUpperCase() || "U";

  const handleSignout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9 rounded p-0">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={user?.name ?? user?.email}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/app/settings" className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSignout}
          className="flex items-center gap-2"
        >
          <LogOutIcon className="h-5 w-5 text-muted-foreground" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

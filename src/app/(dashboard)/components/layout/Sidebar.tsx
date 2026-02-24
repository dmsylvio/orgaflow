"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { menuConfig } from "./nav.config";
import { resolveMenu } from "./nav.resolve";

export function Sidebar() {
  const pathname = usePathname();

  // User data in the active org
  const me = trpc.me.profile.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const permsQ = trpc.me.permissions.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const isOwner = !!me.data?.membership?.isOwner;
  const permissions = new Set(permsQ.data ?? []);
  const features = { reports: true };

  const menu = resolveMenu({
    config: menuConfig,
    isOwner,
    permissions,
    features,
  });

  return (
    <div className="hidden w-56 h-screen pb-32 overflow-y-auto bg-white border-r border-gray-200 border-solid xl:w-64 md:fixed md:flex md:flex-col md:inset-y-0 pt-16">
      {menu.main.map((section) => (
        <div key={String(section.group)} className="p-0 m-0 mt-6 list-none">
          {section.items.map((it) => {
            const isActive =
              it.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(`${it.href}/`) || pathname === it.href;

            const Icon = it.icon as LucideIcon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "group flex items-center gap-3 px-6 py-3 text-sm font-medium border-l-4 transition-colors duration-200",
                  isActive
                    ? "border-red-700 bg-gray-100 text-red-700"
                    : "border-transparent text-black hover:bg-gray-50 hover:text-black",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive
                      ? "text-red-700"
                      : "text-gray-400 group-hover:text-black",
                  )}
                />
                {it.name}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { MenuItem } from "./nav.types";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface AdminNavItemProps {
  item: MenuItem;
  pathname: string;
}

export default function AdminNavItem({ item, pathname }: AdminNavItemProps) {
  const isActive =
    item.href === "/app"
      ? pathname === "/app"
      : pathname.startsWith(`${item.href}/`) || pathname === item.href;

  const Icon = item.icon as LucideIcon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 px-6 py-3 text-sm font-medium border-l-4 transition-colors duration-200",
        isActive
          ? "border-black bg-gray-100 text-black"
          : "border-transparent text-black hover:bg-gray-50 hover:text-black",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-black" : "text-gray-400 group-hover:text-black",
        )}
      />
      {item.name}
    </Link>
  );
}

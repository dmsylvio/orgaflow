"use client";

import type { MenuSection } from "@/components/admin/nav/nav.types";
import AdminNavItem from "./admin-nav-item";

interface AdminNavGroupProps {
  section: MenuSection;
  pathname: string;
}

export default function AdminNavGroup({
  section,
  pathname,
}: AdminNavGroupProps) {
  return (
    <div key={String(section.group)} className="p-0 m-0 mt-6 list-none">
      {section.items.map((item) => (
        <AdminNavItem key={item.href} item={item} pathname={pathname} />
      ))}
    </div>
  );
}

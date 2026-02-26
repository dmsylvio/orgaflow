"use client";

import type { MenuSection } from "@/components/admin/nav/nav.types";
import AdminNavGroup from "./admin-nav-group";

interface AdminNavProps {
  sections: MenuSection[];
  pathname: string;
}

export default function AdminNav({ sections, pathname }: AdminNavProps) {
  return (
    <>
      {sections.map((section) => (
        <AdminNavGroup
          key={String(section.group)}
          section={section}
          pathname={pathname}
        />
      ))}
    </>
  );
}

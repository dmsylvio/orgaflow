"use client";

import { menuConfig } from "@/components/admin/nav/nav.config";
import { resolveMenu } from "@/components/admin/nav/nav.resolve";
import { trpc } from "@/lib/trpc/client";
import { usePathname } from "next/navigation";
import AdminNav from "./nav/admin-nav";

export default function AdminSidebar() {
  const pathname = usePathname();

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
      <AdminNav sections={menu.main} pathname={pathname} />
    </div>
  );
}

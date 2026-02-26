"use client";

import type { ReactNode } from "react";
import { trpc } from "@/lib/trpc/client";
import AdminHeader from "./admin-header";
import AdminMain from "./admin-main";
import AdminShellLoading from "./admin-shell-loading";
import AdminSidebar from "./admin-sidebar";

export default function AdminShell({ children }: { children: ReactNode }) {
  const me = trpc.me.profile.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const permsQ = trpc.me.permissions.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const isLoading = me.isLoading || permsQ.isLoading;

  if (isLoading) {
    return <AdminShellLoading />;
  }

  return (
    <div className="h-full">
      <AdminHeader />
      <AdminSidebar />
      <AdminMain>{children}</AdminMain>
    </div>
  );
}

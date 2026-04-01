"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

function hasPermission(
  isOwner: boolean,
  permissions: string[],
  key: string,
): boolean {
  return isOwner || permissions.includes(key);
}

export function useCanViewPrices() {
  const trpc = useTRPC();
  const { data: session, isPending } = useQuery(trpc.iam.session.queryOptions());

  const isOwner = session?.ability.isOwner ?? false;
  const permissions = session?.ability.permissions ?? [];

  return {
    isLoading: isPending,
    invoice: hasPermission(isOwner, permissions, "invoice:view-prices"),
    estimate: hasPermission(isOwner, permissions, "estimate:view-prices"),
    expense: hasPermission(isOwner, permissions, "expense:view-prices"),
    item: hasPermission(isOwner, permissions, "item:view-prices"),
    payment: hasPermission(isOwner, permissions, "payment:view-prices"),
    dashboard: hasPermission(isOwner, permissions, "dashboard:view-prices"),
  };
}

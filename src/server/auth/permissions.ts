import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { organizationMembers, rolePermissions } from "../db/schemas";

const implied_permissions_map: Record<string, string[]> = {
  "customer:view": ["customer:manage"],
  "customer:create": ["customer:manage"],
  "customer:edit": ["customer:manage"],
  "customer:delete": ["customer:manage"],

  "item:view": ["item:manage"],
  "item:create": ["item:manage"],
  "item:edit": ["item:manage"],
  "item:delete": ["item:manage"],

  "estimate:view": ["estimate:manage"],
  "estimate:create": ["estimate:manage"],
  "estimate:edit": ["estimate:manage"],
  "estimate:delete": ["estimate:manage"],
};

type AssertOrgPermissionParams = {
  db: typeof import("@/server/db").db;
  organizationId: string;
  userId: string;
  permission: string;
};

export async function assert_org_permission({
  db,
  organizationId,
  userId,
  permission,
}: AssertOrgPermissionParams) {
  const [membership] = await db
    .select({
      roleId: organizationMembers.roleId,
      isOwner: organizationMembers.isOwner,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization.",
    });
  }

  if (membership.isOwner) {
    return;
  }

  if (!membership.roleId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have a valid role in this organization.",
    });
  }

  const permissions = await db
    .select({
      permission: rolePermissions.permission,
    })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, membership.roleId));

  const granted_permissions = new Set(
    permissions.map((item) => item.permission),
  );

  const acceptable_permissions = [
    permission,
    ...(implied_permissions_map[permission] ?? []),
  ];

  const has_permission = acceptable_permissions.some((item) =>
    granted_permissions.has(item),
  );

  if (!has_permission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }
}

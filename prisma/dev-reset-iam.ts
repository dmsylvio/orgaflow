// prisma/dev-reset-iam.ts (rodar manualmente em dev)
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/server/iam/permissions/catalog";

export async function devResetIAM() {
  // ordem: dependentes → pais
  await prisma.userPermissionOverride.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});

  // reseed permissions
  await prisma.permission.createMany({
    data: PERMISSIONS.map((p) => ({
      key: p.key,
      name: p.name,
      description: p.description,
    })),
    skipDuplicates: true,
  });

  // opcional: seed roles “padrão” por org será feito em outro step (ex: na criação da org)
}

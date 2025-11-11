import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { expandAbilities } from "@/server/iam/ability/expand";
// IMPORTA O CATÁLOGO COMO CÓDIGO (uma fonte da verdade)
import {
  type AbilityKey,
  PERMISSIONS,
} from "../src/server/iam/permissions/catalog";

async function main() {
  // --- (Opcional para DEV) reset IAM inteiro ---
  // await prisma.userPermissionOverride.deleteMany({});
  // await prisma.userRole.deleteMany({});
  // await prisma.rolePermission.deleteMany({});
  // await prisma.role.deleteMany({});
  // await prisma.permission.deleteMany({});

  // 1) Sincroniza PERMISSIONS (fonte: catálogo em código)
  await prisma.permission.createMany({
    data: PERMISSIONS.map((p) => ({
      key: p.key,
      name: p.name,
      description: p.description,
    })),
    skipDuplicates: true,
  });

  // 2) Cria org XYZ
  const org = await prisma.organization.upsert({
    where: { slug: "xyz" },
    create: { name: "XYZ", slug: "xyz" },
    update: {},
  });

  // 3) Cria dois usuários (owner + member)
  const ownerEmail = "owner@xyz.com";
  const memberEmail = "member@xyz.com";
  const passwordHash = await hash("Passw0rd!", 12);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    create: {
      email: ownerEmail,
      name: "Owner XYZ",
      password: passwordHash,
      activeOrgId: org.id, // ativa org no create
    },
    update: { activeOrgId: org.id },
  });

  const member = await prisma.user.upsert({
    where: { email: memberEmail },
    create: {
      email: memberEmail,
      name: "Manager XYZ",
      password: passwordHash,
      activeOrgId: org.id,
    },
    update: { activeOrgId: org.id },
  });

  // 4) Vincula membership (owner e member)
  await prisma.organizationMember.upsert({
    where: { organization_member_unique: { orgId: org.id, userId: owner.id } },
    create: { orgId: org.id, userId: owner.id, isOwner: true },
    update: { isOwner: true },
  });

  await prisma.organizationMember.upsert({
    where: { organization_member_unique: { orgId: org.id, userId: member.id } },
    create: { orgId: org.id, userId: member.id, isOwner: false },
    update: { isOwner: false },
  });

  // 5) Cria role "manager" na org (se não existir)
  const role = await prisma.role.upsert({
    where: { role_org_key_unique: { orgId: org.id, key: "manager" } },
    create: { orgId: org.id, key: "manager", name: "Manager" },
    update: {},
  });

  // 6) Define abilities da role "manager" (usando curingas + expander)
  //    Ajuste livre conforme seu gosto (ex.: adicionar/remover módulos).
  const managerAbilities = expandAbilities([
    "customer:*",
    "item:*",
    "estimate:*",
    "invoice:*",
    "payment:view",
    "expense:view",
    "report:financial:view",
  ]).values();

  const managerKeys = Array.from(managerAbilities) as AbilityKey[];

  // Busca IDs das permissions e evita duplicar vínculos
  const allPerms = await prisma.permission.findMany({
    where: { key: { in: managerKeys } },
    select: { id: true, key: true },
  });

  const existing = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
    select: { permissionId: true },
  });
  const existingSet = new Set(existing.map((e) => e.permissionId));

  const toAttach = allPerms
    .filter((p) => !existingSet.has(p.id))
    .map((p) => ({ roleId: role.id, permissionId: p.id }));

  if (toAttach.length) {
    await prisma.rolePermission.createMany({ data: toAttach });
  }

  // 7) Atribui a role "manager" ao usuário member
  await prisma.userRole.upsert({
    where: {
      user_role_unique: { orgId: org.id, userId: member.id, roleId: role.id },
    },
    create: { orgId: org.id, userId: member.id, roleId: role.id },
    update: {},
  });

  console.log("Seed concluído com sucesso:");
  console.log({
    org: { id: org.id, slug: org.slug, name: org.name },
    owner: { email: owner.email, activeOrgId: owner.activeOrgId },
    member: { email: member.email, activeOrgId: member.activeOrgId },
    role: { id: role.id, key: role.key },
    managerPermissions: managerKeys.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

// IMPORTA O CATÁLOGO COMO CÓDIGO (uma fonte da verdade)
import {
  PERMISSIONS,
  type PermissionKey,
} from "../src/server/iam/permissions/catalog";

async function main() {
  // 1) Sincroniza PERMISSIONS (createMany com skipDuplicates)
  await prisma.permission.createMany({
    data: PERMISSIONS.map((key) => ({
      key,
      name: key, // pode trocar por rótulos melhores depois
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
      activeOrgId: org.id, // Define org ativa no create
    },
    update: {
      // Se usuário já existe, atualiza activeOrgId apenas se for null
      activeOrgId: org.id,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: memberEmail },
    create: {
      email: memberEmail,
      name: "Manager XYZ",
      password: passwordHash,
      activeOrgId: org.id, // Define org ativa no create
    },
    update: {
      // Se usuário já existe, atualiza activeOrgId apenas se for null
      activeOrgId: org.id,
    },
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

  // 6) Anexa TODAS as permissions à role "manager"
  // (pode filtrar por módulo se quiser; aqui vai CRUD de customer/item/invoice/estimate)
  const allPerms = await prisma.permission.findMany({
    where: { key: { in: PERMISSIONS as PermissionKey[] } },
    select: { id: true },
  });

  // Evita duplicar vínculos
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
    totalPermissions: PERMISSIONS.length,
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

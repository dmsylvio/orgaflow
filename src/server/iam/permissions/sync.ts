import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "./catalog";

type DiffResult = {
  toCreate: { key: string; name: string; description?: string }[];
  toRemove: string[];
  toUpdate: { key: string; name?: string; description?: string }[];
};

/**
 * Compara catálogo (código) vs banco.
 */
export async function diffCatalogWithDatabase(): Promise<DiffResult> {
  const db = await prisma.permission.findMany({
    select: { key: true, name: true, description: true },
  });
  const dbMap = new Map(db.map((p) => [p.key, p]));
  const codeKeys = new Set<string>(PERMISSIONS.map((p) => p.key));

  const toCreate = PERMISSIONS.filter((p) => !dbMap.has(p.key)).map((p) => ({
    key: p.key,
    name: p.name,
    description: p.description,
  }));

  const toRemove = db.map((p) => p.key).filter((k) => !codeKeys.has(k));

  // itens que existem nas duas pontas mas mudaram rótulo/descrição
  const toUpdate = PERMISSIONS.filter((p) => {
    const dbp = dbMap.get(p.key);
    return (
      !!dbp &&
      (dbp.name !== p.name ||
        (dbp.description ?? null) !== (p.description ?? null))
    );
  }).map((p) => ({ key: p.key, name: p.name, description: p.description }));

  return { toCreate, toRemove, toUpdate };
}

/**
 * Sincroniza catálogo → banco.
 * - Cria novas permissions
 * - (Opcional) Atualiza name/description das existentes
 * - (Opcional) Remove obsoletas (cuidado com FKs!)
 */
export async function syncPermissionsCatalogToDatabase(opts?: {
  removeObsolete?: boolean;
  updateLabels?: boolean; // <- atualiza name/description
}) {
  const { toCreate, toRemove, toUpdate } = await diffCatalogWithDatabase();

  await prisma.$transaction(async (tx) => {
    if (toCreate.length) {
      await tx.permission.createMany({
        data: toCreate,
        skipDuplicates: true, // segurança extra
      });
    }

    if (opts?.updateLabels && toUpdate.length) {
      // Prisma não tem updateMany por campos diferentes; faça em loop (poucos itens, ok)
      for (const p of toUpdate) {
        await tx.permission.update({
          where: { key: p.key },
          data: { name: p.name, description: p.description },
        });
      }
    }

    if (opts?.removeObsolete && toRemove.length) {
      // cuidado: pode falhar se houver FKs (RolePermission/UserPermissionOverride)
      await tx.permission.deleteMany({ where: { key: { in: toRemove } } });
    }
  });

  return {
    created: toCreate.length,
    updated: opts?.updateLabels ? toUpdate.length : 0,
    removed: opts?.removeObsolete ? toRemove.length : 0,
  };
}

import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "./catalog";

/**
 * Compara catálogo em código vs. banco.
 */
export async function diffCatalogWithDatabase() {
  const db = await prisma.permission.findMany({ select: { key: true } });
  const dbKeys = new Set(db.map((p) => p.key));

  const toCreate = PERMISSIONS.filter((k) => !dbKeys.has(k)).map((k) => ({
    key: k,
    name: k, // opcional: forneça rótulos melhores depois
  }));

  const codeKeys = new Set(PERMISSIONS);
  const toRemove = db.map((p) => p.key).filter((k) => !codeKeys.has(k as any));

  return { toCreate, toRemove };
}

/**
 * Sincroniza catálogo → banco.
 * Por padrão: insere novas, **não** remove as obsoletas (evita quebrar roles antigas).
 */
export async function syncPermissionsCatalogToDatabase(opts?: {
  removeObsolete?: boolean;
}) {
  const { toCreate, toRemove } = await diffCatalogWithDatabase();

  if (toCreate.length) {
    await prisma.permission.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }

  if (opts?.removeObsolete && toRemove.length) {
    await prisma.permission.deleteMany({ where: { key: { in: toRemove } } });
  }

  return {
    created: toCreate.length,
    removed: opts?.removeObsolete ? toRemove.length : 0,
  };
}

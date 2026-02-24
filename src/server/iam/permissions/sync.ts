import { eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
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
  const rows = await db
    .select({
      key: schema.permission.key,
      name: schema.permission.name,
      description: schema.permission.description,
    })
    .from(schema.permission);
  const dbMap = new Map(rows.map((p) => [p.key, p]));
  const codeKeys = new Set<string>(PERMISSIONS.map((p) => p.key));

  const toCreate = PERMISSIONS.filter((p) => !dbMap.has(p.key)).map((p) => ({
    key: p.key,
    name: p.name,
    description: p.description,
  }));

  const toRemove = rows.map((p) => p.key).filter((k) => !codeKeys.has(k));

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

  await db.transaction(async (tx) => {
    if (toCreate.length) {
      await tx
        .insert(schema.permission)
        .values(toCreate)
        .onConflictDoNothing({ target: schema.permission.key });
    }

    if (opts?.updateLabels && toUpdate.length) {
      for (const p of toUpdate) {
        await tx
          .update(schema.permission)
          .set({ name: p.name, description: p.description })
          .where(eq(schema.permission.key, p.key));
      }
    }

    if (opts?.removeObsolete && toRemove.length) {
      await tx
        .delete(schema.permission)
        .where(inArray(schema.permission.key, toRemove));
    }
  });

  return {
    created: toCreate.length,
    updated: opts?.updateLabels ? toUpdate.length : 0,
    removed: opts?.removeObsolete ? toRemove.length : 0,
  };
}

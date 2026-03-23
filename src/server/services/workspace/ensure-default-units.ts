import { inArray, not } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import { units } from "@/server/db/schemas";

const DEFAULT_UNITS = [
  { name: "cm" },
  { name: "dz" },
  { name: "ft" },
  { name: "g" },
  { name: "in" },
  { name: "kg" },
  { name: "km" },
  { name: "lb" },
  { name: "mg" },
  { name: "pc" },
] as const;

/**
 * Ensures the global item unit catalog exists.
 * Missing units are inserted while preserving any custom rows already present.
 */
export async function ensureDefaultUnits(db: DbClient): Promise<void> {
  const defaultNames = DEFAULT_UNITS.map((unit) => unit.name);
  const existing = await db
    .select({ id: units.id, name: units.name })
    .from(units);

  const existingNames = new Set(
    existing.map((unit) => unit.name.trim().toLowerCase()),
  );
  const missingUnits = DEFAULT_UNITS.filter(
    (unit) => !existingNames.has(unit.name.toLowerCase()),
  );

  if (missingUnits.length > 0) {
    await db.insert(units).values(
      missingUnits.map((unit) => ({
        name: unit.name,
      })),
    );
  }

  await db.delete(units).where(not(inArray(units.name, defaultNames)));
}

import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import { taskStages } from "@/server/db/schemas";

export async function ensureDefaultTaskStages(
  db: DbClient,
  organizationId: string,
): Promise<void> {
  const existing = await db
    .select({ id: taskStages.id })
    .from(taskStages)
    .where(eq(taskStages.organizationId, organizationId))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(taskStages).values({
    organizationId,
    name: "To do",
    slug: "to-do",
    position: 0,
    isSystem: true,
    systemKey: "default_entry",
  });
}

import "dotenv/config";
import { db } from "@/server/db";
import { ensureDefaultCurrencies } from "@/server/services/workspace/ensure-default-currencies";
import { ensureDefaultLanguages } from "@/server/services/workspace/ensure-default-languages";
import { ensureDefaultUnits } from "@/server/services/workspace/ensure-default-units";

async function main() {
  await ensureDefaultCurrencies(db);
  await ensureDefaultLanguages(db);
  await ensureDefaultUnits(db);

  console.info("Reference data seeded successfully.");
}

main().catch((error) => {
  console.error("Failed to seed reference data.", error);
  process.exit(1);
});

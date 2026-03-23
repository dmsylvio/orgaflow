import "dotenv/config";
import { db } from "@/server/db";
import { ensureDefaultCurrencies } from "@/server/services/workspace/ensure-default-currencies";
import { ensureDefaultLanguages } from "@/server/services/workspace/ensure-default-languages";

async function main() {
  await ensureDefaultCurrencies(db);
  await ensureDefaultLanguages(db);

  console.info("Reference data seeded successfully.");
}

main().catch((error) => {
  console.error("Failed to seed reference data.", error);
  process.exit(1);
});

/**
 * Sincroniza o catálogo de permissões (código) para o banco de dados.
 * Execute após db:migrate: pnpm db:seed
 */
import "dotenv/config";
import { syncPermissionsCatalogToDatabase } from "../src/server/iam/permissions/sync";

async function main() {
  const result = await syncPermissionsCatalogToDatabase({
    updateLabels: true,
    removeObsolete: false,
  });
  console.log(
    `Permissions sync: ${result.created} created, ${result.updated} updated`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { FileMigrationProvider, Migrator } from "kysely";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsPath = path.resolve(__dirname, "../../db/migrations");

export async function runMigrations(): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: migrationsPath,
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`[Migration] ✓ ${it.migrationName}`);
    } else if (it.status === "Error") {
      console.error(`[Migration] ✗ ${it.migrationName}`);
    }
  });

  if (error) {
    console.error("[Migration] Failed to run migrations", error);
    throw error;
  }

  console.log("[Migration] All migrations completed successfully");
}

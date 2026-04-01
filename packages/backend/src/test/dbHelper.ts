import Database from "better-sqlite3";
import { Kysely, SqliteDialect, Migrator, FileMigrationProvider } from "kysely";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import type { DB } from "../lib/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsPath = path.resolve(__dirname, "../../db/migrations");

export async function createTestDb() {
  const dialect = new SqliteDialect({
    database: new Database(":memory:"),
  });

  const db = new Kysely<DB>({ dialect });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: migrationsPath,
    }),
  });

  const { error } = await migrator.migrateToLatest();
  if (error) throw error;

  return {
    db,
    async cleanup() {
      await db.deleteFrom("summaries").execute();
    },
    async destroy() {
      await db.destroy();
    },
  };
}

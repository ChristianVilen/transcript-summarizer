import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../data.db");

const dialect = new SqliteDialect({
  database: new Database(dbPath),
});

export interface DB {
  summaries: {
    id: number;
    original_text: string;
    summary: string;
    language: string;
    style: string;
    tone: string;
    created_at: string;
  };
}

export const db = new Kysely<DB>({ dialect });

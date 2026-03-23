import { SqliteDialect } from "kysely";
import Database from "better-sqlite3";

export default {
  dialect: new SqliteDialect({
    database: new Database("packages/backend/data.db"),
  }),
  migrations: {
    migrationFolder: "db/migrations",
  },
  seeds: {
    seedFolder: "db/seeds",
  },
};

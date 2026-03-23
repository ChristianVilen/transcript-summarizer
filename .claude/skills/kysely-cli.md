# Kysely CLI (kysely-ctl)

Use this skill when the user asks to create migrations, seed files, run migrations, roll back migrations, seed the database, or interact with the database via SQL using the Kysely CLI.

## Prerequisites

- `kysely-ctl` is installed globally on this machine
- Config file lives at `packages/backend/kysely.config.ts`
- All commands must be run from `packages/backend/` directory
- Migrations are in `packages/backend/db/migrations/`
- Seeds are in `packages/backend/db/seeds/`

## Config file (`packages/backend/kysely.config.ts`)

```ts
import { SqliteDialect } from "kysely";
import Database from "better-sqlite3";

export default {
  dialect: new SqliteDialect({
    database: new Database("data.db"),
  }),
  migrations: {
    migrationFolder: "db/migrations",
  },
  seeds: {
    seedFolder: "db/seeds",
  },
};
```

Note: Do NOT import `defineConfig` from `kysely-ctl` — the global install can't resolve it from the project's node_modules. A plain object export works fine.

## Commands

All commands run from `packages/backend/`.

### Migrations

```bash
# Create a new migration
kysely migrate:make <name>

# Run all pending migrations
kysely migrate:latest

# Run the next pending migration
kysely migrate:up

# Roll back the last migration
kysely migrate:down

# List migrations and their status
kysely migrate:list
```

### Seeds

```bash
# Create a new seed file
kysely seed:make <name>

# Run all seed files
kysely seed:run

# List seed files
kysely seed:list
```

### SQL

```bash
# Run a one-off SQL query
kysely sql "SELECT * FROM items LIMIT 10"

# Interactive SQL mode with JSON output
kysely sql -f json
```

## Migration file format

Migrations export `up` and `down` async functions:

```ts
import { type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("example")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("example").execute();
}
```

## Seed file format

```ts
import { type Kysely } from "kysely";

export async function seed(db: Kysely<unknown>): Promise<void> {
  await db.insertInto("items").values([
    { name: "Example", content: "Hello" },
  ]).execute();
}
```

## After creating/running migrations

1. If the `DB` interface in `packages/backend/src/lib/db.ts` needs updating, update it to match the new schema.
2. The programmatic migrator at `packages/backend/src/migrate.ts` and the CLI `kysely migrate:latest` do the same thing — use either one. The root `pnpm db:migrate` script uses the programmatic migrator.

## Common patterns

- Use `sql` tagged template from kysely for raw SQL in migrations: `import { sql } from "kysely"`
- SQLite stores dates as TEXT — use `datetime('now')` for defaults: `col.defaultTo(sql\`(datetime('now'))\`)`
- SQLite `AUTOINCREMENT` on `INTEGER PRIMARY KEY` prevents row ID reuse after deletion

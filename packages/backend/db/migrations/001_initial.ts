import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("summaries")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("original_text", "text", (col) => col.notNull())
    .addColumn("summary", "text", (col) => col.notNull())
    .addColumn("language", "text", (col) => col.notNull())
    .addColumn("style", "text", (col) => col.notNull().defaultTo("paragraph"))
    .addColumn("tone", "text", (col) => col.notNull().defaultTo("neutral"))
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`)
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("summaries").execute();
}

import { Hono } from "hono";
import { summarize, generateTitle, AIError } from "../lib/ai.js";
import { db } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { summarizeRequestSchema, idParamSchema } from "../lib/schemas.js";
import type { SummarizeResponse, SummaryListItem, SummaryDetail } from "@gosta-assignemnt/shared";

export const aiRoute = new Hono();

// Password protection middleware for AI endpoints
aiRoute.use("/*", async (c, next) => {
  if (process.env.NODE_ENV !== "production") {
    await next();
    return;
  }

  const password = process.env.AI_PASSWORD;
  if (!password) {
    return c.json({ error: "AI service not configured" }, 503);
  }

  const providedPassword = c.req.header("X-AI-Password");
  if (providedPassword !== password) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

aiRoute.post("/summarize", async (c) => {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON in request body" }, 400);
  }

  const parsed = summarizeRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }
  const { text, language, style, tone } = parsed.data;

  let summary: string;
  try {
    summary = await summarize({ text, language, style, tone });
  } catch (err) {
    if (err instanceof AIError) {
      return c.json({ error: err.message }, err.httpStatus as 400 | 429 | 502 | 503);
    }
    throw err;
  }

  const row = await db
    .insertInto("summaries")
    .values({
      original_text: text,
      summary,
      language,
      style,
      tone,
      title: null,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  // Generate title in the background
  generateTitle(summary, language)
    .then((title) => db.updateTable("summaries").set({ title }).where("id", "=", row.id).execute())
    .catch((err) =>
      logger.error("title generation failed", {
        summaryId: row.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );

  const result: SummarizeResponse = { id: row.id, summary };
  return c.json(result);
});

aiRoute.get("/summaries", async (c) => {
  const rows = await db
    .selectFrom("summaries")
    .select(["id", "title", "language", "tone", "style", "created_at"])
    .orderBy("created_at", "desc")
    .execute();

  return c.json(rows satisfies SummaryListItem[]);
});

aiRoute.get("/summaries/:id", async (c) => {
  const parsed = idParamSchema.safeParse(c.req.param());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }
  const { id } = parsed.data;
  const row = await db.selectFrom("summaries").selectAll().where("id", "=", id).executeTakeFirst();

  if (!row) return c.json({ error: "Not found" }, 404);

  const { id: rowId, title, language, tone, style, created_at, original_text, summary } = row;
  return c.json({
    id: rowId,
    title,
    language,
    tone,
    style,
    created_at,
    original_text,
    summary,
  } satisfies SummaryDetail);
});

aiRoute.delete("/summaries/:id", async (c) => {
  const parsed = idParamSchema.safeParse(c.req.param());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }
  const { id } = parsed.data;
  const result = await db.deleteFrom("summaries").where("id", "=", id).executeTakeFirst();
  if (!result.numDeletedRows) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

import { Hono } from "hono";
import { summarize, generateTitle } from "../lib/ai.js";
import { db } from "../lib/db.js";
import type {
  SummarizeRequest,
  SummarizeResponse,
  SummaryListItem,
  SummaryDetail,
} from "@gosta-assignemnt/shared";

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
  const body = await c.req.json<SummarizeRequest>();
  const { text, language, style = "paragraph", tone = "neutral" } = body;

  const summary = await summarize({ text, language, style, tone });

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

  // Generate title in the background — don't await
  generateTitle(summary, language)
    .then((title) => db.updateTable("summaries").set({ title }).where("id", "=", row.id).execute())
    .catch(console.error);

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
  const id = Number(c.req.param("id"));
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
  const id = Number(c.req.param("id"));
  const result = await db.deleteFrom("summaries").where("id", "=", id).executeTakeFirst();
  if (!result.numDeletedRows) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

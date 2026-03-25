import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { summarizeStream, generateTitle } from "../lib/ai.js";
import { AIError } from "../lib/error.js";
import { db } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { titleEvents } from "../lib/titleEvents.js";
import { summarizeRequestSchema, idParamSchema } from "../lib/schemas.js";
import { config } from "../lib/config.js";
import type { SummaryListItem, SummaryDetail } from "@gosta-assignemnt/shared";

export const aiRoute = new Hono();

aiRoute.use("/*", async (c, next) => {
  if (!config.ai.password) {
    await next();
    return;
  }

  const providedPassword = c.req.header("X-AI-Password");
  if (providedPassword !== config.ai.password) {
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

  return streamSSE(c, async (stream) => {
    let fullText = "";

    try {
      fullText = await summarizeStream({ text, language, style, tone }, async (chunk) => {
        await stream.writeSSE({ data: JSON.stringify({ type: "chunk", text: chunk }) });
      });
    } catch (err) {
      if (err instanceof AIError) {
        await stream.writeSSE({ data: JSON.stringify({ type: "error", message: err.message }) });
        return;
      }
      throw err;
    }

    const row = await db
      .insertInto("summaries")
      .values({ original_text: text, summary: fullText, language, style, tone, title: null })
      .returning("id")
      .executeTakeFirstOrThrow();

    generateTitle(fullText, language)
      .then((title) =>
        db
          .updateTable("summaries")
          .set({ title })
          .where("id", "=", row.id)
          .execute()
          .then(() => titleEvents.emit(`title:${row.id}`, title)),
      )
      .catch((err) =>
        logger.error("title generation failed", {
          summaryId: row.id,
          error: err instanceof Error ? err.message : String(err),
        }),
      );

    await stream.writeSSE({ data: JSON.stringify({ type: "done", id: row.id }) });
  });
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

aiRoute.get("/summaries/:id/title-stream", async (c) => {
  const parsed = idParamSchema.safeParse(c.req.param());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }
  const { id } = parsed.data;

  const row = await db
    .selectFrom("summaries")
    .select("title")
    .where("id", "=", id)
    .executeTakeFirst();
  if (!row) return c.json({ error: "Not found" }, 404);

  return streamSSE(c, async (stream) => {
    // Register listener before checking DB to avoid race condition where
    // title is generated between the check and the listener registration.
    const titlePromise = new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        titleEvents.removeListener(`title:${id}`, handler);
        resolve(null);
      }, 35000);

      function handler(title: string) {
        clearTimeout(timeout);
        resolve(title);
      }

      titleEvents.once(`title:${id}`, handler);

      stream.onAbort(() => {
        clearTimeout(timeout);
        titleEvents.removeListener(`title:${id}`, handler);
        resolve(null);
      });
    });

    // Check DB after listener is registered
    const fresh = await db
      .selectFrom("summaries")
      .select("title")
      .where("id", "=", id)
      .executeTakeFirst();

    if (fresh?.title) {
      titleEvents.removeAllListeners(`title:${id}`);
      await stream.writeSSE({ data: JSON.stringify({ title: fresh.title }) });
      return;
    }

    const title = await titlePromise;
    if (title) {
      await stream.writeSSE({ data: JSON.stringify({ title }) });
    }
  });
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

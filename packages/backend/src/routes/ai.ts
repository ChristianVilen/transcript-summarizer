import { Hono } from "hono";
import { summarize } from "../lib/ai.js";
import type { SummarizeRequest, SummarizeResponse } from "@gosta-assignemnt/shared";

export const aiRoute = new Hono();

aiRoute.post("/summarize", async (c) => {
  const body = await c.req.json<SummarizeRequest>();
  const { text, language, style, tone } = body;

  const summary = await summarize({ text, language, style, tone });

  const result: SummarizeResponse = { summary };
  return c.json(result);
});

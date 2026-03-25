import { Hono } from "hono";
import { sql } from "kysely";
import { db } from "../lib/db.js";
import { config } from "../lib/config.js";
import type { HealthResponse } from "@gosta-assignemnt/shared";

export const healthRoute = new Hono();

healthRoute.get("/", async (c) => {
  let dbOk = false;
  try {
    await sql`SELECT 1`.execute(db);
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const res: HealthResponse = {
    status: dbOk ? "ok" : "error",
    timestamp: new Date().toISOString(),
    db: dbOk,
    passwordRequired: config.ai.provider === "anthropic",
  };
  return c.json(res);
});

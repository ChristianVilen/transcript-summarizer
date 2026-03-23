import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use("/*", logger());
app.use("/*", cors());

app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.path}:`, err.message);
  const status = err instanceof Error && "status" in err ? (err as any).status : 500;
  return c.json({ error: err.message || "Internal server error", status }, status);
});

export default app;

const port = 3001;
console.log(`Backend running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

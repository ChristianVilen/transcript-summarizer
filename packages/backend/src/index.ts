import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoute } from "./routes/health.js";
import { aiRoute } from "./routes/ai.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");

const app = new Hono();

app.use("/*", logger());
app.use("/*", cors());

app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.path}:`, err.message);
  const status = err instanceof Error && "status" in err ? (err as any).status : 500;
  return c.json({ error: err.message || "Internal server error", status }, status);
});

app.use("/*", serveStatic({ root: publicDir, index: "index.html" }));

app.route("/api/health", healthRoute);
app.route("/api/ai", aiRoute);

export default app;

const port = Number(process.env.PORT || 3001);
console.log(`Backend running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

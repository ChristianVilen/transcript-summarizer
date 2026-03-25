import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoute } from "./routes/health.js";
import { aiRoute } from "./routes/ai.js";
import { runMigrations } from "./lib/migrate.js";
import { logger } from "./lib/logger.js";
import { config } from "./lib/config.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");

const app = new Hono();

app.use("/*", cors());

app.use("/*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.info("request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: Date.now() - start,
  });
});

app.onError((err, c) => {
  const status =
    "status" in err && typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  if (status >= 500) {
    logger.error("unhandled error", {
      method: c.req.method,
      path: c.req.path,
      status,
      error: err.message,
      stack: err.stack,
    });
    return c.json({ error: "Internal server error" }, 500);
  }

  logger.warn("http error", { method: c.req.method, path: c.req.path, status, error: err.message });
  return c.json({ error: err.message }, status as 400 | 401 | 403 | 404);
});

app.use("/*", serveStatic({ root: publicDir, index: "index.html" }));

app.route("/api/health", healthRoute);
app.route("/api/ai", aiRoute);

export default app;

const { port } = config;

async function start() {
  try {
    await runMigrations();
    logger.info("backend started", { port });
    serve({ fetch: app.fetch, port });
  } catch (err) {
    logger.error("failed to start backend", {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

start();

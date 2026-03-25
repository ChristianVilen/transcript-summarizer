import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";

vi.mock("../../lib/config.js", () => ({
  config: { ai: { provider: "lm-studio", password: null } },
}));

// mock sqlite db to prevent filesystem side effects.
vi.mock("../../lib/db.js", () => ({ db: {} }));

import { healthRoute } from "../health.js";

const app = new Hono();
app.route("/api/health", healthRoute);

describe("GET /api/health", () => {
  it("returns status, timestamp, db, and passwordRequired fields", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("db");
    expect(body).toHaveProperty("passwordRequired");
  });
});

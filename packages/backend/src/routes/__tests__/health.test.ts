import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { Hono } from "hono";
import { createTestDb } from "../../test/dbHelper.js";

vi.mock("../../lib/config.js", () => ({
  config: { ai: { provider: "lm-studio", password: null } },
}));

const dbRef = vi.hoisted(() => ({ current: null as any }));

vi.mock("../../lib/db.js", () => ({
  get db() {
    return dbRef.current;
  },
}));

let destroy: () => Promise<void>;

beforeAll(async () => {
  const testDb = await createTestDb();
  dbRef.current = testDb.db;
  destroy = testDb.destroy;
});

afterAll(async () => {
  await destroy();
});

import { healthRoute } from "../health.js";

const app = new Hono();
app.route("/api/health", healthRoute);

describe("GET /api/health", () => {
  it("returns status ok with db: true", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe(true);
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("passwordRequired");
  });
});

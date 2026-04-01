import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { Hono } from "hono";
import { createTestDb } from "../../test/dbHelper.js";

vi.mock("../../lib/config.js", () => ({
  config: { ai: { provider: "anthropic", password: null } },
}));

// Re-implement AIError inline so instanceof checks in the route still work
vi.mock("../../lib/ai.js", () => ({
  summarizeStream: vi.fn(),
  generateTitle: vi.fn().mockResolvedValue("Generated Title"),
  AIError: class AIError extends Error {
    constructor(
      message: string,
      public readonly code: string,
      public readonly httpStatus: number,
    ) {
      super(message);
      this.name = "AIError";
    }
  },
}));

const dbRef = vi.hoisted(() => ({ current: null as any }));

vi.mock("../../lib/db.js", () => ({
  get db() {
    return dbRef.current;
  },
}));

vi.mock("../../lib/titleEvents.js", () => ({
  titleEvents: { once: vi.fn(), emit: vi.fn(), removeListener: vi.fn() },
}));

import { aiRoute } from "../ai.js";
import { summarizeStream, generateTitle } from "../../lib/ai.js";
import { AIError } from "../../lib/error.js";

// Build a minimal app from the route module directly
const app = new Hono();
app.route("/api/ai", aiRoute);

let cleanup: () => Promise<void>;
let destroy: () => Promise<void>;

beforeAll(async () => {
  const testDb = await createTestDb();
  dbRef.current = testDb.db;
  cleanup = testDb.cleanup;
  destroy = testDb.destroy;
});

afterAll(async () => {
  await destroy();
});

beforeEach(async () => {
  vi.resetAllMocks();
  await cleanup();
  vi.mocked(generateTitle).mockResolvedValue("Generated Title");
  vi.mocked(summarizeStream as ReturnType<typeof vi.fn>).mockResolvedValue("");
});

async function parseSSE(res: Response) {
  return (await res.text())
    .split("\n")
    .filter((l) => l.startsWith("data: "))
    .map((l) => JSON.parse(l.slice(6)));
}

describe("POST /api/ai/summarize", () => {
  it("returns 400 when the 'text' field is missing", async () => {
    const res = await app.request("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "English" }),
    });
    expect(res.status).toBe(400);
  });

  it("streams chunk and done events on success", async () => {
    vi.mocked(summarizeStream).mockImplementation(async (_params, onChunk) => {
      await onChunk("Hello ");
      await onChunk("world");
      return "Hello world";
    });

    const res = await app.request("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Patient discussed symptoms.", language: "English" }),
    });

    const events = await parseSSE(res);
    expect(events).toContainEqual({ type: "chunk", text: "Hello " });
    expect(events).toContainEqual({ type: "chunk", text: "world" });
    expect(events).toContainEqual(expect.objectContaining({ type: "done", id: expect.any(Number) }));
  });

  it("streams an error event when summarizeStream throws AIError", async () => {
    vi.mocked(summarizeStream).mockRejectedValue(
      new AIError("AI rate limit exceeded, please try again later", "rate_limit", 429),
    );

    const res = await app.request("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Patient discussed symptoms.", language: "English" }),
    });

    const events = await parseSSE(res);
    expect(events).toContainEqual({
      type: "error",
      message: "AI rate limit exceeded, please try again later",
    });
  });
});

describe("GET /api/ai/summaries/:id", () => {
  it("returns 200 with the full summary detail", async () => {
    const row = await dbRef.current
      .insertInto("summaries")
      .values({
        original_text: "Transcript text",
        summary: "Patient is stable.",
        language: "English",
        style: "paragraph",
        tone: "neutral",
        title: "Follow-up visit",
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    const res = await app.request(`/api/ai/summaries/${row.id}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: row.id, summary: "Patient is stable." });
  });

  it("returns 404 when the summary does not exist", async () => {
    const res = await app.request("/api/ai/summaries/99");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/ai/summaries/:id", () => {
  it("returns 200 { ok: true } when the summary is deleted", async () => {
    const row = await dbRef.current
      .insertInto("summaries")
      .values({
        original_text: "Text",
        summary: "Summary",
        language: "English",
        style: "paragraph",
        tone: "neutral",
        title: null,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    const res = await app.request(`/api/ai/summaries/${row.id}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

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

// vi.hoisted ensures mockDb is defined before vi.mock factories run (which are hoisted to top)
const mockDb = vi.hoisted(() => ({
  insertInto: vi.fn(),
  updateTable: vi.fn(),
  selectFrom: vi.fn(),
  deleteFrom: vi.fn(),
  values: vi.fn(),
  set: vi.fn(),
  select: vi.fn(),
  selectAll: vi.fn(),
  where: vi.fn(),
  returning: vi.fn(),
  orderBy: vi.fn(),
  execute: vi.fn(),
  executeTakeFirst: vi.fn(),
  executeTakeFirstOrThrow: vi.fn(),
}));

// Kysely chain mock: each builder method returns the same object so the
// fluent chain resolves to the terminal mock (execute / executeTakeFirst).
vi.mock("../../lib/db.js", () => ({ db: mockDb }));

vi.mock("../../lib/titleEvents.js", () => ({
  titleEvents: { once: vi.fn(), emit: vi.fn(), removeListener: vi.fn() },
}));

import { aiRoute } from "../ai.js";
import { summarizeStream, generateTitle, AIError } from "../../lib/ai.js";

// Build a minimal app from the route module directly
const app = new Hono();
app.route("/api/ai", aiRoute);

const CHAIN_METHODS = [
  "insertInto",
  "updateTable",
  "selectFrom",
  "deleteFrom",
  "values",
  "set",
  "select",
  "selectAll",
  "where",
  "returning",
  "orderBy",
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  // Restore fluent chaining after resetAllMocks clears all implementations
  for (const method of CHAIN_METHODS) {
    vi.mocked(mockDb[method]).mockReturnValue(mockDb);
  }
  // Restore defaults for terminal mocks so fire-and-forget chains don't throw
  mockDb.execute.mockResolvedValue([]);
  mockDb.executeTakeFirst.mockResolvedValue(undefined);
  mockDb.executeTakeFirstOrThrow.mockResolvedValue(undefined);
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
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ id: 42 });

    const res = await app.request("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Patient discussed symptoms.", language: "English" }),
    });

    const events = await parseSSE(res);
    expect(events).toContainEqual({ type: "chunk", text: "Hello " });
    expect(events).toContainEqual({ type: "chunk", text: "world" });
    expect(events).toContainEqual({ type: "done", id: 42 });
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
    const fakeSummary = {
      id: 1,
      title: "Follow-up visit",
      language: "English",
      tone: "neutral",
      style: "paragraph",
      created_at: "2026-01-01T00:00:00.000Z",
      original_text: "Transcript text",
      summary: "Patient is stable.",
    };
    mockDb.executeTakeFirst.mockResolvedValue(fakeSummary);

    const res = await app.request("/api/ai/summaries/1");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 1, summary: "Patient is stable." });
  });

  it("returns 404 when the summary does not exist", async () => {
    mockDb.executeTakeFirst.mockResolvedValue(undefined);
    const res = await app.request("/api/ai/summaries/99");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/ai/summaries/:id", () => {
  it("returns 200 { ok: true } when the summary is deleted", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ numDeletedRows: 1n });

    const res = await app.request("/api/ai/summaries/1", { method: "DELETE" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

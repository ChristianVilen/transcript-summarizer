import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../../index.js";

vi.mock("../../lib/ai.js", () => ({
  summarize: vi.fn().mockResolvedValue("Mocked summary text."),
}));

describe("POST /api/ai/summarize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a summary for valid input", async () => {
    const res = await app.request("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Patient discussed symptoms.", language: "English" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("summary", "Mocked summary text.");
  });

  it("forwards style and tone to the summarize function", async () => {
    const { summarize } = await import("../../lib/ai.js");

    await app.request("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Patient discussed symptoms.",
        language: "Finnish",
        style: "bullets",
        tone: "formal",
      }),
    });

    expect(summarize).toHaveBeenCalledWith({
      text: "Patient discussed symptoms.",
      language: "Finnish",
      style: "bullets",
      tone: "formal",
    });
  });
});

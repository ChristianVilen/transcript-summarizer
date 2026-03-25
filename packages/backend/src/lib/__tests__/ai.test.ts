import { describe, it, expect, vi, beforeEach } from "vitest";
import Anthropic from "@anthropic-ai/sdk";

vi.mock("../providers/index.js", () => ({
  provider: {
    complete: vi.fn(),
    stream: vi.fn(),
  },
}));

vi.mock("../config.js", () => ({
  config: { ai: { provider: "anthropic" } },
}));

import { provider } from "../providers/index.js";
import { summarize, summarizeStream, generateTitle, AIError } from "../ai.js";

const mockComplete = vi.mocked(provider.complete);
const mockStream = vi.mocked(provider.stream);

describe("lib/ai.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("summarize()", () => {
    it("returns the text from provider.complete", async () => {
      mockComplete.mockResolvedValue("Patient presented with chest pain.");
      const result = await summarize({ text: "Input text", language: "English" });
      expect(result).toBe("Patient presented with chest pain.");
    });

    it("classifies Anthropic.RateLimitError as rate_limit/429", async () => {
      mockComplete.mockRejectedValue(
        new Anthropic.RateLimitError(429, {}, "rate limit exceeded", new Headers()),
      );
      await expect(summarize({ text: "Input", language: "English" })).rejects.toMatchObject({
        name: "AIError",
        code: "rate_limit",
        httpStatus: 429,
      });
    });

    it("classifies Anthropic.APIConnectionError as unavailable/503", async () => {
      mockComplete.mockRejectedValue(
        new Anthropic.APIConnectionError({ message: "connection refused" }),
      );
      await expect(summarize({ text: "Input", language: "English" })).rejects.toMatchObject({
        name: "AIError",
        code: "unavailable",
        httpStatus: 503,
      });
    });

    it("re-throws non-SDK errors unchanged", async () => {
      const unexpected = new TypeError("something went very wrong");
      mockComplete.mockRejectedValue(unexpected);
      await expect(summarize({ text: "Input", language: "English" })).rejects.toThrow(unexpected);
    });
  });

  describe("summarizeStream()", () => {
    it("delivers each chunk via onChunk and returns the full accumulated text", async () => {
      mockStream.mockImplementation(async (_sys, _user, _max, onChunk) => {
        await onChunk("Patient ");
        await onChunk("is stable.");
        return "Patient is stable.";
      });

      const received: string[] = [];
      const result = await summarizeStream({ text: "Input", language: "English" }, (chunk) => {
        received.push(chunk);
      });

      expect(received).toEqual(["Patient ", "is stable."]);
      expect(result).toBe("Patient is stable.");
    });
  });

  describe("generateTitle()", () => {
    it("returns 'Untitled' when provider returns an empty or whitespace-only string", async () => {
      mockComplete.mockResolvedValue("   ");
      const title = await generateTitle("Some summary text", "English");
      expect(title).toBe("Untitled");
    });
  });
});

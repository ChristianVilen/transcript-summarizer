import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: "rate_limit" | "auth" | "unavailable" | "unknown",
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "AIError";
  }
}
// Maps SDK-specific errors to AIError. Re-throws anything that isn't an AI SDK error.
export function classifyError(err: unknown): {
  classified: AIError;
  cause?: { status?: number; message?: string };
} {
  if (err instanceof Anthropic.RateLimitError || err instanceof OpenAI.RateLimitError) {
    return {
      classified: new AIError("AI rate limit exceeded, please try again later", "rate_limit", 429),
    };
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof OpenAI.AuthenticationError) {
    return { classified: new AIError("AI service is not properly configured", "auth", 503) };
  }
  if (err instanceof Anthropic.APIConnectionError || err instanceof OpenAI.APIConnectionError) {
    return { classified: new AIError("AI service is currently unavailable", "unavailable", 503) };
  }
  if (err instanceof Anthropic.APIError || err instanceof OpenAI.APIError) {
    return {
      classified: new AIError("AI service returned an unexpected error", "unknown", 502),
      cause: { status: err.status, message: err.message },
    };
  }
  throw err;
}

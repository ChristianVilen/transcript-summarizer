import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { SummarizeRequest, Tone } from "@gosta-assignemnt/shared";
import { logger } from "./logger.js";
import { config } from "./config.js";
import { provider } from "./providers/index.js";

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
function classifyError(err: unknown): AIError {
  if (err instanceof Anthropic.RateLimitError || err instanceof OpenAI.RateLimitError) {
    return new AIError("AI rate limit exceeded, please try again later", "rate_limit", 429);
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof OpenAI.AuthenticationError) {
    return new AIError("AI service is not properly configured", "auth", 503);
  }
  if (err instanceof Anthropic.APIConnectionError || err instanceof OpenAI.APIConnectionError) {
    return new AIError("AI service is currently unavailable", "unavailable", 503);
  }
  if (err instanceof Anthropic.APIError || err instanceof OpenAI.APIError) {
    return new AIError("AI service returned an unexpected error", "unknown", 502);
  }
  throw err;
}

export async function summarize({
  text,
  language,
  style = "paragraph",
  tone = "neutral",
}: SummarizeRequest): Promise<string> {
  const { system, user } = buildMessages({ text, language, style, tone });
  const start = Date.now();
  logger.info("ai.summarize started", {
    provider: config.ai.provider,
    language,
    style,
    tone,
    textLength: text.length,
  });

  try {
    const result = await provider.complete(system, user, 1024);

    if (!result) {
      throw new AIError("AI returned an empty response", "unknown", 502);
    }

    logger.info("ai.summarize completed", {
      provider: config.ai.provider,
      duration: Date.now() - start,
    });
    return result;
  } catch (err) {
    if (err instanceof AIError) {
      logger.warn("ai.summarize failed", { code: err.code, duration: Date.now() - start });
      throw err;
    }
    const classified = classifyError(err);
    logger.warn("ai.summarize failed", {
      code: classified.code,
      error: classified.message,
      duration: Date.now() - start,
    });
    throw classified;
  }
}

export async function summarizeStream(
  params: SummarizeRequest,
  onChunk: (text: string) => Promise<void> | void,
): Promise<string> {
  const { system, user } = buildMessages(params);
  const start = Date.now();
  logger.info("ai.summarizeStream started", {
    provider: config.ai.provider,
    language: params.language,
    style: params.style,
    tone: params.tone,
  });

  try {
    const result = await provider.stream(system, user, 1024, onChunk);

    if (!result) {
      throw new AIError("AI returned an empty response", "unknown", 502);
    }

    logger.info("ai.summarizeStream completed", {
      provider: config.ai.provider,
      duration: Date.now() - start,
    });
    return result;
  } catch (err) {
    if (err instanceof AIError) {
      logger.warn("ai.summarizeStream failed", { code: err.code, duration: Date.now() - start });
      throw err;
    }
    const classified = classifyError(err);
    logger.warn("ai.summarizeStream failed", {
      code: classified.code,
      error: classified.message,
      duration: Date.now() - start,
    });
    throw classified;
  }
}

export async function generateTitle(summary: string, language: string): Promise<string> {
  const system = `You are a medical transcription assistant. Generate a short, descriptive title (maximum 8 words) for the following summary. Write the title in ${language}. Output only the title — no quotes, no punctuation at the end, no extra commentary.`;
  const start = Date.now();
  logger.info("ai.generateTitle started", { provider: config.ai.provider, language });

  try {
    const result = await provider.complete(system, `<summary>\n${summary}\n</summary>`, 64);

    const title = result.trim() || "Untitled";
    logger.info("ai.generateTitle completed", {
      provider: config.ai.provider,
      duration: Date.now() - start,
    });
    return title;
  } catch (err) {
    if (err instanceof AIError) {
      logger.warn("ai.generateTitle failed", { code: err.code, duration: Date.now() - start });
      throw err;
    }
    const classified = classifyError(err);
    logger.warn("ai.generateTitle failed", {
      code: classified.code,
      error: classified.message,
      duration: Date.now() - start,
    });
    throw classified;
  }
}

const TONE_DESCRIPTIONS: Record<Tone, string> = {
  clinical:
    "Use formal medical language with precise clinical terminology. Be concise and objective.",
  simple:
    "Use plain, everyday language. Avoid medical jargon. Write as if explaining to a patient.",
  detailed:
    "Be comprehensive and thorough. Preserve all key findings, details, and nuances from the original.",
  neutral: "Use a neutral, balanced tone.",
};

function buildMessages({ text, language, style, tone }: SummarizeRequest): {
  system: string;
  user: string;
} {
  const styleInstruction =
    style === "bullets"
      ? "Format the summary as concise bullet points."
      : "Format the summary as a single cohesive paragraph.";

  const toneInstruction = (tone && TONE_DESCRIPTIONS[tone]) ?? `Use a ${tone} tone.`;

  const system = [
    `You are a medical transcription assistant. Your task is to summarize the provided text.`,
    `IMPORTANT: You must write your entire response in ${language}. Do not use any other language.`,
    styleInstruction,
    toneInstruction,
    `Output only the summary — no preamble, no explanation, no extra commentary.`,
  ].join(" ");

  return { system, user: `<transcript>\n${text}\n</transcript>` };
}

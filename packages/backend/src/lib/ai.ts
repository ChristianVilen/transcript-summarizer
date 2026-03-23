import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { SummarizeRequest, Tone } from "@gosta-assignemnt/shared";
import { logger } from "./logger.js";

const isProd = process.env.NODE_ENV === "production";
const model = process.env.AI_MODEL ?? (isProd ? "claude-opus-4-6" : "default");

const anthropic = isProd ? new Anthropic() : null;
const lmStudio = isProd
  ? null
  : new OpenAI({
      baseURL: `${process.env.LM_STUDIO_URL ?? "http://127.0.0.1:1234"}/v1`,
      apiKey: "lm-studio",
    });

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
  logger.info("ai.summarize started", { model, language, style, tone, textLength: text.length });

  try {
    let result: string;

    if (anthropic) {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: user }],
      });
      const block = response.content[0];
      result = block.type === "text" ? block.text : "";
    } else {
      const completion = await lmStudio!.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      result = completion.choices[0]?.message?.content ?? "";
    }

    if (!result) {
      throw new AIError("AI returned an empty response", "unknown", 502);
    }

    logger.info("ai.summarize completed", { model, duration: Date.now() - start });
    return result;
  } catch (err) {
    if (err instanceof AIError) {
      logger.warn("ai.summarize failed", { model, code: err.code, duration: Date.now() - start });
      throw err;
    }
    const classified = classifyError(err);
    logger.warn("ai.summarize failed", {
      model,
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
  logger.info("ai.generateTitle started", { model, language });

  try {
    let result: string;

    if (anthropic) {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 64,
        system,
        messages: [{ role: "user", content: `<summary>\n${summary}\n</summary>` }],
      });
      const block = response.content[0];
      result = block.type === "text" ? block.text.trim() : "";
    } else {
      const completion = await lmStudio!.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `<summary>\n${summary}\n</summary>` },
        ],
      });
      result = completion.choices[0]?.message?.content?.trim() ?? "";
    }

    const title = result || "Untitled";
    logger.info("ai.generateTitle completed", { model, duration: Date.now() - start });
    return title;
  } catch (err) {
    if (err instanceof AIError) {
      logger.warn("ai.generateTitle failed", { model, code: err.code, duration: Date.now() - start });
      throw err;
    }
    const classified = classifyError(err);
    logger.warn("ai.generateTitle failed", {
      model,
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

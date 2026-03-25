import type { SummarizeRequest } from "@gosta-assignemnt/shared";
import { logger } from "./logger.js";
import { config } from "./config.js";
import { provider } from "./providers/index.js";
import { AIError, classifyError } from "./error.js";
import { buildMessages } from "./ai.util.js";

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
    const { classified, cause } = classifyError(err);
    logger.warn("ai.summarize failed", {
      code: classified.code,
      error: classified.message,
      ...(cause && { causeStatus: cause.status, causeMessage: cause.message }),
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
    const { classified, cause } = classifyError(err);
    logger.warn("ai.summarizeStream failed", {
      code: classified.code,
      error: classified.message,
      ...(cause && { causeStatus: cause.status, causeMessage: cause.message }),
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
    const { classified, cause } = classifyError(err);
    logger.warn("ai.generateTitle failed", {
      code: classified.code,
      error: classified.message,
      ...(cause && { causeStatus: cause.status, causeMessage: cause.message }),
      duration: Date.now() - start,
    });
    throw classified;
  }
}

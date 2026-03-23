import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const isProd = process.env.NODE_ENV === "production";
const model = process.env.AI_MODEL ?? (isProd ? "claude-opus-4-6" : "default");

const anthropic = isProd ? new Anthropic() : null;
const lmStudio = isProd
  ? null
  : new OpenAI({
      baseURL: `${process.env.LM_STUDIO_URL ?? "http://127.0.0.1:1234"}/v1`,
      apiKey: "lm-studio",
    });

export interface SummarizeOptions {
  text: string;
  language: string;
  style?: "paragraph" | "bullets";
  tone?: string;
}

export async function summarize({
  text,
  language,
  style = "paragraph",
  tone = "neutral",
}: SummarizeOptions): Promise<string> {
  const prompt = buildPrompt({ text, language, style, tone });

  if (anthropic) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  const completion = await lmStudio!.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });
  return completion.choices[0]?.message?.content ?? "";
}

function buildPrompt({ text, language, style, tone }: SummarizeOptions): string {
  const styleInstruction =
    style === "bullets"
      ? "Format the summary as concise bullet points."
      : "Format the summary as a single paragraph.";

  return `Summarize the following text in ${language}. ${styleInstruction} Use a ${tone} tone.\n\nText:\n${text}`;
}

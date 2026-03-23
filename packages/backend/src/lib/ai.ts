import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { SummarizeRequest, Tone } from "@gosta-assignemnt/shared";

const isProd = process.env.NODE_ENV === "production";
const model = process.env.AI_MODEL ?? (isProd ? "claude-opus-4-6" : "default");

const anthropic = isProd ? new Anthropic() : null;
const lmStudio = isProd
  ? null
  : new OpenAI({
      baseURL: `${process.env.LM_STUDIO_URL ?? "http://127.0.0.1:1234"}/v1`,
      apiKey: "lm-studio",
    });

export async function summarize({
  text,
  language,
  style = "paragraph",
  tone = "neutral",
}: SummarizeRequest): Promise<string> {
  const { system, user } = buildMessages({ text, language, style, tone });

  if (anthropic) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  const completion = await lmStudio!.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
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

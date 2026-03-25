import type { Tone, SummarizeRequest } from "@gosta-assignemnt/shared";

const TONE_DESCRIPTIONS: Record<Tone, string> = {
  clinical:
    "Use formal medical language with precise clinical terminology. Be concise and objective.",
  simple:
    "Use plain, everyday language. Avoid medical jargon. Write as if explaining to a patient.",
  detailed:
    "Be comprehensive and thorough. Preserve all key findings, details, and nuances from the original.",
  neutral: "Use a neutral, balanced tone.",
};

export function buildMessages({ text, language, style, tone }: SummarizeRequest): {
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

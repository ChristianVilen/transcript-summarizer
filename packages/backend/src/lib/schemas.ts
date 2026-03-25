import { z } from "zod";
import { LANGUAGES, TONES } from "@gosta-assignemnt/shared";

export const summarizeRequestSchema = z.object({
  text: z.string().min(1, "text is required").max(100_000, "text exceeds 100 000 character limit"),
  language: z.enum(LANGUAGES),
  style: z.enum(["paragraph", "bullets"]).default("paragraph"),
  tone: z.enum(TONES).default("neutral"),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

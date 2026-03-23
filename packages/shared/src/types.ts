export const LANGUAGES = ["English", "Finnish", "Swedish"] as const;
export type Language = (typeof LANGUAGES)[number];

export const TONES = ["clinical", "simple", "detailed", "neutral"] as const;
export type Tone = (typeof TONES)[number];

export interface SummarizeRequest {
  text: string;
  language: string;
  style?: "paragraph" | "bullets";
  tone?: Tone;
}

export interface SummarizeResponse {
  summary: string;
}

export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  db: boolean;
}

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
  id: number;
  summary: string;
}

export interface SummaryListItem {
  id: number;
  title: string | null;
  language: string;
  tone: string;
  style: string;
  created_at: string;
}

export interface SummaryDetail extends SummaryListItem {
  original_text: string;
  summary: string;
}

export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  db: boolean;
  passwordRequired: boolean;
}

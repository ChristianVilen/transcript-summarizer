export interface SummarizeRequest {
  text: string;
  language: string;
  style?: "paragraph" | "bullets";
  tone?: string;
}

export interface SummarizeResponse {
  summary: string;
}

export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  db: boolean;
}

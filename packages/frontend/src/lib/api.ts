import type { ZodType } from "zod";
import { APP_PREFIX } from "./constants";

let aiPassword = sessionStorage.getItem(`${APP_PREFIX}:ai_password`) ?? "";

export function setAiPassword(password: string): void {
  aiPassword = password;
}

function aiHeaders(extra: HeadersInit = {}): HeadersInit {
  return aiPassword ? { ...extra, "X-AI-Password": aiPassword } : extra;
}

async function parseSSE<T>(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  schema: ZodType<T>,
  onMessage: (msg: T) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (!data) continue;
        let json: unknown;
        try {
          json = JSON.parse(data);
        } catch {
          console.warn("Failed to parse SSE data:", data);
          continue;
        }
        const result = schema.safeParse(json);
        if (result.success) {
          onMessage(result.data);
        } else {
          console.warn("Invalid SSE message:", result.error.flatten());
        }
      }
    }
  }
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: aiHeaders() });
  if (!res.ok) throw new Error(`GET ${url}: ${res.status}`);
  return res.json();
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: aiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url}: ${res.status}`);
  return res.json();
}

async function postStream<T>(
  url: string,
  body: unknown,
  schema: ZodType<T>,
  onMessage: (msg: T) => void,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: aiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url}: ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) return;
  await parseSSE(reader, schema, onMessage);
}

function getStream<T>(
  url: string,
  schema: ZodType<T>,
  onMessage: (msg: T) => void,
): AbortController {
  const controller = new AbortController();
  fetch(url, { headers: aiHeaders(), signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) return;
      const reader = res.body?.getReader();
      if (!reader) return;
      await parseSSE(reader, schema, onMessage);
    })
    .catch((err) => {
      if (err.name !== "AbortError") console.error("SSE error:", err);
    });
  return controller;
}

async function del(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE", headers: aiHeaders() });
  if (!res.ok) throw new Error(`DELETE ${url}: ${res.status}`);
}

export const api = {
  get,
  post,
  postStream,
  getStream,
  delete: del,
};

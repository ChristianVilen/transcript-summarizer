let aiPassword = sessionStorage.getItem("ai_password") ?? "";

export function setAiPassword(password: string): void {
  aiPassword = password;
}

function aiHeaders(extra: HeadersInit = {}): HeadersInit {
  return aiPassword ? { ...extra, "X-AI-Password": aiPassword } : extra;
}

async function parseSSE<T>(
  reader: ReadableStreamDefaultReader<Uint8Array>,
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
        if (data) onMessage(JSON.parse(data) as T);
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
  await parseSSE(reader, onMessage);
}

function getStream<T>(url: string, onMessage: (msg: T) => void): AbortController {
  const controller = new AbortController();
  fetch(url, { headers: aiHeaders(), signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) return;
      const reader = res.body?.getReader();
      if (!reader) return;
      await parseSSE(reader, onMessage);
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

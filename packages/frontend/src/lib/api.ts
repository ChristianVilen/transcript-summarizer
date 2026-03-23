let aiPassword = sessionStorage.getItem("ai_password") ?? "";

export function setAiPassword(password: string): void {
  aiPassword = password;
}

async function get<T>(url: string): Promise<T> {
  const headers: HeadersInit = {};
  if (url.includes("/api/ai/") && aiPassword) {
    headers["X-AI-Password"] = aiPassword;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url}: ${res.status}`);
  return res.json();
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (url.includes("/api/ai/") && aiPassword) {
    headers["X-AI-Password"] = aiPassword;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url}: ${res.status}`);
  return res.json();
}

async function postStream(
  url: string,
  body: unknown,
  onChunk: (text: string) => void,
): Promise<void> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (url.includes("/api/ai/") && aiPassword) {
    headers["X-AI-Password"] = aiPassword;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url}: ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

async function del(url: string): Promise<void> {
  const headers: HeadersInit = {};
  if (url.includes("/api/ai/") && aiPassword) {
    headers["X-AI-Password"] = aiPassword;
  }
  const res = await fetch(url, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`DELETE ${url}: ${res.status}`);
}

export const api = {
  get,
  post,
  postStream,
  delete: del,
};

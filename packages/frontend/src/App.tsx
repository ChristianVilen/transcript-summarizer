import { useEffect, useState } from "react";
import type { HealthResponse } from "@gosta-assignemnt/shared";
import { api } from "./lib/api";
import { Summarizer } from "./components/Summarizer";

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    api
      .get<HealthResponse>("/api/health")
      .then(setHealth)
      .catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transcript Summarizer</h1>
        {health && (
          <span className={`text-xs ${health.status === "ok" ? "text-secondary" : "text-error"}`}>
            Backend health: {health.status}
          </span>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Summarizer />
      </main>
    </div>
  );
}

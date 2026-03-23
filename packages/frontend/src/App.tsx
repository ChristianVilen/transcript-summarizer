import { useEffect, useState } from "react";
import type { HealthResponse } from "@gosta-assignemnt/shared";
import { api } from "./lib/api";

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HealthResponse>("/api/health")
      .then(setHealth)
      .catch(() => setError("Backend unreachable"));
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold">Gosta Assignment</h1>
      </header>
      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-text-muted">
            Backend:{" "}
            {error ? (
              <span className="text-error">{error}</span>
            ) : health ? (
              <span className={health.status === "ok" ? "text-secondary" : "text-error"}>
                {health.status} (db: {String(health.db)})
              </span>
            ) : (
              <span className="animate-pulse">checking...</span>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

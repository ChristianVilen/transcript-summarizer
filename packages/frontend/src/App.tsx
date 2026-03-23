import { useEffect, useRef, useState } from "react";
import type { HealthResponse, SummaryListItem } from "@gosta-assignemnt/shared";
import { api } from "./lib/api";
import { Summarizer } from "./components/Summarizer";
import { History } from "./components/History";
import { SummaryDetail } from "./components/SummaryDetail";

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [history, setHistory] = useState<SummaryListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get<HealthResponse>("/api/health").then(setHealth).catch(() => null);
    fetchHistory();
  }, []);

  function fetchHistory() {
    api
      .get<SummaryListItem[]>("/api/ai/summaries")
      .then(setHistory)
      .catch(() => null);
  }

  function handleSummarized(id: number) {
    fetchHistory();
    setPendingId(id);
    pollForTitle(id);
  }

  function pollForTitle(id: number, attempts = 0) {
    if (attempts >= 15) {
      setPendingId(null);
      return;
    }
    pollRef.current = setTimeout(() => {
      api
        .get<SummaryListItem[]>("/api/ai/summaries")
        .then((items) => {
          setHistory(items);
          const item = items.find((i) => i.id === id);
          if (item?.title) {
            setPendingId(null);
          } else {
            pollForTitle(id, attempts + 1);
          }
        })
        .catch(() => pollForTitle(id, attempts + 1));
    }, 2000);
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-semibold">Transcript Summarizer</h1>
        {health && (
          <span className={`text-xs ${health.status === "ok" ? "text-secondary" : "text-error"}`}>
            Backend health: {health.status}
          </span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted opacity-60">
              History
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <History
              items={history}
              selectedId={selectedId}
              pendingId={pendingId}
              onSelect={(id) => setSelectedId(id)}
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-2xl mx-auto">
            {selectedId !== null ? (
              <SummaryDetail
                id={selectedId}
                onBack={() => setSelectedId(null)}
              />
            ) : (
              <Summarizer onSummarized={handleSummarized} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

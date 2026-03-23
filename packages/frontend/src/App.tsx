import { Summarizer } from "./components/Summarizer";
import { History } from "./components/History";
import { SummaryDetail } from "./components/SummaryDetail";
import { useHealth } from "./hooks/useHealth";
import { usePassword } from "./hooks/usePassword";
import { useSummaryHistory } from "./hooks/useSummaryHistory";

export default function App() {
  const health = useHealth();
  const { password, setPassword } = usePassword();
  const { history, selectedId, setSelectedId, pendingId, handleSummarized } = useSummaryHistory();

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-semibold">Transcript Summarizer</h1>
        <div className="flex items-center gap-4">
          <input
            type="password"
            placeholder="AI Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-1 text-sm rounded border border-border bg-bg-secondary text-text placeholder-text-muted"
          />
          {health && (
            <span className={`text-xs ${health.status === "ok" ? "text-secondary" : "text-error"}`}>
              Backend health: {health.status}
            </span>
          )}
        </div>
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
                onRegenerated={(newId) => { handleSummarized(newId); setSelectedId(newId); }}
              />
            ) : (
              <Summarizer
                onSummarized={handleSummarized}
                password={password}
                passwordRequired={health?.passwordRequired ?? false}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

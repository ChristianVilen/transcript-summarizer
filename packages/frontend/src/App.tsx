import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { Sidebar } from "./components/Sidebar";
import { Summarizer } from "./components/Summarizer";
import { SummaryDetail } from "./components/SummaryDetail";
import { useHealth } from "./hooks/useHealth";
import { usePassword } from "./hooks/usePassword";
import { useSummaryHistory } from "./hooks/useSummaryHistory";

export default function App() {
  const health = useHealth();
  const { password, setPassword } = usePassword();
  const { history, selectedId, setSelectedId, pendingId, handleSummarized, handleDelete } = useSummaryHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <AppHeader
        password={password}
        onPasswordChange={setPassword}
        health={health}
        onMenuOpen={() => setDrawerOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          items={history}
          selectedId={selectedId}
          pendingId={pendingId}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onNew={() => { setSelectedId(null); setDrawerOpen(false); }}
          onSelect={(id) => { setSelectedId(id); setDrawerOpen(false); }}
          onDelete={handleDelete}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="max-w-2xl mx-auto">
            {selectedId !== null ? (
              <SummaryDetail
                id={selectedId}
                onRegenerated={(newId, meta) => { handleSummarized(newId, meta); setSelectedId(newId); }}
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

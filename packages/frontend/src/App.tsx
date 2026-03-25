import { useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { SummaryWorkspace } from "./components/SummaryWorkspace";
import { useHealth } from "./hooks/useHealth";
import { usePassword } from "./hooks/usePassword";
import { SummaryMeta, useSummaryHistory } from "./hooks/useSummaryHistory";

export default function App() {
  const health = useHealth();
  const { password, setPassword } = usePassword();
  const { history, selectedId, setSelectedId, pendingId, handleSummarized, handleDelete } =
    useSummaryHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onMenuOpen = () => setDrawerOpen(true);

  const onNew = () => {
    setSelectedId(null);
    setDrawerOpen(false);
  };

  const onSelect = (id: number) => {
    setSelectedId(id);
    setDrawerOpen(false);
  };

  const onDelete = (id: number) => handleDelete(id);

  const onSummarized = (id: number, meta: SummaryMeta) => {
    handleSummarized(id, meta);
    setSelectedId(id);
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <Header
        password={password}
        onPasswordChange={setPassword}
        health={health}
        onMenuOpen={onMenuOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          items={history}
          selectedId={selectedId}
          pendingId={pendingId}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onNew={onNew}
          onSelect={onSelect}
          onDelete={onDelete}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="max-w-2xl mx-auto">
            <SummaryWorkspace
              selectedId={selectedId}
              password={password}
              passwordRequired={health?.passwordRequired ?? false}
              onSummarized={onSummarized}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

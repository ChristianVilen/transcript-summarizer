import type { SummaryListItem } from "@gosta-assignemnt/shared";
import { History } from "./History";

interface Props {
  items: SummaryListItem[];
  selectedId: number | null;
  pendingId: number | null;
  onNew: () => void;
  onSelect: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
}

export const Sidebar = ({ items, selectedId, pendingId, onNew, onSelect, onDelete }: Props) => (
  <aside className="w-64 shrink-0 border-r border-border flex flex-col overflow-hidden">
    <div className="px-4 py-3 border-b border-border">
      <button
        onClick={onNew}
        className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          selectedId === null
            ? "bg-primary/20 text-text"
            : "text-text-muted hover:bg-surface hover:text-text"
        }`}
      >
        + New summary
      </button>
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-3">
      <History
        items={items}
        selectedId={selectedId}
        pendingId={pendingId}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    </div>
  </aside>
);

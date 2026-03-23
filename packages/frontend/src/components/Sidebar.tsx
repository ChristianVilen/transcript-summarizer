import type { SummaryListItem } from "@gosta-assignemnt/shared";
import { History } from "./History";

interface Props {
  items: SummaryListItem[];
  selectedId: number | null;
  pendingId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
}

export const Sidebar = ({ items, selectedId, pendingId, onSelect, onDelete }: Props) => (
  <aside className="w-64 shrink-0 border-r border-border flex flex-col overflow-hidden">
    <div className="px-4 py-3 border-b border-border">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted opacity-60">
        History
      </h2>
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

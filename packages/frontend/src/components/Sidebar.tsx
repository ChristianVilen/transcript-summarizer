import type { SummaryListItem } from "@gosta-assignemnt/shared";
import { History } from "./History";
import { ComposeIcon } from "./icons";

interface Props {
  items: SummaryListItem[];
  selectedId: number | null;
  pendingId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
}

export const Sidebar = ({ items, selectedId, pendingId, isOpen, onClose, onNew, onSelect, onDelete }: Props) => (
  <>
    <div
      className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    />

    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-bg border-r border-border
        w-72 transition-transform duration-300 ease-in-out
        md:relative md:inset-auto md:z-auto md:w-64 md:translate-x-0 md:flex
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="px-3 py-3 border-b border-border">
        <button
          onClick={onNew}
          className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            selectedId === null
              ? "bg-primary/10 text-primary border border-primary/25"
              : "text-text-muted hover:bg-surface hover:text-text border border-transparent"
          }`}
        >
          <ComposeIcon size={13} />
          New summary
        </button>
      </div>

      <div className="px-3 pt-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted opacity-40">
          History
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1">
        <History
          items={items}
          selectedId={selectedId}
          pendingId={pendingId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>
    </aside>
  </>
);

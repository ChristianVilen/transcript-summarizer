import { useState } from "react";
import type { SummaryListItem } from "@gosta-assignemnt/shared";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface Props {
  items: SummaryListItem[];
  selectedId: number | null;
  pendingId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
}

export const History = ({ items, selectedId, pendingId, onSelect, onDelete }: Props) => {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmItem = items.find((i) => i.id === confirmId);

  async function handleConfirm() {
    if (confirmId === null) return;
    setDeleting(true);
    try {
      await onDelete(confirmId);
      setConfirmId(null);
    } finally {
      setDeleting(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-text-muted/50 mt-2">No summaries yet. Create one to get started.</p>
    );
  }

  return (
    <>
      <ul className="space-y-1">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const isPending = item.id === pendingId && item.title === null;

          return (
            <li key={item.id} className="group relative">
              <button
                onClick={() => onSelect(item.id)}
                className={`w-full text-left rounded-md px-3 py-2.5 pr-9 transition-colors ${
                  isSelected
                    ? "bg-primary/20 text-text"
                    : "hover:bg-surface text-text-muted hover:text-text"
                }`}
              >
                <p className="text-sm font-medium truncate">
                  {isPending ? (
                    <span className="italic opacity-50">Generating title…</span>
                  ) : (
                    (item.title ?? "Untitled")
                  )}
                </p>
                <p className="text-xs opacity-40 mt-0.5">
                  {item.language} · {new Date(item.created_at).toLocaleDateString()}
                </p>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setConfirmId(item.id); }}
                aria-label="Delete summary"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-error hover:bg-error/10 transition-all"
              >
                <TrashIcon />
              </button>
            </li>
          );
        })}
      </ul>

      {confirmId !== null && (
        <DeleteConfirmModal
          title={confirmItem?.title ?? null}
          deleting={deleting}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
};

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

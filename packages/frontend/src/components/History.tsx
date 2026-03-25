import { useState, useEffect, useRef } from "react";
import type { SummaryListItem } from "@gosta-assignemnt/shared";
import { TrashIcon } from "./icons";

interface Props {
  items: SummaryListItem[];
  selectedId: number | null;
  pendingId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
}

export const History = ({ items, selectedId, pendingId, onSelect, onDelete }: Props) => {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirmId === null) return;
    const handle = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setConfirmId(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [confirmId]);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-text-muted/50 mt-2">
        No summaries yet. Create one to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        const isPending = item.id === pendingId && item.title === null;
        const isConfirming = item.id === confirmId;
        const isDeleting = item.id === deletingId;

        return (
          <li key={item.id} className="group relative">
            <button
              onClick={() => onSelect(item.id)}
              className={`w-full text-left rounded-md px-3 py-2.5 transition-all ${
                isConfirming ? "pr-16" : "pr-9"
              } ${
                isSelected
                  ? "bg-primary/20 text-text"
                  : "hover:bg-surface-raised text-text-muted hover:text-text"
              }`}
            >
              <p className="text-sm font-medium truncate">
                {isPending ? (
                  <span className="italic opacity-50">Generating title...</span>
                ) : (
                  (item.title ?? "Untitled")
                )}
              </p>
              <p className="text-xs opacity-40 mt-0.5">
                {item.language} · {new Date(item.created_at).toLocaleDateString()}
              </p>
            </button>

            {isConfirming ? (
              <button
                ref={confirmRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                disabled={isDeleting}
                aria-label="Confirm delete"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium text-error bg-error/15 border border-error/30 hover:bg-error/25 transition-colors disabled:opacity-40"
              >
                {isDeleting ? "..." : "Sure?"}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmId(item.id);
                }}
                aria-label="Delete summary"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-error hover:bg-error/10 transition-all"
              >
                <TrashIcon />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

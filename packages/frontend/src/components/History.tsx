import type { SummaryListItem } from "@gosta-assignemnt/shared";

interface Props {
  items: SummaryListItem[];
  selectedId: number | null;
  pendingId: number | null;
  onSelect: (id: number) => void;
}

export const History = ({ items, selectedId, pendingId, onSelect }: Props) => {
  if (items.length === 0) {
    return (
      <p className="text-xs text-text-muted/50 mt-2">No summaries yet. Create one to get started.</p>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        const isPending = item.id === pendingId && item.title === null;

        return (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item.id)}
              className={`w-full text-left rounded-md px-3 py-2.5 transition-colors ${
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
          </li>
        );
      })}
    </ul>
  );
};

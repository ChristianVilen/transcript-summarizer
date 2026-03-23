interface Props {
  title: string | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal = ({ title, deleting, onConfirm, onCancel }: Props) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    onClick={onCancel}
  >
    <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" />

    <div
      className="relative z-10 w-[min(360px,90vw)] rounded-xl border border-border bg-surface shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      style={{ animation: "modal-in 160ms cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <div className="h-0.5 w-full bg-gradient-to-r from-error/60 via-error to-error/60" />

      <div className="px-6 pt-5 pb-6 space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-text">Delete summary?</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            {title ? (
              <>
                <span className="text-text">{title}</span>
                {" "}will be permanently removed.
              </>
            ) : (
              "This summary will be permanently removed."
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-md border border-border bg-transparent px-4 py-2 text-sm text-text-muted hover:text-text hover:border-text-muted transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-md bg-error/15 border border-error/30 px-4 py-2 text-sm font-medium text-error hover:bg-error/25 hover:border-error/50 transition-colors disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>

    <style>{`
      @keyframes modal-in {
        from { opacity: 0; transform: scale(0.96) translateY(6px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
  </div>
);

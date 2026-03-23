import { useEffect, useState } from "react";
import type { SummaryDetail as SummaryDetailType } from "@gosta-assignemnt/shared";
import { api } from "../lib/api";

interface Props {
  id: number;
  onBack: () => void;
}

export const SummaryDetail = ({ id, onBack }: Props) => {
  const [detail, setDetail] = useState<SummaryDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    setError(null);
    api
      .get<SummaryDetailType>(`/api/ai/summaries/${id}`)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load summary"));
  }, [id]);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-text-muted hover:text-text transition-colors"
      >
        ← New summary
      </button>

      {error && (
        <p className="rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {!detail && !error && (
        <p className="text-sm text-text-muted opacity-50">Loading…</p>
      )}

      {detail && (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge label="Language" value={detail.language} />
            <Badge label="Tone" value={detail.tone} />
            <Badge label="Style" value={detail.style} />
          </div>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted opacity-60">
              Summary
            </h2>
            <div className="rounded-lg border border-primary/30 bg-surface p-5 text-text leading-relaxed">
              <p>{detail.summary}</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted opacity-60">
              Original transcript
            </h2>
            <div className="rounded-lg border border-border bg-surface p-5 text-text-muted leading-relaxed text-sm whitespace-pre-wrap">
              {detail.original_text}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const Badge = ({ label, value }: { label: string; value: string }) => (
  <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted capitalize">
    {label}: <span className="text-text">{value}</span>
  </span>
);

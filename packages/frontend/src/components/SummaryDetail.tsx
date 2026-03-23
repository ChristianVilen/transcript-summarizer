import { useEffect, useState } from "react";
import type { SummarizeRequest, SummarizeResponse, SummaryDetail as SummaryDetailType, Tone } from "@gosta-assignemnt/shared";
import { TONES } from "@gosta-assignemnt/shared";
import { api } from "../lib/api";
import { SummaryContent } from "./SummaryContent";

const TONE_LABELS: Record<Tone, string> = {
  clinical: "Clinical",
  simple: "Simple",
  detailed: "Detailed",
  neutral: "Neutral",
};

interface Props {
  id: number;
  onBack: () => void;
  onRegenerated: (id: number, meta: { language: string; tone: string; style: string }) => void;
}

export const SummaryDetail = ({ id, onBack, onRegenerated }: Props) => {
  const [detail, setDetail] = useState<SummaryDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [tone, setTone] = useState<Tone>("clinical");
  const [style, setStyle] = useState<"paragraph" | "bullets">("paragraph");

  async function handleRegenerate() {
    if (!detail || regenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await api.post<SummarizeResponse>("/api/ai/summarize", {
        text: detail.original_text,
        language: detail.language,
        tone,
        style,
      } as SummarizeRequest);
      onRegenerated(res.id, { language: detail.language, tone, style });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  }

  useEffect(() => {
    setDetail(null);
    setError(null);
    api
      .get<SummaryDetailType>(`/api/ai/summaries/${id}`)
      .then((d) => {
        setDetail(d);
        setTone(d.tone as Tone);
        setStyle(d.style as "paragraph" | "bullets");
      })
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge label="Language" value={detail.language} />
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text focus:border-primary focus:outline-none"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>{TONE_LABELS[t]}</option>
              ))}
            </select>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as "paragraph" | "bullets")}
              className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="paragraph">Paragraph</option>
              <option value="bullets">Bullets</option>
            </select>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="ml-auto rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:text-text hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {regenerating ? "Regenerating…" : "Regenerate ↺"}
            </button>
          </div>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted opacity-60">
              Summary
            </h2>
            <div className="rounded-lg border border-primary/30 bg-surface p-5 text-text leading-relaxed">
              <SummaryContent text={detail.summary} />
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

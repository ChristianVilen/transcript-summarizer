import { useEffect, useState } from "react";
import type { SummarizeRequest, SummarizeResponse, SummaryDetail as SummaryDetailType, Tone } from "@gosta-assignemnt/shared";
import { api } from "../lib/api";
import { SummaryContent } from "./SummaryContent";
import { LanguageSelect, ToneSelect, StyleSelect } from "./SummarySelects";

interface Props {
  id: number;
  onRegenerated: (id: number, meta: { language: string; tone: string; style: string }) => void;
}

export const SummaryDetail = ({ id, onRegenerated }: Props) => {
  const [detail, setDetail] = useState<SummaryDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState<Tone>("clinical");
  const [style, setStyle] = useState<"paragraph" | "bullets">("paragraph");

  async function handleRegenerate() {
    if (!detail || regenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await api.post<SummarizeResponse>("/api/ai/summarize", {
        text: detail.original_text,
        language,
        tone,
        style,
      } as SummarizeRequest);
      onRegenerated(res.id, { language, tone, style });
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
        setLanguage(d.language);
        setTone(d.tone as Tone);
        setStyle(d.style as "paragraph" | "bullets");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load summary"));
  }, [id]);

  return (
    <div className="space-y-6">
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
            <LanguageSelect value={language} onChange={setLanguage} size="sm" />
            <ToneSelect value={tone} onChange={setTone} size="sm" />
            <StyleSelect value={style} onChange={setStyle} size="sm" />
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

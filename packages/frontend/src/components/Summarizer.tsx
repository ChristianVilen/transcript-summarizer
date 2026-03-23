import { useState } from "react";
import type { SummarizeRequest, SummarizeResponse, Tone } from "@gosta-assignemnt/shared";
import { LANGUAGES } from "@gosta-assignemnt/shared";
import { api } from "../lib/api";

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: "clinical", label: "Clinical", description: "Formal medical language, precise terminology." },
  { value: "simple", label: "Simple", description: "Plain language, avoids medical jargon." },
  { value: "detailed", label: "Detailed", description: "Comprehensive, thorough and preserves all key findings." },
];

interface Props {
  onSummarized: (id: number) => void;
}

export const Summarizer = ({ onSummarized }: Props) => {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState<Tone>("clinical");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await api.post<SummarizeResponse>("/api/ai/summarize", {
        text,
        language,
        tone,
      } satisfies SummarizeRequest);
      setSummary(res.summary);
      onSummarized(res.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-text">
        Paste the text you would like to have summarised here:
      </h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        className="w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 text-text placeholder:text-text-muted/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>

        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as Tone)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
        >
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} - {t.description}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="ml-auto rounded-md bg-primary px-5 py-2 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Summarizing…" : "Summarize →"}
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {summary !== null && (
        <div className="rounded-lg border border-border bg-surface p-5 text-text leading-relaxed">
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

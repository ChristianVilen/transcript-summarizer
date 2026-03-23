import { useRef, useState } from "react";
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
  password: string;
  passwordRequired: boolean;
}

export const Summarizer = ({ onSummarized, password, passwordRequired }: Props) => {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState<Tone>("clinical");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setText(reader.result as string);
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

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
      <h2 className="text-2xl font-semibold text-text">New summary</h2>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:text-text hover:border-primary transition-colors"
        >
          Upload file
        </button>
        <span className="text-xs text-text-muted opacity-40">.txt · .md · .csv</span>
        {text && (
          <span className="text-xs text-text-muted opacity-50 ml-auto">{text.length.toLocaleString()} characters</span>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        placeholder="Paste text or drop a file here…"
        rows={12}
        className={`w-full resize-y rounded-lg border bg-surface px-4 py-3 text-text placeholder:text-text-muted/40 focus:outline-none focus:ring-1 transition-colors ${
          dragging
            ? "border-primary ring-1 ring-primary/30 bg-primary/5"
            : "border-border focus:border-primary focus:ring-primary/30"
        }`}
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
          disabled={!text.trim() || loading || (passwordRequired && !password)}
          title={passwordRequired && !password ? "Enter your AI password to summarize" : undefined}
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

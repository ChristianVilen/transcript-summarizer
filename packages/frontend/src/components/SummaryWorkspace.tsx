import { SummaryContent } from "./SummaryContent";
import { LanguageSelect, ToneSelect, StyleSelect } from "./SummarySelects";
import { useSummaryWorkspace } from "../hooks/useSummaryWorkspace";

interface Props {
  selectedId: number | null;
  password: string;
  passwordRequired: boolean;
  onSummarized: (id: number, meta: { language: string; tone: string; style: string }) => void;
}

export const SummaryWorkspace = ({ selectedId, password, passwordRequired, onSummarized }: Props) => {
  const {
    mode,
    inputText, setInputText,
    language, setLanguage,
    tone, setTone,
    style, setStyle,
    originalText,
    summaryText,
    isLoadingDetail,
    isStreaming,
    isRegenerating,
    isLoading,
    error,
    dragging,
    fileInputRef,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSubmit,
    handleRegenerate,
  } = useSummaryWorkspace({ selectedId, onSummarized });

  return (
    <div className="space-y-5">
      {mode === "new" && (
        <h2 className="text-2xl font-semibold text-text">New summary</h2>
      )}

      {mode === "new" ? (
        <div className="space-y-3">
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
            {inputText && (
              <span className="text-xs text-text-muted opacity-50 ml-auto">
                {inputText.length.toLocaleString()} characters
              </span>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            placeholder="Paste text or drop a file here…"
            rows={12}
            className={`w-full resize-y rounded-lg border bg-surface px-4 py-3 text-text placeholder:text-text-muted/40 focus:outline-none focus:ring-1 transition-colors ${
              dragging
                ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                : "border-border focus:border-primary focus:ring-primary/30"
            }`}
          />
        </div>
      ) : (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted opacity-60">
            Original transcript
          </h2>
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-text-muted leading-relaxed text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
            {isLoadingDetail ? <span className="opacity-40">Loading…</span> : originalText}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelect value={language} onChange={setLanguage} />
        <ToneSelect value={tone} onChange={setTone} />
        <StyleSelect value={style} onChange={setStyle} />
        <button
          onClick={mode === "new" ? handleSubmit : handleRegenerate}
          disabled={
            mode === "new"
              ? !inputText.trim() || isLoading || (passwordRequired && !password)
              : !originalText || isLoading
          }
          title={passwordRequired && !password ? "Enter your AI password to summarize" : undefined}
          className="ml-auto rounded-md bg-primary px-5 py-2 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mode === "new"
            ? isStreaming ? "Summarizing…" : "Summarize →"
            : isRegenerating ? "Regenerating…" : "Regenerate ↺"}
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {summaryText !== null && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted opacity-60">
            Summary
          </h2>
          <div className="rounded-lg border border-primary/30 bg-surface p-5 text-text leading-relaxed">
            <SummaryContent text={summaryText} />
            {isLoading && (
              <span className="inline-block w-0.5 h-4 bg-primary/70 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        </section>
      )}
    </div>
  );
};

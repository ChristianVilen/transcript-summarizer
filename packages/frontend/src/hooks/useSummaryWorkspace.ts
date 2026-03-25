import { useEffect, useRef, useState } from "react";
import type {
  SummarizeRequest,
  SummaryDetail as SummaryDetailType,
  Tone,
} from "@gosta-assignemnt/shared";
import { api } from "../lib/api";
import { useFileInput } from "./useFileInput";

type SummarizeEvent =
  | { type: "chunk"; text: string }
  | { type: "done"; id: number }
  | { type: "error"; message: string };

interface Options {
  selectedId: number | null;
  onSummarized: (id: number, meta: { language: string; tone: string; style: string }) => void;
}

export function useSummaryWorkspace({ selectedId, onSummarized }: Options) {
  const [mode, setMode] = useState<"new" | "view">(selectedId !== null ? "view" : "new");
  const viewIdRef = useRef<number | null>(null);

  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState<Tone>("clinical");
  const [style, setStyle] = useState<"paragraph" | "bullets">("paragraph");

  const [originalText, setOriginalText] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInput = useFileInput(setError);

  useEffect(() => {
    const isNewSelection = selectedId !== null && selectedId !== viewIdRef.current;

    if (selectedId === null) {
      viewIdRef.current = null;
      setMode("new");
      setSummaryText(null);
      setOriginalText(null);
      setError(null);
    } else if (isNewSelection) {
      viewIdRef.current = selectedId;
      setMode("view");
      setSummaryText(null);
      setOriginalText(null);
      setError(null);
      loadDetail(selectedId);
    }
    // !isNewSelection && selectedId !== null means we just finished summarizing
  }, [selectedId]);

  function loadDetail(id: number) {
    setIsLoadingDetail(true);
    api
      .get<SummaryDetailType>(`/api/ai/summaries/${id}`)
      .then((d) => {
        setSummaryText(d.summary);
        setOriginalText(d.original_text);
        setLanguage(d.language);
        setTone(d.tone as Tone);
        setStyle(d.style as "paragraph" | "bullets");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load summary"))
      .finally(() => setIsLoadingDetail(false));
  }

  async function runStream(text: string) {
    let streamedText = "";
    let doneId: number | null = null;
    let streamError: string | null = null;

    await api.postStream<SummarizeEvent>(
      "/api/ai/summarize",
      { text, language, tone, style } satisfies SummarizeRequest,
      (msg) => {
        if (msg.type === "chunk") {
          streamedText += msg.text;
          setSummaryText(streamedText);
        } else if (msg.type === "done") {
          doneId = msg.id;
        } else if (msg.type === "error") {
          streamError = msg.message;
        }
      },
    );

    if (streamError) {
      throw new Error(streamError);
    }

    return doneId;
  }

  async function handleSubmit() {
    if (!fileInput.inputText.trim() || isStreaming) return;
    setIsStreaming(true);
    setError(null);
    setSummaryText(null);
    try {
      const doneId = await runStream(fileInput.inputText);
      if (doneId !== null) {
        viewIdRef.current = doneId;
        setMode("view");
        setOriginalText(fileInput.inputText);
        fileInput.setInputText("");
        onSummarized(doneId, { language, tone, style });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleRegenerate() {
    if (!originalText || isRegenerating) return;
    setIsRegenerating(true);
    setError(null);
    setSummaryText(null);
    try {
      const doneId = await runStream(originalText);
      if (doneId !== null) {
        viewIdRef.current = doneId;
        onSummarized(doneId, { language, tone, style });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setIsRegenerating(false);
    }
  }

  return {
    ...fileInput,
    mode,
    language,
    setLanguage,
    tone,
    setTone,
    style,
    setStyle,
    originalText,
    summaryText,
    isLoadingDetail,
    isStreaming,
    isRegenerating,
    isLoading: isStreaming || isRegenerating,
    error,
    handleSubmit,
    handleRegenerate,
  };
}

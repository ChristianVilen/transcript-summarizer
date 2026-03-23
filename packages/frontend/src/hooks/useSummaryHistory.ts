import { useEffect, useRef, useState } from "react";
import type { SummaryListItem } from "@gosta-assignemnt/shared";
import { api } from "../lib/api";

export function useSummaryHistory() {
  const [history, setHistory] = useState<SummaryListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchHistory(true);
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function fetchHistory(autoSelect = false) {
    api
      .get<SummaryListItem[]>("/api/ai/summaries")
      .then((items) => {
        setHistory(items);
        if (autoSelect && items.length > 0) {
          setSelectedId(items[0].id);
        }
      })
      .catch(() => null);
  }

  function subscribeToTitle(id: number) {
    abortRef.current?.abort();
    abortRef.current = api.getStream<{ title: string }>(
      `/api/ai/summaries/${id}/title-stream`,
      (msg) => {
        setHistory((prev) =>
          prev.map((item) => (item.id === id ? { ...item, title: msg.title } : item))
        );
        setPendingId(null);
      },
    );
  }

  function handleSummarized(id: number, meta: { language: string; tone: string; style: string }) {
    setHistory((prev) => [
      { id, title: null, created_at: new Date().toISOString(), ...meta },
      ...prev,
    ]);
    setPendingId(id);
    subscribeToTitle(id);
  }

  async function handleDelete(id: number) {
    await api.delete(`/api/ai/summaries/${id}`);
    setHistory((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (pendingId === id) {
      abortRef.current?.abort();
      setPendingId(null);
    }
  }

  return { history, selectedId, setSelectedId, pendingId, handleSummarized, handleDelete };
}

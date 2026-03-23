import { useEffect, useRef, useState } from "react";
import type { SummaryListItem } from "@gosta-assignemnt/shared";
import { api } from "../lib/api";

export function useSummaryHistory() {
  const [history, setHistory] = useState<SummaryListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchHistory(true);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
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

  function pollForTitle(id: number, attempts = 0) {
    if (attempts >= 15) {
      setPendingId(null);
      return;
    }
    pollRef.current = setTimeout(() => {
      api
        .get<SummaryListItem[]>("/api/ai/summaries")
        .then((items) => {
          setHistory(items);
          const item = items.find((i) => i.id === id);
          if (item?.title) {
            setPendingId(null);
          } else {
            pollForTitle(id, attempts + 1);
          }
        })
        .catch(() => pollForTitle(id, attempts + 1));
    }, 2000);
  }

  function handleSummarized(id: number, meta: { language: string; tone: string; style: string }) {
    setHistory((prev) => [
      { id, title: null, created_at: new Date().toISOString(), ...meta },
      ...prev,
    ]);
    setPendingId(id);
    pollForTitle(id);
  }

  async function handleDelete(id: number) {
    await api.delete(`/api/ai/summaries/${id}`);
    setHistory((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return { history, selectedId, setSelectedId, pendingId, handleSummarized, handleDelete };
}

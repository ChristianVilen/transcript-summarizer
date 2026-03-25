import { useEffect, useRef, useState } from "react";
import type { SummaryListItem } from "@gosta-assignemnt/shared";
import { z } from "zod";
import { api } from "../lib/api";

const titleEventSchema = z.object({ title: z.string() });

export interface SummaryMeta {
  language: string;
  tone: string;
  style: string;
}

function getUrlId(): number | null {
  const raw = new URLSearchParams(window.location.search).get("id");
  const n = raw !== null ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function useSummaryHistory() {
  const [history, setHistory] = useState<SummaryListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(getUrlId);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchHistory();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function selectId(id: number | null) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id === null) {
      url.searchParams.delete("id");
    } else {
      url.searchParams.set("id", String(id));
    }
    window.history.replaceState(null, "", url.toString());
  }

  function fetchHistory() {
    api
      .get<SummaryListItem[]>("/api/ai/summaries")
      .then((items) => {
        setHistory(items);
        const urlId = getUrlId();
        if (urlId !== null && !items.some((i) => i.id === urlId)) {
          selectId(null);
        }
      })
      .catch(() => null);
  }

  function subscribeToTitle(id: number) {
    abortRef.current?.abort();
    abortRef.current = api.getStream(
      `/api/ai/summaries/${id}/title-stream`,
      titleEventSchema,
      (msg) => {
        setHistory((prev) =>
          prev.map((item) => (item.id === id ? { ...item, title: msg.title } : item)),
        );
        setPendingId(null);
      },
    );
  }

  function handleSummarized(id: number, meta: SummaryMeta) {
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
    if (selectedId === id) selectId(null);
    if (pendingId === id) {
      abortRef.current?.abort();
      setPendingId(null);
    }
  }

  return {
    history,
    selectedId,
    setSelectedId: selectId,
    pendingId,
    handleSummarized,
    handleDelete,
  };
}

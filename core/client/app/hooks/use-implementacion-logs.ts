"use client";

import { useEffect, useState } from "react";
import type { ImplementacionLog } from "@/lib/implementaciones-schema";

const POLL_INTERVAL_MS = 4000;

export function useImplementacionLogs(implementacionId: number, keepPolling: boolean) {
  const [logs, setLogs] = useState<ImplementacionLog[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchLogs() {
      try {
        const response = await fetch(`/api/implementaciones/${implementacionId}/logs`, { cache: "no-store" });
        if (!response.ok) throw new Error("request failed");
        const data: ImplementacionLog[] = await response.json();
        if (!cancelled) {
          setLogs(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchLogs();
    if (!keepPolling) {
      return () => {
        cancelled = true;
      };
    }

    const interval = setInterval(fetchLogs, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [implementacionId, keepPolling]);

  return { logs, error };
}

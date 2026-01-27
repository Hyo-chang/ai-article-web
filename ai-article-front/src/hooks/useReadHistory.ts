import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/services/AuthContext";
import type { ReadHistoryEntry } from "@/types/readHistory";

interface UseReadHistoryState {
  history: ReadHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8080";

export function useReadHistory(): UseReadHistoryState {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReadHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (signal?: AbortSignal) => {
      if (!user?.userId || !user?.token) {
        setHistory([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/users/${user.userId}/read-history`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
            signal,
          },
        );

        if (!response.ok) {
          const message = await response.text().catch(() => null);
          throw new Error(message || "읽은 기록을 불러오지 못했습니다.");
        }

        const payload = (await response.json()) as ReadHistoryEntry[];
        setHistory(Array.isArray(payload) ? payload : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(
          err instanceof Error ? err.message : "읽은 기록을 불러오는 중 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user?.token, user?.userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
    return () => controller.abort();
  }, [fetchHistory]);

  const refetch = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error, refetch };
}

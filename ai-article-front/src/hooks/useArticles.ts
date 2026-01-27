import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";
import type { Article } from "@/types/article";

interface UseArticlesState {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
}

export function useArticles(): UseArticlesState {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchArticles() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchJson<Article[] | null>("/api/articles?limit=200", {
          signal: controller.signal,
        });
        setArticles(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError((err as Error).message ?? "Failed to load articles.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticles();

    return () => controller.abort();
  }, []);

  return { articles, isLoading, error };
}

import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';

export interface PopularArticle {
  articleId: number;
  title: string;
  publisher: string;
  categoryName: string;
  imageUrl: string | null;
  publishedAt: string | null;
}

export function usePopularArticles(limit: number = 10) {
  const [articles, setArticles] = useState<PopularArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/articles/popular?limit=${limit}`);

      if (!response.ok) {
        throw new Error('인기 기사를 불러오지 못했습니다.');
      }

      const data = await response.json();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPopularArticles();

    // 5분마다 자동 새로고침
    const interval = setInterval(fetchPopularArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPopularArticles]);

  return {
    articles,
    isLoading,
    error,
    refetch: fetchPopularArticles,
  };
}

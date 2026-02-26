import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';

interface TrendingKeyword {
  keyword: string;
  count: number;
}

export function useTrendingKeywords(limit: number = 10) {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/keywords/trending?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('키워드 조회 실패');
      }

      const data = await response.json();
      setKeywords(data);
    } catch (err) {
      console.error('Failed to fetch trending keywords:', err);
      setError(err instanceof Error ? err.message : '키워드 조회 실패');
      setKeywords([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchKeywords();

    // 10분마다 자동 갱신
    const interval = setInterval(fetchKeywords, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchKeywords]);

  return { keywords, isLoading, error, refetch: fetchKeywords };
}

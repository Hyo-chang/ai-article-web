import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/services/AuthContext";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8080";

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // 북마크 ID 목록 가져오기
  const fetchBookmarkIds = useCallback(async () => {
    if (!user?.token) {
      setBookmarkedIds(new Set());
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mypage/bookmarks/ids`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookmarkedIds(new Set(data.articleIds || []));
      }
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token]);

  // 초기 로드
  useEffect(() => {
    fetchBookmarkIds();
  }, [fetchBookmarkIds]);

  // 북마크 토글
  const toggleBookmark = useCallback(
    async (articleId: number): Promise<boolean> => {
      if (!user?.token) {
        return false;
      }

      const isCurrentlyBookmarked = bookmarkedIds.has(articleId);

      try {
        if (isCurrentlyBookmarked) {
          // 북마크 삭제
          const response = await fetch(
            `${API_BASE_URL}/api/mypage/bookmarks/${articleId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );

          if (response.ok) {
            setBookmarkedIds((prev) => {
              const next = new Set(prev);
              next.delete(articleId);
              return next;
            });
            return false;
          }
        } else {
          // 북마크 추가
          const response = await fetch(`${API_BASE_URL}/api/mypage/bookmarks`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ articleId }),
          });

          if (response.ok) {
            setBookmarkedIds((prev) => new Set([...prev, articleId]));
            return true;
          }
        }
      } catch (error) {
        console.error("Failed to toggle bookmark:", error);
      }

      return isCurrentlyBookmarked;
    },
    [user?.token, bookmarkedIds]
  );

  // 북마크 여부 확인
  const isBookmarked = useCallback(
    (articleId: number): boolean => {
      return bookmarkedIds.has(articleId);
    },
    [bookmarkedIds]
  );

  return {
    bookmarkedIds,
    isLoading,
    isBookmarked,
    toggleBookmark,
    refetch: fetchBookmarkIds,
  };
}

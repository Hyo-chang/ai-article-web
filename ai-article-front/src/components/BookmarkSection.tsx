// src/components/BookmarkSection.tsx
import React from "react";
import { Heart, Trash2, Calendar, Tag } from "lucide-react";
import { cn } from "./ui/utils";

type BookmarkedArticle = {
  articleId: number;
  title: string;
  categoryName?: string;
  imageUrl?: string;
  publishedAt?: string;
};

interface BookmarkSectionProps {
  bookmarks: BookmarkedArticle[];
  isLoading: boolean;
  error: string | null;
  onRemove: (articleId: number) => void;
  onArticleClick: (articleId: number) => void;
}

const loadingPlaceholders = Array.from({ length: 3 });

export function BookmarkSection({
  bookmarks,
  isLoading,
  error,
  onRemove,
  onArticleClick,
}: BookmarkSectionProps) {
  return (
    <div className="mt-12 w-full">
      <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-gray-200">
        <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
        <span>북마크한 기사</span>
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {loadingPlaceholders.map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-4 rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="h-20 w-20 flex-shrink-0 rounded-md bg-gray-200" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-semibold">북마크를 불러오지 못했습니다.</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500">
          <p>북마크한 기사가 없습니다.</p>
          <p className="mt-2 text-sm">관심 있는 기사를 북마크에 추가해 보세요!</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookmarks.map((bookmark) => (
            <li
              key={bookmark.articleId}
              className="group flex items-start gap-4 rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md"
            >
              <div
                className="flex flex-1 cursor-pointer items-start gap-4"
                onClick={() => onArticleClick(bookmark.articleId)}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && onArticleClick(bookmark.articleId)
                }
                role="button"
                tabIndex={0}
              >
                {bookmark.imageUrl ? (
                  <img
                    src={bookmark.imageUrl}
                    alt={bookmark.title}
                    className="h-24 w-24 flex-shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                    <Heart size={24} />
                  </div>
                )}
                <div className="flex flex-col justify-between self-stretch">
                  <div>
                    <h3 className="mb-1.5 line-clamp-2 font-semibold text-gray-800 group-hover:text-blue-600">
                      {bookmark.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      {bookmark.categoryName && (
                        <span className="flex items-center gap-1">
                          <Tag size={12} /> {bookmark.categoryName}
                        </span>
                      )}
                      {bookmark.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(bookmark.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemove(bookmark.articleId)}
                className="flex-shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="북마크 삭제"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

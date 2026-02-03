import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Heart } from "lucide-react";
import type { Article } from "@/types/article";
import { cn } from "./ui/utils";

interface ArticleCardListProps {
  articles: Article[];
  isLoading?: boolean;
  error?: string | null;
  itemsPerPage?: number;
  onArticleClick?: (article: Article) => void;
  activeCategoryName?: string | null;
  activeKeyword?: string | null;
  preferredKeywords?: string[] | null;
  highlightedArticleIds?: Set<number>;
  searchInput?: string;
  searchQuery?: string;
  onSearchInputChange?: (value: string) => void;
  onSearchSubmit?: (event?: React.FormEvent<HTMLFormElement>) => void;
  // 북마크 관련 props
  bookmarkedIds?: Set<number>;
  onToggleBookmark?: (articleId: number) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 3;
const PAGE_GROUP_SIZE = 5;
const loadingPlaceholders = Array.from({ length: DEFAULT_ITEMS_PER_PAGE });

export function ArticleCardList({
  articles,
  isLoading = false,
  error = null,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  onArticleClick,
  activeCategoryName,
  activeKeyword,
  preferredKeywords,
  highlightedArticleIds,
  searchInput,
  searchQuery,
  onSearchInputChange,
  onSearchSubmit,
  bookmarkedIds,
  onToggleBookmark,
}: ArticleCardListProps) {
  const featuredArticles = useMemo(() => articles.slice(0, 3), [articles]);
  const remainingArticles = useMemo(() => articles.slice(3), [articles]);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [remainingArticles]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(remainingArticles.length / itemsPerPage)),
    [remainingArticles.length, itemsPerPage],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return remainingArticles.slice(start, start + itemsPerPage);
  }, [remainingArticles, currentPage, itemsPerPage]);

  const currentGroupStart = useMemo(
    () => Math.floor((currentPage - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1,
    [currentPage],
  );

  const currentGroupEnd = useMemo(
    () => Math.min(currentGroupStart + PAGE_GROUP_SIZE - 1, totalPages),
    [currentGroupStart, totalPages],
  );

  const hasNextGroup = currentGroupEnd < totalPages;
  const hasPrevGroup = currentGroupStart > 1;

  const highlightSet = highlightedArticleIds ?? new Set<number>();
  const hasPreferredKeywords = (preferredKeywords?.length ?? 0) > 0;

  const showSearchControls = Boolean(onSearchInputChange && onSearchSubmit);

  return (
    <section className="mx-auto mt-16 w-full max-w-6xl space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#a4adbb]">최신 기사</p>
          <h2 className="text-2xl font-semibold text-[#1f2937]">지금 주목받는 콘텐츠를 확인하세요</h2>
          {activeCategoryName && (
            <p className="mt-1 text-sm text-[#5b6472]">
              현재 선택된 카테고리:{" "}
              <span className="font-semibold text-[#1f2937]">{activeCategoryName}</span>
            </p>
          )}
          {activeKeyword && (
            <p className="text-sm text-[#5b6472]">
              선택된 키워드: <span className="font-semibold text-[#1f2937]">#{activeKeyword}</span>
            </p>
          )}
          {hasPreferredKeywords && (
            <p className="text-sm text-sky-700">
              내 저장 키워드 우선 노출:{" "}
              <span className="font-semibold text-sky-900">
                {preferredKeywords?.slice(0, 3).join(", ")}
                {preferredKeywords && preferredKeywords.length > 3 ? " …" : ""}
              </span>
            </p>
          )}
        </div>
        {showSearchControls && (
          <form
            onSubmit={onSearchSubmit}
            className="flex flex-col items-stretch gap-2 text-sm text-[#475569] sm:flex-row sm:items-end sm:justify-end"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#94a3b8]">Search</label>
              <input
                type="text"
                value={searchInput}
                onChange={(event) => onSearchInputChange?.(event.target.value)}
                placeholder="제목 검색"
                className="h-10 w-56 rounded-2xl border border-[#d3d9e5] bg-white px-3 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:border-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#c7d2fe]"
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-2xl bg-[#1f2937] px-4 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#111827]"
            >
              검색하기
            </button>
            {searchQuery && (
              <span className="text-right text-xs text-[#64748b] sm:ml-2 sm:text-sm">
                "{searchQuery}" 검색 중
              </span>
            )}
          </form>
        )}
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3.5">
          {loadingPlaceholders.map((_, index) => (
            <div
              key={index}
              className="flex w-full items-center gap-5 rounded-2xl border border-[#e2e6ef] bg-white p-5 shadow-[0_18px_38px_rgba(164,174,194,0.18)]"
            >
              <div className="h-[120px] w-[120px] flex-none animate-pulse rounded-2xl bg-gradient-to-br from-[#f1f4fa] via-[#e6eaf3] to-[#dfe3ed]" />
              <div className="flex flex-1 flex-col gap-3">
                <div className="h-6 w-2/3 animate-pulse rounded bg-[#e8ecf5]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#edf0f7]" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-[#edf0f7]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-red-200">
          <p className="font-semibold">기사를 불러오지 못했습니다.</p>
          <p className="text-sm text-red-200/80">{error}</p>
        </div>
      ) : featuredArticles.length === 0 && paginatedArticles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d6dbe7] bg-white/70 py-12 text-center text-[#8f98a8]">
          아직 표시할 기사가 없습니다.
        </div>
      ) : (
        <>
          {featuredArticles.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article) => {
                const isHighlighted = highlightSet.has(article.articleId);
                const articleImageUrl = article.imageUrl || article.image_url;
                return (
                  <div
                    key={`featured-${article.articleId}`}
                    role={onArticleClick ? "button" : undefined}
                    tabIndex={onArticleClick ? 0 : undefined}
                    onClick={() => onArticleClick?.(article)}
                    onKeyDown={(event) => {
                      if (!onArticleClick) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onArticleClick(article);
                      }
                    }}
                    className={cn(
                      "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#d1d5dc] bg-gradient-to-br from-[#f7f8fa] via-[#eef0f4] to-[#e2e7ed] text-[#1f2937] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7beca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f8]",
                      isHighlighted && "border-2 border-sky-300 shadow-[0_20px_40px_rgba(56,189,248,0.35)]",
                    )}
                  >
                    {isHighlighted && (
                      <span className="absolute left-4 top-4 rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                        내 키워드
                      </span>
                    )}
                    <div className="relative h-44 w-full overflow-hidden">
                      {articleImageUrl ? (
                        <img
                          src={articleImageUrl}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#d8dde5] text-sm font-semibold text-[#4a5260]">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-[#1a202c]">
                        {article.title}
                      </h3>

                      <div className="mt-auto flex items-center justify-between text-sm text-[#5b6472]">
                        <span className="font-medium text-[#394150]">AI Reader</span>
                        {onToggleBookmark && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleBookmark(article.articleId);
                            }}
                            className={cn(
                              "rounded-full border p-2 transition-colors",
                              bookmarkedIds?.has(article.articleId)
                                ? "border-rose-300 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                : "border-[#ccd1da] bg-white/80 text-[#4a5260] hover:bg-white hover:text-[#1f2937]"
                            )}
                            aria-label={bookmarkedIds?.has(article.articleId) ? "북마크 해제" : "북마크"}
                          >
                            <Heart
                              className={cn(
                                "h-4 w-4",
                                bookmarkedIds?.has(article.articleId) && "fill-current"
                              )}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-6">
            {paginatedArticles.map((article) => {
              const isHighlighted = highlightSet.has(article.articleId);
              const summary = article.content ? article.content.slice(0, 120) : "";
              const articleImageUrl = article.imageUrl || article.image_url;
              return (
                <article
                  key={article.articleId}
                  role={onArticleClick ? "button" : undefined}
                  tabIndex={onArticleClick ? 0 : undefined}
                  onClick={() => onArticleClick?.(article)}
                  onKeyDown={(event) => {
                    if (!onArticleClick) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onArticleClick(article);
                    }
                  }}
                  className={cn(
                    "group flex w-full items-center gap-5 transition-all hover:-translate-y-1",
                    onArticleClick
                      ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0d7e6] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      : "",
                    isHighlighted
                      ? "rounded-2xl border border-sky-200 bg-sky-50/60 px-4 py-4"
                      : "border-b border-[#1a1a1a] pb-6 hover:border-[#2a2a2a] last:border-b-0",
                  )}
                >
                  <div className="relative h-[120px] w-[120px] flex-none overflow-hidden rounded-2xl bg-[#f2f4f9]">
                    {articleImageUrl ? (
                      <img
                        src={articleImageUrl}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f1f4fa] via-[#e5e9f3] to-[#d9deeb] text-sm font-semibold text-[#5b6472]">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#9aa3b3]">
                      <span>{article.categoryName ?? "AI Reader"}</span>
                      <div className="flex items-center gap-2">
                        {isHighlighted && (
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-700">
                            내 키워드
                          </span>
                        )}
                        {onToggleBookmark && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleBookmark(article.articleId);
                            }}
                            className={cn(
                              "rounded-full border p-1.5 transition-colors",
                              bookmarkedIds?.has(article.articleId)
                                ? "border-rose-300 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                : "border-[#ccd1da] bg-white/80 text-[#4a5260] hover:bg-white hover:text-[#1f2937]"
                            )}
                            aria-label={bookmarkedIds?.has(article.articleId) ? "북마크 해제" : "북마크"}
                          >
                            <Heart
                              className={cn(
                                "h-3.5 w-3.5",
                                bookmarkedIds?.has(article.articleId) && "fill-current"
                              )}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="line-clamp-2 text-base font-semibold text-[#1f2937]">
                      {article.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#5b6472]">
                      {summary}
                      {article.content && article.content.length > 120 ? "…" : ""}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {remainingArticles.length > 0 && totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 text-sm font-medium text-[#6b7382]"
              aria-label="기사 페이지네이션"
            >
              {hasPrevGroup && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentGroupStart - PAGE_GROUP_SIZE))}
                  className="rounded-full border border-[#d6dae3] px-3 py-1 transition hover:border-[#b7beca]"
                >
                  이전
                </button>
              )}

              {Array.from({ length: currentGroupEnd - currentGroupStart + 1 }).map((_, index) => {
                const pageNumber = currentGroupStart + index;
                const isActive = pageNumber === currentPage;
                return (
                  <button
                    key={`page-${pageNumber}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={cn(
                      "rounded-full px-3 py-1 transition",
                      isActive
                        ? "bg-[#1f2937] text-white shadow-lg"
                        : "border border-transparent hover:border-[#cbd2de]",
                    )}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {hasNextGroup && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(currentGroupEnd + 1)}
                  className="rounded-full border border-[#d6dae3] px-3 py-1 transition hover:border-[#b7beca]"
                >
                  다음
                </button>
              )}
            </nav>
          )}
        </>
      )}
    </section>
  );
}

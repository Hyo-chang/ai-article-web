import React from "react";
import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";

type CategoryWithKeywords = {
  categoryId: string;
  categoryName: string;
  keywords: string[];
};

interface KeywordCategoriesProps {
  selectedCategoryId: string | null;
  selectedKeyword?: string | null;
  onCategorySelect?: (categoryId: string | null, categoryName: string | null) => void;
  onKeywordSelect?: (keyword: string | null) => void;
}

export function KeywordCategories({
  selectedCategoryId,
  selectedKeyword,
  onCategorySelect,
  onKeywordSelect,
}: KeywordCategoriesProps) {
  const [categories, setCategories] = useState<CategoryWithKeywords[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const data = await fetchJson<CategoryWithKeywords[] | null>(
          "/api/categories/with-trending-keywords",
          { signal: controller.signal }
        );
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(
            err instanceof Error
              ? err.message
              : "카테고리를 불러오는 중 오류가 발생했습니다."
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
    return () => controller.abort();
  }, []);

  const activeCategory = categories.find((cat) => cat.categoryId === selectedCategoryId);

  useEffect(() => {
    if (!selectedKeyword) return;
    if (!activeCategory || !activeCategory.keywords.includes(selectedKeyword)) {
      onKeywordSelect?.(null);
    }
  }, [activeCategory, onKeywordSelect, selectedKeyword]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white/90 p-4 shadow-[0_32px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:rounded-3xl sm:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-br from-blue-50/80 via-white to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-rose-50/70 via-white to-transparent" />
      </div>

      <div className="relative flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.30em] text-slate-400">
          Live Trend
        </p>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-3xl">키워드 카테고리</h2>
          {isLoading && <span className="text-xs text-slate-400">불러오는 중...</span>}
        </div>
        <p className="text-sm text-slate-500">
          분야별로 지금 가장 주목받는 키워드를 확인해 보세요.
        </p>
      </div>

      {error ? (
        <p className="relative mt-5 text-sm text-rose-500">{error}</p>
      ) : (
        <>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            {categories.map((category) => {
              const isActive = selectedCategoryId === category.categoryId;
              return (
                <button
                  key={category.categoryId}
                  type="button"
                  onClick={() => {
                    const nextId =
                      selectedCategoryId === category.categoryId ? null : category.categoryId;
                    onCategorySelect?.(nextId, nextId ? category.categoryName : null);
                    if (selectedKeyword) {
                      onKeywordSelect?.(null);
                    }
                  }}
                  className={`rounded-full border-2 px-5 py-2 text-sm font-medium transition duration-200 ${
                    isActive
                      ? "border-transparent bg-gradient-to-r from-sky-100 via-sky-50 to-indigo-200 text-slate-900 shadow ring-2 ring-sky-200"
                      : "border-[#e3e8f4] bg-white/90 text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-white hover:via-slate-50 hover:to-indigo-50 hover:border-[#c7d7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
                  }`}
                >
                  {category.categoryName}
                </button>
              );
            })}
            {categories.length === 0 && !isLoading && (
              <span className="text-sm text-slate-500">표시할 카테고리가 없습니다.</span>
            )}
          </div>

          {activeCategory && (
            <div className="relative mt-6 rounded-2xl border border-[#e6eaf5] bg-white/90 p-5">
              {activeCategory.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {[...new Set(activeCategory.keywords)].map((keyword) => {
                    const isKeywordActive = selectedKeyword === keyword;
                    return (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => onKeywordSelect?.(isKeywordActive ? null : keyword)}
                        className={`rounded-full px-3 py-1 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 ${
                          isKeywordActive
                            ? "bg-gradient-to-r from-sky-100 via-white to-indigo-100 text-slate-900 border border-transparent shadow-sm ring-1 ring-sky-200"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent"
                        }`}
                      >
                        #{keyword}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">
                    아직 트렌드 키워드가 없습니다.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    기사가 수집되면 자동으로 키워드가 표시됩니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

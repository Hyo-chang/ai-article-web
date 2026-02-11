// src/components/AnalyzedArticleSection.tsx
import React from "react";
import { Bot, Trash2, Calendar, Building2 } from "lucide-react";

type AnalyzedArticle = {
  id: number;
  title: string;
  summary: string;
  imageUrl?: string;
  publisher?: string;
  createdAt: string;
};

interface AnalyzedArticleSectionProps {
  articles: AnalyzedArticle[];
  isLoading: boolean;
  error: string | null;
  onRemove: (articleId: number) => void;
  onArticleClick: (articleId: number) => void;
}

const loadingPlaceholders = Array.from({ length: 3 });

export function AnalyzedArticleSection({
  articles,
  isLoading,
  error,
  onRemove,
  onArticleClick,
}: AnalyzedArticleSectionProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#15181f]/95 p-6 shadow-2xl shadow-black/40">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">AI Analysis</p>
        <h2 className="flex items-center gap-3 text-xl font-semibold text-white md:text-2xl">
          <Bot className="h-6 w-6 text-blue-400" />
          <span>내가 분석한 기사</span>
        </h2>
        <p className="mt-1 text-sm text-white/70">
          AI로 분석한 기사들을 다시 확인할 수 있습니다.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {loadingPlaceholders.map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center">
          <p className="font-semibold text-red-300">분석 기록을 불러오지 못했습니다.</p>
          <p className="text-sm text-red-300/80">{error}</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 py-12 text-center">
          <Bot className="mx-auto h-12 w-12 text-white/30" />
          <p className="mt-4 text-white/60">분석한 기사가 없습니다.</p>
          <p className="mt-2 text-sm text-white/40">홈에서 URL을 입력하여 기사를 분석해 보세요!</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {articles.map((article) => (
            <li
              key={article.id}
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-blue-400/50 hover:bg-white/10"
            >
              <div
                className="flex flex-1 cursor-pointer items-start gap-4"
                onClick={() => onArticleClick(article.id)}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && onArticleClick(article.id)
                }
                role="button"
                tabIndex={0}
              >
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-24 w-24 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/30">
                    <Bot size={32} />
                  </div>
                )}
                <div className="flex flex-col justify-between self-stretch min-w-0">
                  <div>
                    <h3 className="mb-1.5 line-clamp-2 font-semibold text-white group-hover:text-blue-400">
                      {article.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-white/60">
                      {article.summary}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                    {article.publisher && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} /> {article.publisher}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(article.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemove(article.id)}
                className="flex-shrink-0 rounded-full p-2 text-white/40 transition-colors hover:bg-red-500/20 hover:text-red-400"
                aria-label="분석 기록 삭제"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

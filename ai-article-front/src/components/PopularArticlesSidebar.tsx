import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, TrendingUp, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePopularArticles } from '@/hooks/usePopularArticles';

interface PopularArticlesSidebarProps {
  className?: string;
}

export function PopularArticlesSidebar({ className = '' }: PopularArticlesSidebarProps) {
  const navigate = useNavigate();
  const { articles, isLoading, refetch } = usePopularArticles(20);
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(articles.length / ITEMS_PER_PAGE);

  const handleArticleClick = (articleId: number) => {
    navigate(`/loading/${articleId}`);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const displayArticles = articles.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // 임시 급상승 키워드 (추후 API 연동)
  const trendingKeywords = ['AI', '경제', '부동산', '금리', '주식', '반도체'];

  return (
    <aside className={`hidden xl:block w-72 flex-shrink-0 ${className}`}>
      <div className="sticky top-20 space-y-4">
        {/* 인기 기사 섹션 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#15181f]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">인기 기사</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={articles.length <= ITEMS_PER_PAGE}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white"
                title="이전"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={articles.length <= ITEMS_PER_PAGE}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white"
                title="다음"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={refetch}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
                title="새로고침"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 출처 문구 */}
          <p className="mb-3 text-[10px] text-slate-400 dark:text-slate-500">
            네이버 뉴스 랭킹 기준
          </p>

          {isLoading && articles.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-white/10" />
                  <div className="mt-1 h-3 w-2/3 rounded bg-slate-100 dark:bg-white/5" />
                </div>
              ))}
            </div>
          ) : displayArticles.length > 0 ? (
            <>
              <ul className="space-y-3">
                {displayArticles.map((article, index) => (
                  <li key={article.articleId}>
                    <button
                      onClick={() => handleArticleClick(article.articleId)}
                      className="group flex w-full items-start gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-xs font-bold text-white">
                        {currentPage * ITEMS_PER_PAGE + index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                          {article.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {article.publisher || article.categoryName}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* 페이지 인디케이터 */}
              {totalPages > 1 && (
                <div className="mt-3 flex justify-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentPage
                          ? 'w-4 bg-orange-500'
                          : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-white/20 dark:hover:bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
              인기 기사가 없습니다
            </p>
          )}
        </div>

        {/* 급상승 키워드 섹션 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#15181f]">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">급상승 키워드</h3>
          </div>
          <p className="mb-3 text-[10px] text-slate-400 dark:text-slate-500">
            뉴스 키워드 기준
          </p>

          <div className="flex flex-wrap gap-2">
            {trendingKeywords.map((keyword) => (
              <span
                key={keyword}
                className="cursor-pointer rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useAuth } from '@/services/AuthContext';

interface AnalyzedArticle {
  id: number;
  title: string;
  body: string;
  summary: string;
  keywords: string[];
  keywordDefinitions: Record<string, string>;
  imageUrl: string;
  articleUrl: string;
  publisher: string;
  createdAt: string;
}

export default function AnalyzedArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<AnalyzedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user?.token) return;

    const fetchArticle = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/analyzed-article/${id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!res.ok) {
          throw new Error('기사를 불러올 수 없습니다.');
        }

        const data = await res.json();
        setArticle(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, user?.token]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#090a0c] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '기사를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/mypage')}
            className="text-blue-400 hover:underline"
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0c] text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090a0c]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate('/mypage')}
            className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            마이페이지
          </button>
          <span className="text-xs font-medium uppercase tracking-widest text-white/50">
            AI 분석 결과
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* 기사 정보 */}
        <div className="mb-8">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-64 object-cover rounded-2xl mb-6"
            />
          )}

          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-6">
            {article.publisher && (
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {article.publisher}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(article.createdAt)}
            </span>
            {article.articleUrl && (
              <a
                href={article.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                원문 보기
              </a>
            )}
          </div>
        </div>

        {/* AI 요약 */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🤖</span> AI 요약
          </h2>
          <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
            {article.summary}
          </p>
        </section>

        {/* 키워드 & 정의 */}
        {article.keywords && article.keywords.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔑</span> 핵심 키워드
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {article.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>

            {article.keywordDefinitions && Object.keys(article.keywordDefinitions).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/80">용어 설명</h3>
                {Object.entries(article.keywordDefinitions).map(([word, definition]) => (
                  <div key={word} className="border-l-2 border-blue-500/50 pl-4">
                    <span className="font-medium text-blue-300">{word}</span>
                    <p className="text-white/70 mt-1">{definition}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 본문 */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📰</span> 기사 본문
          </h2>
          <p className="text-white/70 whitespace-pre-wrap leading-relaxed">
            {article.body}
          </p>
        </section>
      </main>
    </div>
  );
}

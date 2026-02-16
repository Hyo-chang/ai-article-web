import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, Send, MessageCircle, X, Sparkles } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useAuth } from '@/services/AuthContext';

const API_URL = getApiBaseUrl();

interface AnalyzedArticle {
  id?: number;
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

interface LocationState {
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

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  snippet?: string | null;
};

function parseMarkdownBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <span key={index} className="font-bold text-blue-600">
          {boldText}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function AnalyzedArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [article, setArticle] = useState<AnalyzedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  // Chat states
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const questionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // router state로 전달된 데이터 확인 (비로그인 사용자용)
  const stateData = location.state as LocationState | null;

  useEffect(() => {
    // state로 데이터가 전달된 경우 (비로그인 사용자)
    if (stateData) {
      setArticle({
        title: stateData.title,
        body: stateData.body || "",
        summary: stateData.summary,
        keywords: stateData.keywords,
        keywordDefinitions: stateData.keywordDefinitions,
        imageUrl: stateData.imageUrl,
        articleUrl: stateData.articleUrl,
        publisher: stateData.publisher,
        createdAt: stateData.createdAt,
      });
      setLoading(false);
      return;
    }

    // API에서 데이터 가져오기 (로그인 사용자)
    if (!id || id === 'temp' || !user?.token) {
      setLoading(false);
      if (!stateData) {
        setError('분석 데이터를 찾을 수 없습니다.');
      }
      return;
    }

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
  }, [id, user?.token, stateData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setImageAspectRatio(naturalWidth / naturalHeight);
    }
  };

  // Chat functionality
  const submitQuestion = useCallback(
    async (content: string) => {
      if (!content || !article) return;

      const timestamp = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const userMessage: ChatMessage = {
        id: crypto.randomUUID?.() ?? `${Date.now()}`,
        role: 'user',
        content,
        timestamp,
      };

      setMessages((prev) => [...prev, userMessage]);
      setQuestion('');
      setIsSending(true);
      setChatError(null);

      // 기사 맥락 준비 (요약 + 본문)
      const articleContext = article.summary
        ? `[요약]\n${article.summary}\n\n[본문]\n${article.body}`
        : article.body;

      try {
        const response = await fetch(`${API_URL}/api/analysis/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            article_context: articleContext,
            question: content,
            snippet: null,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI 응답 오류 (${response.status})`);
        }

        const data = await response.json();
        const assistantContent = data?.answer?.trim() ?? 'AI 응답을 가져오지 못했습니다.';

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID?.() ?? `${Date.now()}-assistant`,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'AI 응답 중 문제가 발생했습니다.';
        setChatError(message);
      } finally {
        setIsSending(false);
      }
    },
    [article]
  );

  const handleSendQuestion = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    await submitQuestion(trimmed);
  }, [question, submitQuestion]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] px-4 py-10 dark:bg-[#0f1115]">
        <ArticlePageSkeleton />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] px-4 py-10 dark:bg-[#0f1115]">
        <EmptyState
          errorMessage={error || '기사를 찾을 수 없습니다.'}
          onBack={() => navigate('/home')}
        />
      </div>
    );
  }

  const summaryLines = article.summary
    ?.split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean) || [];

  const bodyParagraphs = article.body
    ?.split(/\r?\n\r?\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean) || [];

  const keywords = article.keywords || [];
  const definitions = article.keywordDefinitions || {};

  return (
    <div className="min-h-screen bg-[#f3f4f6] px-4 py-10 text-slate-900 dark:bg-[#0f1115] dark:text-white md:px-6 lg:px-8">
      <div className="mt-12 w-full flex justify-center">
        <div className="w-full max-w-[1600px] px-4 md:px-6 lg:px-10">
          {/* 헤더 */}
          <header className="space-y-3">
            <button
              onClick={() => navigate('/home')}
              className="mb-4 flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </button>
            <h1 className="text-left text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl lg:text-5xl">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
              {article.publisher && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {article.publisher}
                </span>
              )}
              <span className="opacity-50">•</span>
              <time className="tabular-nums">{formatDate(article.createdAt)}</time>
              {article.articleUrl && (
                <>
                  <span className="opacity-50">•</span>
                  <a
                    href={article.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    원문 보기
                  </a>
                </>
              )}
            </div>
          </header>

          {/* 본문 레이아웃 */}
          <div className="mt-6 grid w-full grid-cols-1 gap-6 md:grid-cols-[7.5fr_3.5fr] md:gap-8 lg:grid-cols-[7fr_3.2fr]">
            {/* 왼쪽: 요약 + 이미지 + 본문 */}
            <div className="min-w-0 flex flex-col space-y-6">
              {/* AI 요약 */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#15181f] md:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-gray-400">
                  AI SUMMARY
                </div>
                {summaryLines.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-lg leading-8 text-slate-700 dark:text-gray-300">
                    {summaryLines.map((line, index) => (
                      <li key={index}>{parseMarkdownBold(line)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">
                    요약 정보가 없습니다.
                  </p>
                )}
              </section>

              {/* 이미지 */}
              {article.imageUrl && (
                <div
                  className="relative w-full overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-[#1a1c20]"
                  style={{ aspectRatio: imageAspectRatio ?? 16 / 9 }}
                >
                  <img
                    src={article.imageUrl}
                    alt="기사 대표 이미지"
                    className="h-full w-full object-contain"
                    loading="lazy"
                    onLoad={handleImageLoad}
                  />
                </div>
              )}

              {/* 본문 */}
              <section className="rounded-2xl border border-slate-200 bg-white p-9 shadow-lg dark:border-white/10 dark:bg-[#15181f]">
                <div className="max-h-[70vh] overflow-y-auto pr-2 text-lg leading-8 text-slate-700 dark:text-gray-300">
                  {bodyParagraphs.length > 0 ? (
                    bodyParagraphs.map((paragraph, index) => (
                      <p key={index} className="mb-6 last:mb-0">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-gray-400">본문 내용이 없습니다.</p>
                  )}
                </div>
              </section>
            </div>

            {/* 오른쪽: 키워드 + 단어 해석 + AI 질문 */}
            <div className="min-w-0 flex flex-col gap-6 md:sticky md:top-24 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto md:pr-2 lg:top-28">
              {/* 핵심 키워드 */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#15181f] md:p-7">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white md:text-base">
                  핵심 키워드
                </h2>
                {keywords.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center rounded-full bg-slate-100 px-3.5 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-gray-300 dark:ring-white/20 md:text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">
                    키워드 정보가 없습니다.
                  </p>
                )}
              </section>

              {/* 단어 해석 */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#15181f] md:p-7">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white md:text-base">
                  단어 해석
                </h2>
                {Object.keys(definitions).length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2.5 md:gap-3.5">
                    {Object.entries(definitions).map(([word, meaning]) => (
                      <div key={word}>
                        <span className="font-semibold text-slate-900 dark:text-white">{word}</span>
                        <span className="ml-2 text-sm text-slate-600 dark:text-gray-400">{meaning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">
                    단어 해석 정보가 없습니다.
                  </p>
                )}
              </section>

            </div>
          </div>
        </div>
      </div>

      {/* 플로팅 AI 채팅 버튼 */}
      <button
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${
          isChatOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="AI에게 질문하기"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {/* 확장된 AI 채팅창 */}
      <div
        ref={chatContainerRef}
        className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 dark:border-white/10 dark:bg-[#15181f] ${
          isChatOpen
            ? 'h-[500px] w-[380px] scale-100 opacity-100 sm:h-[550px] sm:w-[420px]'
            : 'h-14 w-14 scale-0 opacity-0'
        }`}
      >
        {isChatOpen && (
          <>
            {/* 채팅창 헤더 */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI 어시스턴트</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">기사에 대해 무엇이든 물어보세요</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="채팅창 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-600/20">
                    <MessageCircle className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300">대화를 시작해보세요</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">
                    이 기사에 대해 궁금한 점을 물어보세요
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {messages.map((message) => (
                    <li
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                            : 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <span
                          className={`mt-1 block text-xs ${
                            message.role === 'user' ? 'text-white/70' : 'text-slate-500 dark:text-gray-500'
                          }`}
                        >
                          {message.timestamp}
                        </span>
                      </div>
                    </li>
                  ))}
                  {isSending && (
                    <li className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-white/10">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* 입력 영역 */}
            <div className="border-t border-slate-200 p-3 dark:border-white/10">
              {chatError && (
                <p className="mb-2 text-xs text-rose-500 dark:text-rose-400">{chatError}</p>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuestion();
                    }
                  }}
                  ref={questionInputRef}
                  rows={1}
                  placeholder="메시지를 입력하세요..."
                  className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-500"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendQuestion}
                  disabled={isSending || !question.trim()}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="보내기"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ errorMessage, onBack }: { errorMessage: string; onBack: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-slate-500 dark:text-gray-400">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white">기사를 불러오지 못했습니다</h2>
      <p className="text-sm text-slate-500 dark:text-gray-400">{errorMessage}</p>
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}

function ArticlePageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto mt-6 h-10 w-3/4 max-w-2xl rounded-full bg-slate-300/60 dark:bg-slate-700/60" />
      <div className="mt-12 w-full flex justify-center">
        <div className="w-full max-w-[1600px] px-4 md:px-6 lg:px-10">
          <div className="h-10 w-3/4 rounded-full bg-slate-300/60 dark:bg-slate-700/40" />
          <div className="mt-3 h-4 w-44 rounded-full bg-slate-300/60 dark:bg-slate-700/40" />
          <div className="mt-8 grid w-full grid-cols-1 gap-6 md:grid-cols-[7.5fr_3.5fr] md:gap-8 lg:grid-cols-[7fr_3.2fr]">
            <div className="flex flex-col space-y-6">
              <div className="h-32 rounded-xl bg-slate-300/40 dark:bg-slate-700/30" />
              <div className="h-60 rounded-2xl bg-slate-300/40 dark:bg-slate-700/30" />
              <div className="h-64 rounded-2xl bg-slate-300/40 dark:bg-slate-700/30" />
            </div>
            <div className="flex flex-col space-y-6">
              <div className="h-48 rounded-xl bg-slate-300/40 dark:bg-slate-700/30" />
              <div className="h-48 rounded-xl bg-slate-300/40 dark:bg-slate-700/30" />
              <div className="h-48 rounded-xl bg-slate-300/40 dark:bg-slate-700/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

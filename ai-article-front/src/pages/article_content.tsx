import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Send, Plus, Check, Heart } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useArticles } from '../hooks/useArticles';
import { useBookmarks } from '../hooks/useBookmarks';
import type { Article } from '@/types/article';
import { useAuth } from '@/services/AuthContext';

interface LocationStateShape {
    article?: Article;
}

type Keyword = {
    term: string;
    meaning: string;
};

type GlossaryEntry = {
    word: string;
    meaning: string;
};

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    snippet?: string | null;
};

type SelectionPopup = {
    text: string;
    top: number;
    left: number;
};

type ArticleSummaryResponsePayload = {
    summarize: string;
    keywords?: string[];
    keywordDefinitions?: Record<string, string>;
};

const API_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:8080';
const MAX_SNIPPET_PREVIEW_CHARS = 200;
const ARTICLE_SELECTION_STYLE_ID = 'article-selection-style';

function formatSnippetPreview(snippet?: string | null): string | null {
    if (!snippet) return null;
    if (snippet.length <= MAX_SNIPPET_PREVIEW_CHARS) return snippet;
    return `${snippet.slice(0, MAX_SNIPPET_PREVIEW_CHARS).trimEnd()}…`;
}

function normalizeDefinitionMap(definitions?: Record<string, string>): Record<string, string> {
    if (!definitions) return {};
    return Object.entries(definitions).reduce((acc, [word, meaning]) => {
        const normalizedWord = (word ?? '').trim();
        const normalizedMeaning = (meaning ?? '').trim();
        if (normalizedWord && normalizedMeaning) {
            acc[normalizedWord] = normalizedMeaning;
        }
        return acc;
    }, {} as Record<string, string>);
}

export default function ArticleDetailPage() {
    const navigate = useNavigate();
    const { articleId } = useParams<{ articleId: string }>();
    const location = useLocation();
    const locationState = (location.state as LocationStateShape | null) ?? undefined;
    const articleFromState = locationState?.article;

    const { articles, isLoading, error } = useArticles();
    const { user } = useAuth();
    const { isBookmarked, toggleBookmark } = useBookmarks();

    const articleIdNumber = articleId ? Number(articleId) : NaN;
    const isArticleIdValid = Number.isInteger(articleIdNumber) && articleIdNumber >= 0;

    const articleFromList = useMemo(() => {
        if (!isArticleIdValid) return null;
        return articles.find((item) => item.articleId === articleIdNumber) ?? null;
    }, [articles, articleIdNumber, isArticleIdValid]);

    const resolvedArticle = articleFromState ?? articleFromList ?? null;

    const isArticleLoading = !articleFromState && isLoading;
    const [loading, setLoading] = useState(isArticleLoading);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [selectionPopup, setSelectionPopup] = useState<SelectionPopup | null>(null);
    const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
    const [aiSummary, setAiSummary] = useState<string[] | null>(null);
    const [aiKeywords, setAiKeywords] = useState<Keyword[] | null>(null);
    const [aiGlossary, setAiGlossary] = useState<GlossaryEntry[] | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const articleBodyRef = useRef<HTMLDivElement | null>(null);
    const questionInputRef = useRef<HTMLTextAreaElement | null>(null);
    const recordedHistoryRef = useRef<Set<string>>(new Set());
    const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

    useEffect(() => {
        if (!user?.userId || !user.token) return;
        if (!isArticleIdValid || !resolvedArticle) return;

        const historyKey = `${user.userId}-${articleIdNumber}`;
        if (recordedHistoryRef.current.has(historyKey)) return;

        const controller = new AbortController();

        async function recordReadHistory() {
            try {
                const response = await fetch(`${API_URL}/api/mypage/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                    body: JSON.stringify({ articleId: articleIdNumber }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const message = await response.text().catch(() => null);
                    throw new Error(message || 'Failed to record read history');
                }

                recordedHistoryRef.current.add(historyKey);
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('[ReadHistory] 기록 저장 실패:', err);
            }
        }

        recordReadHistory();
        return () => controller.abort();
    }, [articleIdNumber, isArticleIdValid, resolvedArticle, user?.token, user?.userId]);

    useEffect(() => {
        if (isArticleLoading) {
            setLoading(true);
            return;
        }
        const timer = setTimeout(() => setLoading(false), 200);
        return () => clearTimeout(timer);
    }, [isArticleLoading]);

    useEffect(() => {
        if (document.getElementById(ARTICLE_SELECTION_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = ARTICLE_SELECTION_STYLE_ID;
        style.textContent = `
      .article-body ::selection {
        background-color: rgba(100, 116, 139, 0.35);
        color: #1f2937;
      }
    `;
        document.head.appendChild(style);
        return () => {
            style.remove();
        };
    }, []);

    useEffect(() => {
        if (!isArticleIdValid) return;
        const controller = new AbortController();

        async function fetchSummary() {
            try {
                setSummaryLoading(true);
                setSummaryError(null);

                const response = await fetch(`${API_URL}/api/article/${articleIdNumber}`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`요약 요청 실패 (${response.status})`);
                }

                const payload: ArticleSummaryResponsePayload = await response.json();
                const summaryText: string = payload?.summarize ?? '';
                const parsedSummary =
                    summaryText
                        .split(/\n+/)
                        .map((line) => line.trim())
                        .filter(Boolean) || [];

                setAiSummary(parsedSummary.length > 0 ? parsedSummary : null);

                const definitionMap = normalizeDefinitionMap(payload.keywordDefinitions);
                const keywordTerms = Array.isArray(payload.keywords) ? payload.keywords : [];
                const normalizedKeywords: Keyword[] = keywordTerms
                    .map((term) => (term ?? '').trim())
                    .filter((term) => term.length > 0)
                    .slice(0, 5)
                    .map((term) => ({
                        term,
                        meaning: definitionMap[term] ?? '',
                    }));

                setAiKeywords(normalizedKeywords.length > 0 ? normalizedKeywords : null);

                const glossaryEntries: GlossaryEntry[] = Object.entries(definitionMap).map(([word, meaning]) => ({
                    word,
                    meaning,
                }));
                setAiGlossary(glossaryEntries.length > 0 ? glossaryEntries : null);
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
                console.error('Failed to fetch AI summary', err);
                setSummaryError((err as Error).message ?? '요약을 불러오지 못했습니다.');
                setAiSummary(null);
                setAiKeywords(null);
                setAiGlossary(null);
            } finally {
                setSummaryLoading(false);
            }
        }

        fetchSummary();
        return () => controller.abort();
    }, [articleIdNumber, isArticleIdValid]);

    const sampleArticle = useMemo(
        () => ({
            title: '생성형 AI, 뉴스 소비를 바꾼다: 개인화 요약과 대화형 분석이 만든 새로운 읽기 경험',
            publisher: 'AI Daily',
            publishedAt: '2025-10-24 09:30',
            url: 'https://news.example.com/ai-reader/feature',
            readingTime: '7분 소요',
            body: SAMPLE_BODY,
            image: null,
            keywords: SAMPLE_KEYWORDS,
            glossary: SAMPLE_GLOSSARY,
            related: SAMPLE_RELATED,
            summary: SAMPLE_SUMMARY,
        }),
        []
    );

    const articleDetail = useMemo(() => {
        if (!resolvedArticle) return null;

        const parsedBody =
            resolvedArticle.content
                ?.split(/\r?\n\r?\n|\r?\n/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean) ?? [];

        const resolvedSummary =
            (aiSummary && aiSummary.length > 0 && aiSummary) ||
            (Array.isArray(resolvedArticle.summary) && resolvedArticle.summary.length > 0
                ? resolvedArticle.summary
                : []);

        const resolvedKeywords: Keyword[] =
            (aiKeywords && aiKeywords.length > 0 && aiKeywords) ||
            (Array.isArray(resolvedArticle.keywords) && resolvedArticle.keywords.length > 0
                ? resolvedArticle.keywords
                : []);

        const resolvedGlossary =
            (aiGlossary && aiGlossary.length > 0 && aiGlossary) ||
            (Array.isArray(resolvedArticle.glossary) && resolvedArticle.glossary.length > 0
                ? resolvedArticle.glossary
                : []);

        // imageUrl (camelCase) 또는 image_url (snake_case) 둘 다 확인
        const articleImage = resolvedArticle.imageUrl || resolvedArticle.image_url || sampleArticle.image;

        return {
            ...sampleArticle,
            title: resolvedArticle.title || sampleArticle.title,
            body: parsedBody.length > 0 ? parsedBody : sampleArticle.body,
            image: articleImage,
            publisher: resolvedArticle.publisher || sampleArticle.publisher,
            publishedAt: resolvedArticle.publishedAt || resolvedArticle.published_at || sampleArticle.publishedAt,
            readingTime: resolvedArticle.readingTime || sampleArticle.readingTime,
            summary: resolvedSummary,
            keywords: resolvedKeywords,
            glossary: resolvedGlossary,
        };
    }, [resolvedArticle, sampleArticle, aiSummary, aiKeywords, aiGlossary]);

    const articleBodyText = useMemo(() => {
        if (!articleDetail) return '';
        return articleDetail.body.join('\n\n');
    }, [articleDetail]);

    useEffect(() => {
        setImageAspectRatio(null);
    }, [articleDetail?.image]);

    const handleArticleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth > 0 && naturalHeight > 0) {
            setImageAspectRatio(naturalWidth / naturalHeight);
        }
    }, []);

    const submitQuestion = useCallback(
        async (content: string, snippet?: string) => {
            if (!content || !articleDetail) return;

            const timestamp = new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
            });
            const userMessage: ChatMessage = {
                id: crypto.randomUUID?.() ?? `${Date.now()}`,
                role: 'user',
                content,
                timestamp,
                snippet,
            };

            setMessages((prev) => [...prev, userMessage]);
            setQuestion('');
            setIsSending(true);
            setChatError(null);

            // 기사 맥락 준비 (요약 + 본문)
            const articleContext = articleDetail.summary
                ? `[요약]\n${articleDetail.summary}\n\n[본문]\n${articleBodyText}`
                : articleBodyText;
            try {
                const response = await fetch(`${API_URL}/api/analysis/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        article_context: articleContext,
                        question: content,
                        snippet: snippet || null,
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
        [articleBodyText, articleDetail]
    );

    const handleSendQuestion = useCallback(async () => {
        const trimmed = question.trim();
        if (!trimmed) return;
        await submitQuestion(trimmed, selectedSnippet ?? undefined);
        setSelectedSnippet(null);
    }, [question, selectedSnippet, submitQuestion]);

    const handleApplySnippetToInput = useCallback(() => {
        if (!selectedSnippet) return;
        setQuestion((prev) => {
            if (!prev) return selectedSnippet;
            return `${prev}\n${selectedSnippet}`;
        });
        setSelectedSnippet(null);
        requestAnimationFrame(() => {
            questionInputRef.current?.focus();
        });
    }, [selectedSnippet]);

    const handleSelectionMouseUp = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setSelectionPopup(null);
            return;
        }
        const text = selection.toString().trim();
        if (!text || text.length < 3) {
            setSelectionPopup(null);
            return;
        }
        try {
            const range = selection.getRangeAt(0).cloneRange();
            const rect = range.getBoundingClientRect();
            setSelectionPopup({
                text,
                top: rect.bottom + 8,
                left: rect.left,
            });
        } catch {
            setSelectionPopup(null);
        }
    }, []);

    const handleAskSelection = useCallback(() => {
        if (!selectionPopup) return;
        setSelectedSnippet(selectionPopup.text);
        setQuestion('');
        setSelectionPopup(null);
        requestAnimationFrame(() => {
            questionInputRef.current?.focus();
        });
    }, [selectionPopup]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectionPopup(null);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div className="min-h-screen bg-[#f3f4f6] px-4 py-10 text-slate-900 dark:bg-[#0f1115] dark:text-white md:px-6 lg:px-8">
            {loading ? (
                <ArticlePageSkeleton />
            ) : articleDetail ? (
                <>
                    <div className="mt-12 w-full flex justify-center">
                        <div className="w-full max-w-[1600px] px-4 md:px-6 lg:px-10">
                            <header className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                    <h1 className="text-left text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                                        {articleDetail.title}
                                    </h1>
                                    {user && isArticleIdValid && (
                                        <button
                                            type="button"
                                            onClick={() => toggleBookmark(articleIdNumber)}
                                            className={`flex-shrink-0 rounded-full border p-3 transition-colors ${
                                                isBookmarked(articleIdNumber)
                                                    ? 'border-rose-300 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:border-rose-400/50 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30'
                                                    : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:border-white/20 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20 dark:hover:text-white'
                                            }`}
                                            aria-label={isBookmarked(articleIdNumber) ? '북마크 해제' : '북마크'}
                                        >
                                            <Heart
                                                className={`h-6 w-6 ${isBookmarked(articleIdNumber) ? 'fill-current' : ''}`}
                                            />
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                    {articleDetail.publisher && <span>{articleDetail.publisher}</span>}
                                    {articleDetail.publishedAt && (
                                        <>
                                            <span className="opacity-50">•</span>
                                            <time className="tabular-nums">{articleDetail.publishedAt}</time>
                                        </>
                                    )}
                                    {articleDetail.readingTime && (
                                        <>
                                            <span className="opacity-50">•</span>
                                            <span>{articleDetail.readingTime}</span>
                                        </>
                                    )}
                                </div>
                            </header>

                            <div className="mt-6 grid w-full grid-cols-1 gap-6 md:grid-cols-[7.5fr_3.5fr] md:gap-8 lg:grid-cols-[7fr_3.2fr]">
                                <div className="min-w-0 flex flex-col space-y-6">
                                    <div onMouseUp={handleSelectionMouseUp}>
                                        <ArticleSummary
                                            summary={articleDetail.summary}
                                            isLoading={summaryLoading}
                                            error={summaryError}
                                        />
                                    </div>
                                    {articleDetail.image && (
                                        <div
                                            className="relative w-full overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-[#1a1c20]"
                                            style={{ aspectRatio: imageAspectRatio ?? 16 / 9 }}
                                        >
                                            <img
                                                src={articleDetail.image}
                                                alt="기사 대표 이미지"
                                                className="h-full w-full object-contain"
                                                loading="lazy"
                                                onLoad={handleArticleImageLoad}
                                            />
                                        </div>
                                    )}
                                    <section className="rounded-2xl border border-slate-200 bg-white p-9 shadow-lg dark:border-white/10 dark:bg-[#15181f]">
                                        <div
                                            ref={articleBodyRef}
                                            onMouseUp={handleSelectionMouseUp}
                                            className="article-body max-h-[70vh] overflow-y-auto pr-2 text-lg leading-8 text-slate-700 dark:text-gray-300"
                                        >
                                            {articleDetail.body.map((paragraph, index) => (
                                                <p key={index} className="mb-6 last:mb-0">
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                <div className="min-w-0 flex flex-col gap-6 md:sticky md:top-24 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto md:pr-2 lg:top-28">
                                    <KeywordSection keywords={articleDetail.keywords} />
                                    <GlossarySection glossary={articleDetail.glossary} />
                                    <ChatSection
                                        question={question}
                                        onQuestionChange={setQuestion}
                                        onSend={handleSendQuestion}
                                        messages={messages}
                                        isLoading={isSending}
                                        errorMessage={chatError}
                                        selectedSnippet={selectedSnippet}
                                        onApplySnippet={handleApplySnippetToInput}
                                        onClearSnippet={() => setSelectedSnippet(null)}
                                        inputRef={questionInputRef}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {selectionPopup && (
                        <button
                            type="button"
                            onClick={handleAskSelection}
                            className="fixed z-50 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                            style={{ top: selectionPopup.top, left: selectionPopup.left }}
                        >
                            💬 AI에게 질문하기
                        </button>
                    )}
                </>
            ) : (
                <EmptyState
                    errorMessage={
                        error
                            ? `오류가 발생했습니다: ${error}`
                            : isArticleIdValid
                            ? '선택한 기사 정보를 찾지 못했습니다.'
                            : '잘못된 주소로 접근하셨습니다.'
                    }
                    onBack={() => navigate('/home')}
                />
            )}
        </div>
    );
}

/**
 * 마크다운 볼드(**텍스트**)를 파싱하여 React 엘리먼트로 변환
 */
function parseMarkdownBold(text: string): React.ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
                <span
                    key={index}
                    className="font-bold text-blue-600"
                >
                    {boldText}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
}

function ArticleSummary({
    summary,
    isLoading,
    error,
}: {
    summary: string[];
    isLoading: boolean;
    error: string | null;
}) {
    const lines = Array.isArray(summary) ? summary : [];
    const hasSummary = lines.length > 0;
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#15181f] md:p-6">
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-gray-400">AI SUMMARY</div>
                <div className="text-xs text-slate-400 dark:text-gray-500">
                    <span className="hidden sm:inline">텍스트를 드래그하여 AI에게 질문할 수 있어요</span>
                    <span className="sm:hidden">드래그하여 AI 질문</span>
                </div>
            </div>
            {isLoading && <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">AI 요약을 불러오는 중입니다...</p>}
            {error && !isLoading && <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</p>}
            {!isLoading && !error && hasSummary && (
                <ul className="mt-3 space-y-2 text-lg leading-8 text-slate-700 dark:text-gray-300">
                    {lines.map((line, index) => (
                        <li key={index}>{parseMarkdownBold(line)}</li>
                    ))}
                </ul>
            )}
            {!isLoading && !error && !hasSummary && (
                <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">현재 요약된 기사 내용이 없습니다.</p>
            )}
        </section>
    );
}

function KeywordSection({ keywords }: { keywords: Keyword[] }) {
    const { user } = useAuth();
    const items = Array.isArray(keywords) ? keywords : [];
    const hasKeywords = items.length > 0;
    const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState<string | null>(null);

    const storageKey = user?.userId ? `preferredKeywords:${user.userId}` : null;

    // 이미 저장된 관심 키워드 로드
    useEffect(() => {
        if (!storageKey) return;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setAddedKeywords(new Set(parsed));
                }
            } catch (e) {
                console.warn('Failed to parse stored keywords:', e);
            }
        }
    }, [storageKey]);

    const handleAddKeyword = async (term: string) => {
        if (!user?.token || !storageKey) {
            alert('로그인 후 이용할 수 있습니다.');
            return;
        }

        if (addedKeywords.has(term)) {
            return; // 이미 추가됨
        }

        try {
            setIsAdding(term);

            // 기존 관심 키워드 가져오기
            const stored = localStorage.getItem(storageKey);
            let currentKeywords: string[] = [];
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        currentKeywords = parsed;
                    }
                } catch (e) {
                    console.warn('Failed to parse stored keywords:', e);
                }
            }

            // 이미 있으면 추가 안함
            if (currentKeywords.includes(term)) {
                setAddedKeywords(prev => new Set([...prev, term]));
                return;
            }

            // 최대 4개 제한
            if (currentKeywords.length >= 4) {
                alert('관심 키워드는 최대 4개까지 등록할 수 있습니다.');
                return;
            }

            const newKeywords = [...currentKeywords, term];

            // 백엔드에 저장
            const response = await fetch(`${API_URL}/api/mypage/interests`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({ categories: newKeywords }),
            });

            if (!response.ok) {
                throw new Error('관심 키워드 저장에 실패했습니다.');
            }

            // localStorage 업데이트
            localStorage.setItem(storageKey, JSON.stringify(newKeywords));
            setAddedKeywords(prev => new Set([...prev, term]));
            window.dispatchEvent(new Event('preferredKeywordsUpdated'));
        } catch (error) {
            console.error('Failed to add keyword:', error);
            alert(error instanceof Error ? error.message : '키워드 추가에 실패했습니다.');
        } finally {
            setIsAdding(null);
        }
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#15181f] md:p-7">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white md:text-base">핵심 키워드</h2>
                {user && <span className="text-xs text-slate-400 dark:text-gray-500">클릭하여 관심 키워드 등록</span>}
            </div>
            {hasKeywords ? (
                <div className="mt-4 flex flex-wrap gap-2.5">
                    {items.map((keyword) => {
                        const isAdded = addedKeywords.has(keyword.term);
                        const isCurrentlyAdding = isAdding === keyword.term;
                        return (
                            <button
                                key={keyword.term}
                                type="button"
                                onClick={() => handleAddKeyword(keyword.term)}
                                disabled={isAdded || isCurrentlyAdding || !user}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs md:text-sm transition ${
                                    isAdded
                                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-500/40'
                                        : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200 dark:bg-white/10 dark:text-gray-300 dark:ring-white/20 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 dark:hover:ring-blue-500/40'
                                } ${!user ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {keyword.term}
                                {user && (
                                    isAdded ? (
                                        <Check className="h-3 w-3" />
                                    ) : isCurrentlyAdding ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Plus className="h-3 w-3" />
                                    )
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">현재 해당되는 키워드를 찾을 수 없습니다.</p>
            )}
        </section>
    );
}

function GlossarySection({ glossary }: { glossary: GlossaryEntry[] }) {
    const entries = Array.isArray(glossary) ? glossary : [];
    const hasEntries = entries.length > 0;

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#15181f] md:p-7">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white md:text-base">단어 해석</h2>
            {hasEntries ? (
                <div className="mt-4 flex flex-col gap-2.5 md:gap-3.5">
                    {entries.map((entry) => (
                        <div key={entry.word}>
                            <span className="font-semibold text-slate-900 dark:text-white">{entry.word}</span>
                            <span className="ml-2 text-sm text-slate-600 dark:text-gray-400">{entry.meaning}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">현재 기사에 해당하는 단어를 찾을 수 없습니다.</p>
            )}
        </section>
    );
}

interface ChatSectionProps {
    question: string;
    onQuestionChange: (value: string) => void;
    onSend: () => void;
    messages: ChatMessage[];
    isLoading: boolean;
    errorMessage?: string | null;
    selectedSnippet?: string | null;
    onApplySnippet: () => void;
    onClearSnippet: () => void;
    inputRef?: React.RefObject<HTMLTextAreaElement>;
    className?: string;
}

function ChatSection({
    question,
    onQuestionChange,
    onSend,
    messages,
    isLoading,
    errorMessage,
    selectedSnippet,
    onApplySnippet,
    onClearSnippet,
    inputRef,
    className,
}: ChatSectionProps) {
    const snippetPreview = formatSnippetPreview(selectedSnippet);

    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
        onQuestionChange(event.target.value);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSend();
        }
    };

    return (
        <section
            className={`flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#15181f] md:p-7 ${
                className ?? ''
            }`.trim()}
        >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">AI에게 질문하기</h2>

            <div className="mt-4 flex flex-col gap-3">
                <div className="max-h-[280px] min-h-[220px] overflow-y-auto rounded-xl bg-slate-50/90 p-4 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                    {messages.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-gray-400">아직 대화한 내용이 없습니다. 첫 질문을 남겨보세요.</p>
                    ) : (
                        <ul className="space-y-3">
                            {messages.map((message) => (
                                <li
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-6 shadow-sm ${
                                            message.role === 'user'
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                                                : 'bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-[#1a1c20] dark:text-gray-200 dark:ring-white/10'
                                        }`}
                                    >
                                        {formatSnippetPreview(message.snippet) && (
                                            <div className="mb-2 rounded bg-slate-100 p-2 text-xs text-slate-700 dark:bg-white/10 dark:text-gray-300">
                                                {formatSnippetPreview(message.snippet)}
                                            </div>
                                        )}
                                        <p>{message.content}</p>
                                        <span
                                            className={`mt-1 block text-xs ${
                                                message.role === 'user' ? 'text-slate-200/70 dark:text-black/50' : 'text-slate-500 dark:text-gray-500'
                                            }`}
                                        >
                                            {message.timestamp}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {isLoading && <p className="mt-3 text-center text-xs text-slate-500 dark:text-gray-400">AI가 생각 중입니다...</p>}
                </div>

                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">새로운 질문</label>
                {snippetPreview && (
                    <div className="mb-0 flex items-center gap-2 rounded-t-lg rounded-b-none border border-slate-200 border-b-0 bg-slate-100 px-3 py-1.5 text-sm text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
                        <button
                            type="button"
                            onClick={onApplySnippet}
                            aria-label="선택한 문장을 입력창으로 이동"
                            className="rounded border border-slate-300 px-2 py-1 text-base text-slate-700 shadow-sm transition hover:text-slate-900 dark:border-white/20 dark:text-gray-300 dark:hover:text-white"
                        >
                            ↳
                        </button>
                        <p className="flex-1 truncate font-medium text-slate-800 dark:text-gray-200">"{snippetPreview}"</p>
                        <button
                            type="button"
                            onClick={onClearSnippet}
                            aria-label="선택한 문장 취소"
                            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-500 shadow-sm transition hover:text-slate-900 dark:border-white/20 dark:text-gray-400 dark:hover:text-white"
                        >
                            ×
                        </button>
                    </div>
                )}
                <div className={`relative w-full ${snippetPreview ? '' : 'mt-1'}`}>
                    <span className="pointer-events-none absolute left-3 top-3 text-lg text-slate-400 dark:text-gray-500">+</span>
                    <textarea
                        value={question}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                        rows={4}
                        placeholder="무엇이든 물어보세요"
                        className={`w-full resize-none border border-slate-200 bg-white px-8 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#1a1c20] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-white/30 ${
                            snippetPreview ? 'rounded-b-xl rounded-t-none border-t-0' : 'rounded-xl'
                        }`}
                    />
                </div>
                {errorMessage && <p className="text-xs text-rose-500 dark:text-rose-400">{errorMessage}</p>}
                <button
                    type="button"
                    onClick={onSend}
                    disabled={isLoading || !question.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                    <Send size={16} />
                    {isLoading ? '전송 중...' : '보내기'}
                </button>
            </div>
        </section>
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
            <div className="mx-auto h-8 w-48 rounded-full bg-slate-300/60 dark:bg-slate-700/60" />
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

const SAMPLE_SUMMARY = [
    '기사의 핵심은 생성형 AI가 뉴스 소비 전 과정을 개인화하고 있다는 점입니다.',
    '요약·핵심문장 추출·질의응답이 통합되며 ‘읽기→이해→토론’ 흐름이 빨라집니다.',
    '개인화 추천과 신뢰도 표시 등 품질 장치가 함께 발전하고 있습니다.',
    '프라이버시와 저작권 이슈를 고려한 투명한 데이터 사용이 중요합니다.',
];

const SAMPLE_KEYWORDS: Keyword[] = [
    {
        term: '추출요약',
        meaning: '원문에서 핵심 문장만 골라 간결하게 제시하는 요약 방식',
    },
    {
        term: '생성요약',
        meaning: '모델이 문서를 이해하고 새로운 서술로 요약문을 생성하는 방식',
    },
    {
        term: '사이드카 패널',
        meaning: '본문 옆에서 맥락 정보와 도구를 제공하는 보조 패널 UI',
    },
    {
        term: '프롬프트 엔지니어링',
        meaning: '모델이 원하는 출력을 내도록 입력을 설계·튜닝하는 기술',
    },
    {
        term: '사실성 점수',
        meaning: '응답 내 근거의 신뢰도를 수치로 보여주는 기준',
    },
];

const SAMPLE_GLOSSARY: GlossaryEntry[] = [
    {
        word: 'RAG',
        meaning: '검색 증강 생성; 문서 검색과 생성형 모델을 결합한 방식',
    },
    {
        word: 'Hallucination',
        meaning: '근거 없이 모델이 그럴듯한 정보를 만들어내는 현상',
    },
    {
        word: 'Grounding',
        meaning: '출력의 근거를 출처와 연결해 검증 가능하게 만드는 절차',
    },
];

const SAMPLE_RELATED = [
    {
        id: 'r1',
        title: '뉴스 요약에 특화된 모델, 실제 서비스 벤치마크 공개',
        publisher: 'Tech Insight',
        publishedAt: '2025-10-22',
        url: 'https://news.example.com/benchmark',
    },
    {
        id: 'r2',
        title: 'RAG로 강화한 미디어 리더의 아키텍처 살펴보기',
        publisher: 'DevLog',
        publishedAt: '2025-10-18',
        url: 'https://dev.example.com/rag-architecture',
    },
    {
        id: 'r3',
        title: '페르소나 기반 추천과 윤리적 고려사항',
        publisher: 'AI Ethics Weekly',
        publishedAt: '2025-10-12',
        url: 'https://ethics.example.com/persona-reco',
    },
];

const SAMPLE_BODY: string[] = [
    '생성형 AI의 도입은 뉴스 읽기의 리듬을 바꿉니다. 사용자는 더 이상 제목과 첫 단락만 훑어보고 떠나지 않습니다. 대신 개인화된 요약과, 궁금한 점을 즉시 물을 수 있는 대화형 패널이 함께 제공되면서 기사에 더 오래 머물게 됩니다.',
    'AI Reader는 홈의 보라+핑크 그라데이션 무드를 상세 화면까지 확장합니다. 글래스 모피즘 카드와 섬세한 라인 아이콘, 여백이 살아 있는 타이포그래피는 ‘세련되고 절제된 AI 감성’을 전달합니다.',
    '오른쪽 패널은 사이드카처럼 동행합니다. 요약·키워드·단어 해석·관련 기사 섹션은 자연스러운 간격으로 구분되고, 각 요소는 독립적으로 상호작용합니다. 키워드 칩을 호버하면 의미 툴팁이 부드럽게 떠오르며, 관련 기사는 새 탭으로 연결됩니다.',
    '스크롤은 좌우가 완전히 독립적입니다. 긴 본문을 읽는 동안에도 우측 하단의 질문 입력창은 항상 고정(sticky)되어 있어, 읽다가 바로 AI에게 물어볼 수 있습니다.',
    '마지막으로, 신뢰 가능한 인용과 투명한 출처 표시가 중요합니다. 서비스는 요약의 근거를 보여주고, 사용자 제어 가능한 개인정보 설정을 통해 책임 있는 개인화를 제공합니다.',
];

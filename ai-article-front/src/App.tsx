import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Header } from "./components/Header";
import { KeywordCategories } from "./components/KeywordCategories";
import { ArticleInput } from "./components/ArticleInput";
import { AnalysisResult } from "./components/AnalysisResult";
import { ArticleHistory } from "./components/ArticleHistory";
import { ArticleCardList } from "./components/ArticleCardList";
import { ReadHistoryTab } from "./components/ReadHistoryTab";
import Content from "./pages/article_content";
import MyPage from "./pages/MyPage";
import ExperiencePage from "./pages/ExperiencePage";
import LoadingPage from "./pages/LoadingPage";
import { Tabs, TabsContent } from "./components/ui/tabs";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";

import { useArticles } from "./hooks/useArticles";
import { useBookmarks } from "./hooks/useBookmarks";
import { AuthProvider, useAuth } from "./services/AuthContext";
import type { Article } from "./types/article";

interface ImportantWord {
  word: string;
  frequency: number;
  importance: "high" | "medium" | "low";
  context: string;
}

interface AnalysisData {
  title: string;
  summary: string;
  fullText: string;
  keyPoints: string[];
  keywords: string[];
  importantWords: ImportantWord[];
  readingTime: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  sentiment: "positive" | "neutral" | "negative";
}

interface ManualCrawlResponse {
  success: boolean;
  exitCode: number;
  log: string;
}

type HomeTab = "home" | "analyze" | "history" | "result";

const AMBIENT_BACKGROUND =
  "bg-[radial-gradient(1200px_720px_at_12%_-5%,rgba(255,255,255,0.9),transparent),radial-gradient(1000px_640px_at_88%_0%,rgba(237,240,246,0.78),transparent),linear-gradient(185deg,#fbfcfe,#f1f3f8_58%,#e4e8f1)]";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8080";
const CRAWLER_ENDPOINT = `${API_BASE_URL}/api/articles/crawl/manual`;

const mockAnalysisData: AnalysisData = {
  title: "인공지능이 바꾸는 미래의 교육",
  summary:
    "인공지능 기술이 교육 분야에 혁신을 가져오고 있습니다. 맞춤형 학습, 자동 평가, 가상 튜터 등의 기능을 통해 학습자 개개인의 수준과 속도에 맞는 교육이 가능해지고 있으며, 교사들의 업무 효율성도 크게 향상되고 있습니다. 하지만 기술 도입 과정에서 발생할 수 있는 문제점들도 함께 고려해야 할 필요가 있습니다.",
  fullText: `인공지능이 바꾸는 미래의 교육

교육 현장에서 인공지능(AI) 기술의 도입이 본격화되면서, 전통적인 교육 방식에 혁신적인 변화가 일어나고 있다. 특히 맞춤형 학습, 자동화된 평가 시스템, 그리고 가상 AI 튜터의 등장은 교육의 패러다임을 근본적으로 바꾸고 있다.

가장 주목받는 변화는 맞춤형 학습 시스템이다. AI는 학습자 개개인의 학습 패턴, 이해도, 학습 속도를 실시간으로 분석하여 최적화된 학습 경로를 제공한다. 예를 들어, 수학 문제를 풀 때 학생이 어떤 부분에서 어려움을 겪는지 파악하고, 그에 맞는 추가 문제나 설명을 자동으로 제공하는 것이다.

자동화된 평가 시스템 또한 교육 현장에 큰 변화를 가져오고 있다. AI는 객관식뿐만 아니라 서술형 답안까지 정확하게 채점할 수 있게 되었다. 이는 교사들의 업무 부담을 크게 줄여주는 동시에, 학생들에게는 즉각적인 피드백을 제공한다.

가상 AI 튜터의 등장은 또 다른 혁신이다. 24시간 언제든지 학습자의 질문에 답변하고, 개별 학습 계획을 세우며, 학습 동기를 유지할 수 있도록 도와주는 AI 튜터들이 개발되고 있다.

하지만 이러한 기술적 진보에도 불구하고 여러 과제들이 남아있다. 데이터 개인정보 보호 문제는 가장 시급한 과제 중 하나다. 또한 AI 기술에 대한 접근성 격차로 인해 디지털 교육 불평등이 심화될 수 있다는 우려도 있다.`,
  keyPoints: [
    "AI 기반 맞춤형 학습 시스템이 학습자의 개별 수준을 파악하여 최적화된 학습 경로를 제공합니다",
    "자동화된 평가 시스템으로 교사의 업무 부담이 줄어들고 실시간 피드백이 가능해집니다",
    "가상 AI 튜터가 24시간 학습 지원을 제공하여 언제든지 도움을 받을 수 있습니다",
    "데이터 개인정보 보호와 기술 격차 해소 등의 과제가 여전히 남아있습니다",
  ],
  keywords: [
    "인공지능",
    "교육혁신",
    "맞춤형학습",
    "자동평가",
    "가상튜터",
    "에듀테크",
  ],
  importantWords: [
    {
      word: "인공지능",
      frequency: 8,
      importance: "high",
      context: "교육 분야의 핵심 기술",
    },
    {
      word: "맞춤형학습",
      frequency: 5,
      importance: "high",
      context: "AI 교육의 주요 혜택",
    },
    {
      word: "패러다임",
      frequency: 3,
      importance: "medium",
      context: "교육 방식의 근본적 변화",
    },
    {
      word: "디지털전환",
      frequency: 4,
      importance: "medium",
      context: "교육계의 기술 도입",
    },
    {
      word: "자동화",
      frequency: 3,
      importance: "medium",
      context: "평가 시스템의 특징",
    },
    {
      word: "혁신",
      frequency: 4,
      importance: "medium",
      context: "교육의 변화",
    },
  ],
  readingTime: 8,
  difficulty: "medium",
  category: "교육/기술",
  sentiment: "positive",
};

const getPublishedTimestamp = (article: Article): number => {
  const raw = article.published_at ?? (article as { publishedAt?: string | null }).publishedAt ?? null;
  if (!raw) return 0;
  const timestamp = new Date(raw).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortArticlesByPublishedDate = (list: Article[]): Article[] => {
  return [...list].sort((a, b) => getPublishedTimestamp(b) - getPublishedTimestamp(a));
};

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    articles,
    isLoading: isArticlesLoading,
    error: articlesError,
  } = useArticles();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const [currentTab, setCurrentTab] = useState<HomeTab>("home");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTextForQuestion, setSelectedTextForQuestion] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Clean up any old global functions and event listeners from vanilla JS version
  useEffect(() => {
    // Create no-op functions to prevent errors from old event listeners
    const noOp = () => {};
    const oldGlobalFunctions = [
      "closeSelectionPopup",
      "switchTab",
      "selectKeyword",
      "selectArticle",
      "analyzeByUrl",
      "analyzeByText",
      "handleTextSelection",
      "showWordDetail",
      "closeWordModal",
      "switchResultTab",
      "askAboutSelection",
      "sendMessage",
      "viewHistoryItem",
      "deleteHistoryItem",
      "toggleTheme",
    ];

    // Replace old functions with no-ops to prevent errors
    oldGlobalFunctions.forEach((funcName) => {
      (window as any)[funcName] = noOp;
    });

    // Clean up old global state
    delete (window as any).currentAnalysisData;
    delete (window as any).selectedText;
    delete (window as any).chatMessages;
    delete (window as any).wordDatabase;
    delete (window as any).appInitialized;

    // Clone and replace document to remove all old event listeners
    // This is a more aggressive approach but ensures all old listeners are removed
    document.cloneNode(false);

    // Cleanup function
    return () => {
      // Remove the no-op functions when component unmounts
      oldGlobalFunctions.forEach((funcName) => {
        if ((window as any)[funcName] === noOp) {
          delete (window as any)[funcName];
        }
      });
    };
  }, []);

  const [crawlLog, setCrawlLog] = useState<string | null>(null);
  const [crawlStatus, setCrawlStatus] = useState<"idle" | "success" | "error">("idle");

  const handleAnalyze = async (articleUrl: string) => {
    if (!articleUrl) return;

    setIsAnalyzing(true);
    setAnalysisData(null);
    toast.loading("기사 분석을 시작합니다. 잠시만 기다려주세요...", { id: "analyze" });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3분 타임아웃

      const response = await fetch(`${API_BASE_URL}/api/articles/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "알 수 없는 오류" }));
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const data = await response.json();
      // 백엔드 응답: { article_id, title, publisher, summarize, keywords, keywordDefinitions }
      const analysisResult = {
        articleId: data.article_id,
        title: data.title,
        publisher: data.publisher,
        summary: data.summarize,
        keywords: data.keywords,
        definitions: data.keywordDefinitions,
      };

      toast.success("분석 완료! 결과 페이지로 이동합니다.", { id: "analyze" });
      navigate(`/loading/${analysisResult.articleId}`, { state: { analysisResult } });

    } catch (error) {
      let message = "알 수 없는 오류가 발생했습니다.";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          message = "요청 시간이 초과되었습니다. 다시 시도해주세요.";
        } else {
          message = error.message;
        }
      }
      toast.error("분석 중 오류가 발생했습니다.", {
        id: "analyze",
        description: message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleArticleNavigate = (article: Article) => {
    toast.success(`"${article.title}" 기사를 불러옵니다`);
    navigate(`/loading/${article.articleId}`, { state: { article } });
  };

  const handleTextSelection = (text: string) => {
    setSelectedTextForQuestion(text);
    toast.success("선택한 텍스트가 질문하기로 전달되었습니다!");
  };

  const handleClearSelectedText = () => {
    setSelectedTextForQuestion("");
  };

  const headerActiveView =
    currentTab === "home" ? "home" : currentTab === "history" ? "history" : "analyze";
  const [sidebarWidth, setSidebarWidth] = useState(230);
  const isResizingRef = useRef(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [preferredKeywords, setPreferredKeywords] = useState<string[]>([]);

  const userStorageKey = user?.userId ? `preferredKeywords:${user.userId}` : null;

  const syncPreferredKeywords = useCallback(() => {
    if (!userStorageKey) {
      setPreferredKeywords([]);
      return;
    }
    const stored = localStorage.getItem(userStorageKey);
    if (!stored) {
      setPreferredKeywords([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setPreferredKeywords(
          parsed
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        );
      } else {
        setPreferredKeywords([]);
      }
    } catch (err) {
      console.warn("Failed to parse preferred keywords:", err);
      setPreferredKeywords([]);
    }
  }, [userStorageKey]);

  useEffect(() => {
    syncPreferredKeywords();
  }, [syncPreferredKeywords]);

  useEffect(() => {
    const handleUpdate = () => syncPreferredKeywords();
    const handleStorage = (event: StorageEvent) => {
      if (userStorageKey && event.key === userStorageKey) {
        syncPreferredKeywords();
      }
    };
    window.addEventListener("preferredKeywordsUpdated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("preferredKeywordsUpdated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncPreferredKeywords, userStorageKey]);

  // 카테고리 코드 정규화 (100, 101 등 숫자 코드 직접 비교)
  const normalizeCategoryCode = (code?: string | null) => {
    if (!code) return null;
    return code.trim();
  };

  const filteredArticles = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const normalizedKeyword = selectedKeyword?.toLowerCase() ?? null;

    const base = articles.filter((article) => {
      if (
        selectedCategoryId &&
        normalizeCategoryCode(article.categoryCode) !== selectedCategoryId
      ) {
        return false;
      }

      const title = (article.title ?? "").toLowerCase();
      const content = (article.content ?? "").toLowerCase();
      const categoryName = (article.categoryName ?? "").toLowerCase();
      const combined = `${title} ${content} ${categoryName}`;

      if (normalizedKeyword && !combined.includes(normalizedKeyword)) {
        return false;
      }

      if (normalizedSearch && !title.includes(normalizedSearch)) {
        return false;
      }

      return true;
    });

    const sortedBase = sortArticlesByPublishedDate(base);

    if (!preferredKeywords.length) {
      return sortedBase;
    }

    const loweredPreferred = preferredKeywords.map((kw) => kw.toLowerCase());
    const prioritized: Article[] = [];
    const rest: Article[] = [];

    sortedBase.forEach((article) => {
      const combined = `${article.title ?? ""} ${article.content ?? ""} ${
        article.categoryName ?? ""
      }`.toLowerCase();
      const matches = loweredPreferred.some((kw) => combined.includes(kw));
      if (matches) {
        prioritized.push(article);
      } else {
        rest.push(article);
      }
    });

    return [...prioritized, ...rest];
  }, [articles, selectedCategoryId, selectedKeyword, preferredKeywords, searchQuery]);

  const highlightedArticleIds = useMemo(() => {
    if (!preferredKeywords.length) {
      return new Set<number>();
    }
    const loweredPreferred = preferredKeywords.map((kw) => kw.toLowerCase());
    const ids = new Set<number>();
    filteredArticles.forEach((article) => {
      const combined = `${article.title ?? ""} ${article.content ?? ""} ${
        article.categoryName ?? ""
      }`.toLowerCase();
      if (loweredPreferred.some((kw) => combined.includes(kw))) {
        ids.add(article.articleId);
      }
    });
    return ids;
  }, [filteredArticles, preferredKeywords]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;
      const nextWidth = Math.min(Math.max(event.clientX, 180), 360);
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleSidebarResizeStart = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    isResizingRef.current = true;
  };

  const handleSearchSubmit = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setSearchQuery(searchInput.trim());
    },
    [searchInput],
  );

  return (
    <div className={`min-h-screen ${AMBIENT_BACKGROUND} text-[#1f2937]`}>
      <Header
        sidebarWidth={sidebarWidth}
        onLoginClick={() => navigate("/login")}
        onHomeClick={() => {
          setCurrentTab("home");
          window.location.reload();
        }}
        onAnalyzeClick={() => setCurrentTab("analyze")}
        onHistoryClick={() => setCurrentTab("history")}
        onExperienceClick={() => navigate("/experience")}
        onSidebarResizeStart={handleSidebarResizeStart}
        activeView={headerActiveView}
      />

      <main
        className="flex min-h-screen flex-col px-10 py-10"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="mx-auto w-full max-w-6xl">
          <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as HomeTab)}>
            <TabsContent value="home">
              <div className="space-y-16 pb-12">
                <KeywordCategories
                  selectedCategoryId={selectedCategoryId}
                  selectedKeyword={selectedKeyword}
                  onCategorySelect={(categoryId, categoryName) => {
                    setSelectedCategoryId(categoryId);
                    setSelectedCategoryName(categoryName);
                    if (!categoryId) {
                      setSelectedKeyword(null);
                    }
                  }}
                  onKeywordSelect={setSelectedKeyword}
                />
                <ArticleCardList
                  articles={filteredArticles}
                  activeCategoryName={selectedCategoryName}
                  activeKeyword={selectedKeyword}
                  preferredKeywords={preferredKeywords}
                  highlightedArticleIds={highlightedArticleIds}
                  isLoading={isArticlesLoading}
                  error={articlesError}
                  onArticleClick={handleArticleNavigate}
                  searchInput={searchInput}
                  searchQuery={searchQuery}
                  onSearchInputChange={setSearchInput}
                  onSearchSubmit={handleSearchSubmit}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={toggleBookmark}
                />
            </div>
          </TabsContent>

          <TabsContent value="analyze">
            <div className="space-y-8">
              <ArticleInput
                onAnalyze={handleAnalyze}
                isLoading={isAnalyzing}
                crawlLog={crawlLog}
                crawlStatus={crawlStatus}
              />

              {analysisData && !isAnalyzing && (
                <div>
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl text-[#1f2937]">분석 결과</h2>
                    <p className="text-sm text-[#5b6472]">
                      아래에서 분석 결과를 확인하세요
                    </p>
                  </div>
                  <AnalysisResult
                    data={analysisData}
                    onTextSelection={handleTextSelection}
                    selectedTextForQuestion={selectedTextForQuestion}
                    onClearSelectedText={handleClearSelectedText}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-8">
              <ReadHistoryTab />
            </div>
          </TabsContent>

          {analysisData && (
            <TabsContent value="result">
              <AnalysisResult
                data={analysisData}
                onTextSelection={handleTextSelection}
                    selectedTextForQuestion={selectedTextForQuestion}
                    onClearSelectedText={handleClearSelectedText}
                  />
            </TabsContent>
          )}
        </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" richColors />
      <Routes>
        <Route path="/" element={<ExperiencePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/loading/:articleId" element={<LoadingPage />} />
        <Route path="/content/:articleId" element={<Content />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </AuthProvider>
  );
}

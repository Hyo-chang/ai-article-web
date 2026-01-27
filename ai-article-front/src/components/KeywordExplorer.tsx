import { useEffect, useRef, useState } from "react";
import { Hash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface HotArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  readingTime: number;
  views: number;
}

interface CategoryWithKeywords {
  categoryId: string;
  categoryName: string;
  keywords: string[];
}

interface KeywordExplorerProps {
  onArticleSelect: (title: string) => void;
}

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const CATEGORY_ICONS = ["📰", "🤖", "💼", "🏛️", "🎭", "🌐", "📈", "📚"];

const mockHotArticles: { [key: string]: HotArticle[] } = {
  인공지능: [
    {
      id: "1",
      title: "GPT-4를 뛰어넘는 새로운 AI 모델 'Claude-3' 공개",
      source: "테크뉴스",
      publishedAt: "2024-12-20",
      readingTime: 7,
      views: 15420,
    },
    {
      id: "2",
      title: "구글, 의료 진단 AI로 암 발견 정확도 95% 달성",
      source: "의료타임즈",
      publishedAt: "2024-12-20",
      readingTime: 9,
      views: 12350,
    },
    {
      id: "3",
      title: "AI 교사가 개인 맞춤 수업을 제공하는 시대가 온다",
      source: "교육뉴스",
      publishedAt: "2024-12-19",
      readingTime: 6,
      views: 8970,
    },
  ],
  주식: [
    {
      id: "4",
      title: "2025년 주목해야 할 반도체 주식 TOP 5",
      source: "경제일보",
      publishedAt: "2024-12-20",
      readingTime: 10,
      views: 23450,
    },
    {
      id: "5",
      title: "개미투자자들이 몰리는 2차전지 관련주 분석",
      source: "투자데일리",
      publishedAt: "2024-12-20",
      readingTime: 8,
      views: 18900,
    },
    {
      id: "6",
      title: "미국 금리 인하가 한국 증시에 미치는 영향",
      source: "파이낸셜뉴스",
      publishedAt: "2024-12-19",
      readingTime: 12,
      views: 16780,
    },
  ],
  기후변화: [
    {
      id: "7",
      title: "2024년 전 세계 기온 상승폭 1.5도 돌파 임박",
      source: "환경일보",
      publishedAt: "2024-12-20",
      readingTime: 11,
      views: 14200,
    },
    {
      id: "8",
      title: "한국형 그린뉴딜 3.0, 2030년까지 100조원 투입",
      source: "그린포스트",
      publishedAt: "2024-12-19",
      readingTime: 9,
      views: 11500,
    },
    {
      id: "9",
      title: "탄소중립 실현을 위한 기업들의 혁신적 기술들",
      source: "지속가능경영",
      publishedAt: "2024-12-19",
      readingTime: 7,
      views: 9200,
    },
  ],
};

export function KeywordExplorer({ onArticleSelect }: KeywordExplorerProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [, setHotArticles] = useState<HotArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const categoryAreaRef = useRef<HTMLDivElement | null>(null);

  const handleCategoryActivate = (categoryId: string) => {
    setHoveredCategoryId(categoryId);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory((prev) => {
      const nextCategory = prev === categoryName ? null : categoryName;
      setHoveredCategory(null);
      return nextCategory;
    });
    setSelectedKeyword(null);
    setHotArticles([]);
  };

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(keyword);
    // 실제 앱에서는 API 호출로 교체
    setHotArticles(mockHotArticles[keyword] || []);
  };

  useEffect(() => {
    if (!selectedCategory && !hoveredCategory) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!categoryAreaRef.current?.contains(target)) {
        setHoveredCategory(null);
        setSelectedCategory(null);
        setSelectedKeyword(null);
        setHotArticles([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hoveredCategory, selectedCategory]);

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* 헤더 섹션 - absolute 패널의 기준점 */}
      <div
        ref={categoryAreaRef}
        className="space-y-8 relative"
        onMouseLeave={() => setHoveredCategoryId(null)}
      >
        {/* 카테고리 선택 */}
        <div className="flex flex-wrap gap-3 justify-center">
          {keywordCategories.map((category) => {
            const isActive =
              selectedCategory === category.name || hoveredCategory === category.name;
            return (
              <Button
                key={category.name}
                variant={isActive ? "default" : "outline"}
                size="lg"
                className={`
                  rounded-full border-2 px-5 py-2 transition-colors duration-200
                  ${
                    isActive
                      ? "border-[#d0d6e3] bg-[#e7ebf3] text-[#1f2937]"
                      : "border-[#e1e4ec] bg-white text-[#5b6472] hover:border-[#d3d9e6] hover:bg-[#edf1f7] hover:text-[#1f2937]"
                  }
                `}
                    onClick={() => handleCategorySelect(category.categoryId)}
                    onMouseEnter={() => handleCategoryActivate(category.categoryId)}
                    onFocus={() => handleCategoryActivate(category.categoryId)}
                  >
                    <span className="mr-2 text-lg">{icon}</span>
                    <span>{category.categoryName}</span>
                  </Button>
                );
              })}
              {categories.length === 0 && !isLoading && (
                <span className="text-sm text-slate-500">표시할 카테고리가 없습니다.</span>
              )}
              {isLoading && (
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  불러오는 중...
                </span>
              )}
            </div>
          </>
        )}

        {/* 키워드 패널 - 떠서(absolute) 아래 레이아웃을 밀지 않음 */}
        {(hoveredCategoryId || selectedCategoryId) && activeCategory && (
          <div
            className="
              absolute left-1/2 -translate-x-1/2
              top-full mt-4
              w-[min(100%,64rem)]
              z-20
              rounded-3xl border border-[#d9deea] bg-white/95 p-8 shadow-[0_28px_52px_rgba(168,178,196,0.22)] backdrop-blur
            "
            onMouseEnter={() => {
              /* 패널 위에 올려도 유지 */
            }}
            onMouseLeave={() => setHoveredCategoryId(null)}
          >
            <div className="mb-6">
              <h3 className="mb-2 text-2xl text-[#1f2937]">
                {(hoveredCategory ?? selectedCategory) as string} 키워드
              </h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {keywordCategories
                .find((cat) => cat.name === (hoveredCategory ?? selectedCategory))
                ?.keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className={`
                      cursor-pointer transition-all duration-200 text-base py-3 px-5 rounded-2xl w-full justify-start
                      ${
                        selectedKeyword === keyword
                          ? "scale-105 bg-[#e7ebf3] text-[#1f2937]"
                          : "bg-[#f3f5fa] text-[#5b6573] hover:bg-[#edf1f7] hover:text-[#1f2937]"
                      }
                    `}
                    onClick={() => handleKeywordClick(keyword)}
                  >
                    <Hash className="h-3 w-3 mr-2" />
                    {keyword}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500">아직 키워드가 없습니다.</p>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

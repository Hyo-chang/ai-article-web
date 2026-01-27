import { useState } from "react";
import { BookOpen, ExternalLink, ArrowRight, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface RelatedArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
  url: string;
}

interface WordInfo {
  word: string;
  definition: string;
  category: string;
  synonyms: string[];
  relatedArticles: RelatedArticle[];
}

interface WordDetailProps {
  isOpen: boolean;
  onClose: () => void;
  wordInfo: WordInfo | null;
}

const mockWordData: { [key: string]: WordInfo } = {
  "인공지능": {
    word: "인공지능",
    definition: "인간의 학습능력, 추론능력, 지각능력 등을 인공적으로 구현한 컴퓨터 프로그램 또는 시스템. AI(Artificial Intelligence)라고도 불리며, 기계학습, 딥러닝, 자연어 처리 등의 기술을 포함합니다.",
    category: "기술",
    synonyms: ["AI", "머신러닝", "기계학습", "딥러닝"],
    relatedArticles: [
      {
        id: "ai1",
        title: "ChatGPT-4, 인간 수준의 언어 이해력 달성",
        source: "테크뉴스",
        publishedAt: "2024-12-20",
        summary: "OpenAI의 최신 언어모델이 복잡한 추론과 창작 능력에서 인간 수준에 근접한 성능을 보여주고 있습니다.",
        url: "https://example.com/chatgpt4"
      },
      {
        id: "ai2",
        title: "구글 DeepMind, 단백질 구조 예측 정확도 95% 돌파",
        source: "사이언스타임즈",
        publishedAt: "2024-12-19",
        summary: "AlphaFold3가 의학 연구와 신약 개발에 혁신적 변화를 가져올 것으로 기대됩니다.",
        url: "https://example.com/alphafold3"
      },
      {
        id: "ai3",
        title: "자율주행차 상용화, 2025년 본격 시작",
        source: "모빌리티뉴스",
        publishedAt: "2024-12-18",
        summary: "레벨4 자율주행 기술이 상용화되면서 교통 패러다임의 대전환이 예상됩니다.",
        url: "https://example.com/autonomous-cars"
      }
    ]
  },
  "맞춤형학습": {
    word: "맞춤형학습",
    definition: "학습자 개개인의 수준, 능력, 학습 스타일, 선호도 등을 고려하여 개별화된 학습 경험을 제공하는 교육 방법. 개인별 맞춤 교육이라고도 합니다.",
    category: "교육",
    synonyms: ["개인화학습", "적응형학습", "개별화교육"],
    relatedArticles: [
      {
        id: "edu1",
        title: "AI 튜터가 만드는 개인 맞춤 학습의 미래",
        source: "교육뉴스",
        publishedAt: "2024-12-20",
        summary: "인공지능 기반 개인 맞춤 학습 시스템이 학습 효과를 획기적으로 개선하고 있습니다.",
        url: "https://example.com/ai-tutor"
      },
      {
        id: "edu2",
        title: "에듀테크 시장 급성장, 개인화 학습이 핵심",
        source: "에듀테크리뷰",
        publishedAt: "2024-12-19",
        summary: "코로나19 이후 에듀테크 시장이 급성장하며 개인화 기술이 주목받고 있습니다.",
        url: "https://example.com/edutech-growth"
      }
    ]
  },
  "디지털전환": {
    word: "디지털전환",
    definition: "기존의 아날로그 또는 물리적 프로세스를 디지털 기술로 변화시키는 과정. 기업이나 조직이 디지털 기술을 활용해 새로운 비즈니스 모델이나 고객 경험을 창출하는 것을 의미합니다.",
    category: "비즈니스",
    synonyms: ["디지털혁신", "DX", "디지털화"],
    relatedArticles: [
      {
        id: "dx1",
        title: "중소기업 디지털 전환, 정부 지원 확대",
        source: "비즈니스헤럴드",
        publishedAt: "2024-12-20",
        summary: "중소기업의 디지털 전환을 위한 정부 지원이 대폭 확대되어 경쟁력 강화가 기대됩니다.",
        url: "https://example.com/sme-dx"
      },
      {
        id: "dx2",
        title: "은행권 디지털 전환 가속화, 모바일 뱅킹 혁신",
        source: "금융타임즈",
        publishedAt: "2024-12-19",
        summary: "국내 은행들이 디지털 금융 서비스 혁신에 박차를 가며 고객 경험을 개선하고 있습니다.",
        url: "https://example.com/banking-dx"
      }
    ]
  },
  "패러다임": {
    word: "패러다임",
    definition: "특정 시대나 분야에서 지배적인 사고방식, 이론체계, 또는 접근방법. 기존의 틀이나 관점에서 완전히 새로운 방식으로의 변화를 의미하기도 합니다.",
    category: "철학/개념",
    synonyms: ["사고체계", "관점", "프레임워크"],
    relatedArticles: [
      {
        id: "para1",
        title: "원격근무 패러다임의 정착과 미래 전망",
        source: "워크라이프",
        publishedAt: "2024-12-20",
        summary: "코로나19로 시작된 원격근무가 새로운 업무 패러다임으로 자리잡고 있습니다.",
        url: "https://example.com/remote-work"
      }
    ]
  }
};

export function WordDetail({ isOpen, onClose, wordInfo }: WordDetailProps) {
  if (!wordInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl rounded-3xl border border-[#dfe3ed] bg-white text-[#1f2937] shadow-[0_36px_64px_rgba(158,168,186,0.25)] backdrop-blur">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl text-[#1f2937]">{wordInfo.word}</span>
              <Badge variant="outline" className="border-[#d7dce7] bg-[#f4f6fb] text-[#1f2937]">
                {wordInfo.category}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-6">
            {/* 단어 정의 */}
            <Card className="rounded-2xl border border-[#dfe3ed] bg-white/95 shadow-[0_24px_44px_rgba(158,168,186,0.22)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg text-[#1f2937]">
                  <BookOpen className="h-5 w-5 text-[#4c5664]" />
                  <span>정의</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-[#1f2937]">{wordInfo.definition}</p>
              </CardContent>
            </Card>

            {/* 유의어 */}
            {wordInfo.synonyms.length > 0 && (
              <Card className="rounded-2xl border border-[#dfe3ed] bg-white/95 shadow-[0_24px_44px_rgba(158,168,186,0.22)]">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1f2937]">유의어</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {wordInfo.synonyms.map((synonym, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="rounded-full bg-[#f1f4fa] text-[#1f2937] hover:bg-[#e5e9f3]"
                      >
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 관련 기사 */}
            <Card className="rounded-2xl border border-[#dfe3ed] bg-white/95 shadow-[0_24px_44px_rgba(158,168,186,0.22)]">
              <CardHeader>
                <CardTitle className="text-lg text-[#1f2937]">관련 기사</CardTitle>
                <CardDescription className="text-[#5b6472]">
                  '{wordInfo.word}'와(과) 관련된 최신 기사들입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wordInfo.relatedArticles.map((article, index) => (
                    <div key={article.id}>
                      <div className="flex items-start justify-between rounded-xl border border-[#dfe3ed] p-4 transition-colors hover:border-[#cfd6e5] hover:bg-[#f6f8fb]">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="border-0 bg-gradient-to-r from-[#f1f4fa] to-[#e1e6f0] text-xs text-[#1f2937]">
                              #{index + 1}
                            </Badge>
                            <span className="text-sm text-[#5b6472]">{article.source}</span>
                            <span className="text-sm text-[#a0a7b6]">•</span>
                            <span className="text-sm text-[#5b6472]">
                              {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <h4 className="cursor-pointer leading-tight text-[#1f2937] transition-colors hover:text-[#0f172a]">
                            {article.title}
                          </h4>
                          <p className="text-sm leading-relaxed text-[#5b6472]">
                            {article.summary}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-4 rounded-lg text-[#6f7888] hover:bg-[#eef1f7] hover:text-[#1f2937]"
                          onClick={() => window.open(article.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      {index < wordInfo.relatedArticles.length - 1 && (
                        <Separator className="my-3 bg-[#e2e6ef]" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// 단어 정보를 가져오는 함수
export function getWordInfo(word: string): WordInfo | null {
  return mockWordData[word] || null;
}

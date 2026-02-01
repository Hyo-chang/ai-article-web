import React, { useState } from "react";
import { Clock, Tag, BookOpen, CheckCircle, FileText, MessageCircle } from "lucide-react";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { ArticleChat } from "./ArticleChat";
import { ImportantWords } from "./ImportantWords";
import { TextSelectionPopup } from "./TextSelectionPopup";

interface ImportantWord {
  word: string;
  frequency: number;
  importance: 'high' | 'medium' | 'low';
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
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface AnalysisResultProps {
  data: AnalysisData;
  onTextSelection: (text: string) => void;
  selectedTextForQuestion: string;
  onClearSelectedText: () => void;
}

export function AnalysisResult({ 
  data, 
  onTextSelection, 
  selectedTextForQuestion, 
  onClearSelectedText
}: AnalysisResultProps) {
  const [localSelectedText, setLocalSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [currentTab, setCurrentTab] = useState("summary");

  const handleTextSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setLocalSelectedText(selectedText);
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    }
  };

  const handleAskQuestion = () => {
    if (localSelectedText) {
      onTextSelection(localSelectedText);
      setLocalSelectedText("");
      setCurrentTab("chat");
    }
  };

  const handleClosePopup = () => {
    setLocalSelectedText("");
    window.getSelection()?.removeAllRanges();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyValue = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 30;
      case 'medium': return 60;
      case 'hard': return 90;
      default: return 50;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-[#e0f5ec] text-[#0f5132]';
      case 'negative': return 'bg-[#fbe4ea] text-[#7f1d35]';
      case 'neutral': return 'bg-[#e6eaf2] text-[#1f2937]';
      default: return 'bg-[#e6eaf2] text-[#1f2937]';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 기본 정보 */}
      <Card className="rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="mb-3 text-2xl text-[#1f2937]">{data.title}</CardTitle>
              <div className="flex items-center space-x-3 text-sm text-[#5b6472]">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{data.readingTime}분</span>
                </div>
                <Badge variant="outline" className="border-[#d7dce7] bg-[#f4f6fb] text-[#1f2937]">{data.category}</Badge>
                <Badge className={`${getSentimentColor(data.sentiment)}`}>
                  {data.sentiment === 'positive' ? '긍정적' : 
                   data.sentiment === 'negative' ? '부정적' : '중립적'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#5b6472]">독해 난이도</span>
                <span className="text-sm text-[#5b6472]">
                  {data.difficulty === 'easy' ? '쉬움' : 
                   data.difficulty === 'medium' ? '보통' : '어려움'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e4e8f1]">
                <div 
                  className={`h-full ${getDifficultyColor(data.difficulty)} rounded-full transition-all duration-500`}
                  style={{ width: `${getDifficultyValue(data.difficulty)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 컨텐츠 */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-[#dfe3ed] bg-white/95 p-1.5 shadow-[0_24px_48px_rgba(158,168,186,0.2)] backdrop-blur">
          <TabsTrigger value="summary" className="flex items-center justify-center space-x-2 rounded-xl border border-transparent text-[#5b6472] transition data-[state=active]:border-[#d0d7e6] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#eef1f7] data-[state=active]:via-[#e2e7f1] data-[state=active]:to-[#d8deeb] data-[state=active]:text-[#1f2937] data-[state=active]:shadow-[0_20px_38px_rgba(160,170,190,0.24)] hover:border-[#d0d7e6] hover:bg-gradient-to-r hover:from-[#f6f8fb] hover:via-[#edf1f7] hover:to-[#e6e9f2] hover:text-[#1f2937]">
            <BookOpen className="h-4 w-4" />
            <span>AI 요약</span>
          </TabsTrigger>
          <TabsTrigger value="fulltext" className="flex items-center justify-center space-x-2 rounded-xl border border-transparent text-[#5b6472] transition data-[state=active]:border-[#d0d7e6] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#eef1f7] data-[state=active]:via-[#e2e7f1] data-[state=active]:to-[#d8deeb] data-[state=active]:text-[#1f2937] data-[state=active]:shadow-[0_20px_38px_rgba(160,170,190,0.24)] hover:border-[#d0d7e6] hover:bg-gradient-to-r hover:from-[#f6f8fb] hover:via-[#edf1f7] hover:to-[#e6e9f2] hover:text-[#1f2937]">
            <FileText className="h-4 w-4" />
            <span>전문보기</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center justify-center space-x-2 rounded-xl border border-transparent text-[#5b6472] transition data-[state=active]:border-[#d0d7e6] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#eef1f7] data-[state=active]:via-[#e2e7f1] data-[state=active]:to-[#d8deeb] data-[state=active]:text-[#1f2937] data-[state=active]:shadow-[0_20px_38px_rgba(160,170,190,0.24)] hover:border-[#d0d7e6] hover:bg-gradient-to-r hover:from-[#f6f8fb] hover:via-[#edf1f7] hover:to-[#e6e9f2] hover:text-[#1f2937]">
            <MessageCircle className="h-4 w-4" />
            <span>질문하기</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 mt-6">
          {/* AI 요약 */}
          <Card className="rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl text-[#1f2937]">
                <BookOpen className="h-5 w-5 text-[#4c5664]" />
                <span>AI 요약</span>
              </CardTitle>
              <CardDescription className="text-[#5b6472]">
                기사의 핵심 내용을 간단히 정리했습니다. 텍스트를 드래그하여 AI에게 질문할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent onMouseUp={handleTextSelect}>
              <p className="select-text cursor-text leading-relaxed text-[#1f2937]">{parseMarkdownBold(data.summary)}</p>
            </CardContent>
          </Card>

          {/* 주요 포인트 */}
          <Card className="rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl text-[#1f2937]">
                <CheckCircle className="h-5 w-5 text-[#4c5664]" />
                <span>주요 포인트</span>
              </CardTitle>
              <CardDescription className="text-[#5b6472]">
                기사에서 꼭 기억해야 할 핵심 내용입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f2f5fa] via-[#e2e7f1] to-[#d6dce8] text-sm text-[#1f2937] shadow-[0_10px_20px_rgba(160,170,190,0.22)]">
                      {index + 1}
                    </div>
                    <p className="leading-relaxed text-[#1f2937]">{parseMarkdownBold(point)}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 중요 단어 */}
          <ImportantWords words={data.importantWords} />

          {/* 키워드 */}
          <Card className="rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl text-[#1f2937]">
                <Tag className="h-5 w-5 text-[#4c5664]" />
                <span>키워드</span>
              </CardTitle>
              <CardDescription className="text-[#5b6472]">
                기사의 주요 키워드를 추출했습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="rounded-full bg-[#f1f4fa] text-sm text-[#1f2937] hover:bg-[#e5e9f3]">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulltext" className="mt-6">
          <Card className="rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl text-[#1f2937]">
                <FileText className="h-5 w-5 text-[#4c5664]" />
                <span>기사 전문</span>
              </CardTitle>
              <CardDescription className="text-[#5b6472]">
                원본 기사의 전체 내용을 확인하세요. 텍스트를 드래그하여 AI에게 질문할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full rounded-2xl border border-[#dfe3ed] bg-white p-6 shadow-inner shadow-[#e5e9f3]">
                <div className="space-y-4" onMouseUp={handleTextSelect}>
                  {data.fullText.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="select-text cursor-text leading-relaxed text-[#1f2937]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <ArticleChat 
            articleTitle={data.title} 
            initialQuestion={selectedTextForQuestion}
            onQuestionUsed={onClearSelectedText}
          />
        </TabsContent>
      </Tabs>

      <TextSelectionPopup
        selectedText={localSelectedText}
        position={selectionPosition}
        onAskQuestion={handleAskQuestion}
        onClose={handleClosePopup}
      />
    </div>
  );
}

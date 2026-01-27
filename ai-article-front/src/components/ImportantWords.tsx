import { useState } from "react";
import { Lightbulb, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { WordDetail, getWordInfo } from "./WordDetail";

interface ImportantWord {
  word: string;
  frequency: number;
  importance: 'high' | 'medium' | 'low';
  context: string;
}

interface ImportantWordsProps {
  words: ImportantWord[];
}

export function ImportantWords({ words }: ImportantWordsProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isWordDetailOpen, setIsWordDetailOpen] = useState(false);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'border border-rose-200 bg-[#fdecef] text-[#7f1d35] hover:bg-[#fad7de]';
      case 'medium': return 'border border-amber-200 bg-[#fdf4e3] text-[#7c5612] hover:bg-[#f9e7c5]';
      case 'low': return 'border border-emerald-200 bg-[#e5f7ed] text-[#146c43] hover:bg-[#d2f0de]';
      default: return 'border border-[#dfe3ed] bg-[#f4f6fb] text-[#1f2937] hover:bg-[#e8ecf5]';
    }
  };

  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case 'high': return '핵심';
      case 'medium': return '중요';
      case 'low': return '참고';
      default: return '일반';
    }
  };

  const handleWordClick = (word: string) => {
    const wordInfo = getWordInfo(word);
    if (wordInfo) {
      setSelectedWord(word);
      setIsWordDetailOpen(true);
    }
  };

  const selectedWordInfo = selectedWord ? getWordInfo(selectedWord) : null;

  // 중요도별로 단어 그룹화
  const groupedWords = words.reduce((acc, wordData) => {
    if (!acc[wordData.importance]) {
      acc[wordData.importance] = [];
    }
    acc[wordData.importance].push(wordData);
    return acc;
  }, {} as Record<string, ImportantWord[]>);

  return (
    <>
      <Card className="rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl text-[#1f2937]">
            <Lightbulb className="h-5 w-5 text-[#4c5664]" />
            <span>중요 단어</span>
          </CardTitle>
          <CardDescription className="text-[#5b6472]">
            기사에서 추출한 중요 단어들입니다. 단어를 클릭하면 자세한 설명과 관련 기사를 볼 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 핵심 단어 */}
            {groupedWords.high && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-[#fdecef] text-xs text-[#7f1d35]">핵심</Badge>
                  <span className="text-sm text-[#5b6472]">
                    반드시 이해해야 할 중요한 개념들
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupedWords.high.map((wordData, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className={`${getImportanceColor(wordData.importance)} hover:scale-105 rounded-full transition-all cursor-pointer shadow-[0_16px_30px_rgba(162,172,192,0.24)]`}
                      onClick={() => handleWordClick(wordData.word)}
                    >
                      <span className="flex items-center space-x-1">
                        <span>{wordData.word}</span>
                        <span className="text-xs opacity-80">({wordData.frequency}회)</span>
                        <Info className="h-3 w-3 opacity-80" />
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 중요 단어 */}
            {groupedWords.medium && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-[#fdf4e3] text-xs text-[#7c5612]">중요</Badge>
                  <span className="text-sm text-[#5b6472]">
                    내용 이해에 도움이 되는 단어들
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupedWords.medium.map((wordData, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className={`${getImportanceColor(wordData.importance)} hover:scale-105 rounded-full transition-all cursor-pointer shadow-[0_16px_30px_rgba(162,172,192,0.24)]`}
                      onClick={() => handleWordClick(wordData.word)}
                    >
                      <span className="flex items-center space-x-1">
                        <span>{wordData.word}</span>
                        <span className="text-xs opacity-80">({wordData.frequency}회)</span>
                        <Info className="h-3 w-3 opacity-80" />
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 참고 단어 */}
            {groupedWords.low && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-[#e5f7ed] text-xs text-[#146c43]">참고</Badge>
                  <span className="text-sm text-[#5b6472]">
                    추가로 알아두면 좋은 단어들
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupedWords.low.map((wordData, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className={`${getImportanceColor(wordData.importance)} hover:scale-105 rounded-full transition-all cursor-pointer shadow-[0_16px_30px_rgba(162,172,192,0.24)]`}
                      onClick={() => handleWordClick(wordData.word)}
                    >
                      <span className="flex items-center space-x-1">
                        <span>{wordData.word}</span>
                        <span className="text-xs opacity-80">({wordData.frequency}회)</span>
                        <Info className="h-3 w-3 opacity-80" />
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <WordDetail
        isOpen={isWordDetailOpen}
        onClose={() => setIsWordDetailOpen(false)}
        wordInfo={selectedWordInfo}
      />
    </>
  );
}

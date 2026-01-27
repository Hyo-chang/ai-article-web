import { Calendar, Clock, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface HistoryItem {
  id: string;
  title: string;
  category: string;
  analyzedAt: string;
  readingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  url?: string;
}

interface ArticleHistoryProps {
  items: HistoryItem[];
  onItemClick: (id: string) => void;
  onItemDelete: (id: string) => void;
}

export function ArticleHistory({ items, onItemClick, onItemDelete }: ArticleHistoryProps) {
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '보통';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-[#e5f7ed] text-[#146c43]';
      case 'medium': return 'bg-[#fdf4e3] text-[#7c5612]';
      case 'hard': return 'bg-[#fdecef] text-[#7f1d35]';
      default: return 'bg-[#e6eaf2] text-[#1f2937]';
    }
  };

  if (items.length === 0) {
    return (
      <Card className="mx-auto max-w-4xl rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl text-[#1f2937]">분석 기록</CardTitle>
          <CardDescription className="text-[#5b6472]">아직 분석한 기사가 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-[#8a92a3]">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-[#cdd4e2]" />
            <p className="text-lg text-[#1f2937]">첫 번째 기사를 분석해보세요!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-4xl rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl text-[#1f2937]">분석 기록</CardTitle>
        <CardDescription className="text-[#5b6472]">
          이전에 분석한 기사들을 다시 확인할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer rounded-2xl border border-[#e0e5ef] bg-white p-6 transition-all duration-300 hover:border-[#cfd6e5] hover:bg-[#f8f9fc] hover:shadow-[0_26px_44px_rgba(160,170,190,0.24)]"
              onClick={() => onItemClick(item.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <h3 className="line-clamp-2 text-lg leading-tight text-[#1f2937] transition-colors group-hover:text-[#0f172a]">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-[#6f7888]">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.analyzedAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.readingTime}분</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs border-[#d7dce7] bg-[#f4f6fb] text-[#1f2937]">
                      {item.category}
                    </Badge>
                    <Badge className={`${getDifficultyColor(item.difficulty)} text-xs`}>
                      {getDifficultyLabel(item.difficulty)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {item.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-[#6f7888] hover:bg-[#eef1f7] hover:text-[#1f2937]"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-[#6f7888] hover:bg-[#fdecef] hover:text-[#7f1d35]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemDelete(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Link, Upload, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";

type CrawlStatus = "idle" | "success" | "error";

interface ArticleInputProps {
  onAnalyze: (content: string) => void;
  isLoading?: boolean;
  crawlLog?: string | null;
  crawlStatus?: CrawlStatus;
}

export function ArticleInput({
  onAnalyze,
  isLoading = false,
  crawlLog = null,
  crawlStatus = "idle",
}: ArticleInputProps) {
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onAnalyze(urlInput.trim());
    }
  };

  const logStyles =
    crawlStatus === "success"
      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
      : "border-rose-200 bg-rose-50/70 text-rose-900";

  return (
    <Card className="mx-auto w-full max-w-2xl rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
      <CardHeader className="pb-6 text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-2xl text-[#1f2937]">
          <Sparkles className="h-6 w-6 text-[#4c5664]" />
          <span>기사 분석하기</span>
        </CardTitle>
        <CardDescription className="text-[#5b6472]">
          기사 URL만 입력하면 AI가 내용을 분석해 드려요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-1 rounded-xl border border-[#dfe3ed] bg-[#f6f8fb] p-1">
            <TabsTrigger value="url" className="flex items-center space-x-2 rounded-lg text-[#5b6472] transition data-[state=active]:bg-white data-[state=active]:text-[#1f2937] data-[state=active]:shadow-[0_14px_28px_rgba(160,170,190,0.18)]">
              <Link className="h-4 w-4" />
              <span>URL 입력</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4 mt-6">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input" className="text-[#4c5664]">기사 URL</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isLoading}
                  className="rounded-xl border border-[#dfe3ed] bg-white text-[#1f2937] placeholder:text-[#98a1b1] focus:border-[#cdd4e2] focus:ring-[#d8deeb]"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full rounded-xl border border-[#d7dce7] bg-gradient-to-r from-[#f5f7fb] via-[#e7ebf4] to-[#dde2ec] py-6 text-[#1f2937] shadow-[0_22px_42px_rgba(164,174,194,0.24)] transition-all hover:from-[#e9edf5] hover:via-[#e1e6f0] hover:to-[#d8deeb]" 
                disabled={!urlInput.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI 분석 시작
                  </>
                )}
              </Button>
            </form>
            {crawlLog && (
              <div className={`rounded-2xl border p-4 text-sm shadow-sm transition ${logStyles}`}>
                <div className="font-semibold">
                  {crawlStatus === "success" ? "크롤링 성공 로그" : "크롤링 오류 로그"}
                </div>
                <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-[#1f2937]">
                  {crawlLog}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

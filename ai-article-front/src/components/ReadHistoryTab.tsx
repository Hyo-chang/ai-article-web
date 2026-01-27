import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/services/AuthContext";
import { useReadHistory } from "@/hooks/useReadHistory";

function formatReadAt(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "알 수 없는 시간";
  }
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSnippet(text?: string | null, maxLength = 100): string {
  if (!text) return "요약된 내용이 없습니다.";
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function ReadHistoryTab() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { history, isLoading, error, refetch } = useReadHistory();

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const left = new Date(a.readAt).getTime();
      const right = new Date(b.readAt).getTime();
      return Number.isNaN(right) || Number.isNaN(left) ? 0 : right - left;
    });
  }, [history]);

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dfe3ed] bg-[#f7f8fb] px-6 py-10 text-center">
        <p className="text-base text-[#4c5664]">로그인 후 읽은 기사 기록을 확인할 수 있습니다.</p>
        <Button
          type="button"
          className="mt-4 rounded-xl bg-[#5b47fb] text-white hover:bg-[#4936e0]"
          onClick={() => navigate("/login")}
        >
          로그인하러 가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9aa3b3]">History</p>
          <h3 className="text-lg font-semibold text-[#1f2937]">최근에 읽은 기사</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="rounded-full border-[#dfe3ed] text-[#4c5664] hover:bg-[#f7f8fb]"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`history-skeleton-${index}`}
              className="flex items-center gap-4 rounded-2xl border border-[#e4e8f1] bg-white/80 p-4 shadow-sm"
            >
              <div className="h-20 w-20 rounded-xl bg-[#eef1f7]/90" />
              <div className="flex flex-1 flex-col gap-3">
                <div className="h-4 w-1/4 rounded-full bg-[#eef1f7]" />
                <div className="h-5 w-2/3 rounded-full bg-[#e1e5ef]" />
                <div className="h-4 w-full rounded-full bg-[#eef1f7]" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedHistory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dfe3ed] bg-white/70 py-12 text-center text-[#7c8496]">
          아직 읽은 기사 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedHistory.map((entry) => {
            const title =
              entry.article?.title ??
              entry.articleTitle ??
              `기사 #${entry.articleId}`;
            const snippet = buildSnippet(
              entry.article?.content ?? entry.articleSummary ?? null,
            );
            const image =
              entry.article?.image_url ??
              entry.articleImageUrl ??
              null;

            return (
              <div
                key={entry.historyId}
                className="flex items-center gap-4 rounded-2xl border border-[#e4e8f1] bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-20 w-20 flex-none overflow-hidden rounded-xl bg-[#edf0f6]">
                  {image ? (
                    <img
                      src={image}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[#7c8496]">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#7c8496]">
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>{formatReadAt(entry.readAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#1f2937]">{title}</p>
                  <p className="text-sm leading-relaxed text-[#566077]">
                    {snippet}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl bg-[#eef1f8] text-[#1f2937] hover:bg-[#e2e7f2]"
                  onClick={() => navigate(`/content/${entry.articleId}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  다시 읽기
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

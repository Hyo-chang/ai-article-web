import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Article } from "../types/article";
import { Progress } from "@/components/ui/progress";

const LOADING_DURATION_MS = 2500; // 로딩 화면 최소 표시 시간 (2.5초)
const PROGRESS_UPDATE_INTERVAL_MS = 10;
const MESSAGE_FADE_DURATION_MS = 40;
const PROGRESS_INCREMENT =
  (100 * PROGRESS_UPDATE_INTERVAL_MS) / LOADING_DURATION_MS;

const MESSAGES = [
  "AI가 핵심 문장을 추출하고 있어요.",
  "기사의 맥락과 주제를 정리하는 중입니다.",
  "중요 키포인트와 감정을 파악하고 있어요.",
  "읽기 쉬운 요약을 구성하는 중입니다.",
  "마지막으로 내용을 검토하고 있어요.",
] as const;

const MESSAGE_INTERVAL_MS = LOADING_DURATION_MS / MESSAGES.length;

export default function LoadingPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // HomePage에서 전달받은 데이터를 가져옵니다.
  const analysisResult = location.state?.analysisResult;
  const article = location.state?.article;

  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Progress가 100%가 되면 다음 페이지로 이동합니다.
    if (progress >= 100) {
      if (!articleId) {
        navigate("/home", { replace: true });
        return;
      }
      const targetPath = `/content/${articleId}`;
      // 분석 결과와 기사 데이터를 다음 페이지의 state로 전달합니다.
      navigate(targetPath, {
        replace: true,
        state: { analysisResult, article },
      });
    }
  }, [progress, articleId, navigate, analysisResult, article]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + PROGRESS_INCREMENT;
        return next >= 100 ? 100 : next;
      });
    }, PROGRESS_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }

      setIsFadingOut(true);

      fadeTimeout = setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setIsFadingOut(false);
      }, MESSAGE_FADE_DURATION_MS);
    }, MESSAGE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-400 px-6 text-center text-gray-900">
      <div className="max-w-xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            요약을 준비 중입니다
          </h1>
          <p className="mt-3 text-base text-gray-700">
            선택하신 기사에 대한 AI 요약을 생성하는 동안 잠시만 기다려주세요.
          </p>
        </div>

        <div className="relative h-28 overflow-hidden">
          {MESSAGES.map((message, index) => (
            <p
              key={message}
              className={`absolute inset-0 flex items-center justify-center px-4 text-lg font-medium transition-opacity ${
                index === messageIndex
                  ? isFadingOut
                    ? "opacity-0"
                    : "opacity-100"
                  : "opacity-0"
              }`}
              style={{ transitionDuration: `${MESSAGE_FADE_DURATION_MS}ms` }}
            >
              {message}
            </p>
          ))}
        </div>

        <div className="w-full">
          <Progress value={progress} className="w-full h-3" />
          <p className="mt-2 text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}

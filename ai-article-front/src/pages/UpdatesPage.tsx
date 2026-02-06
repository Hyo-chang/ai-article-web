import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Rocket, Wrench, Bug, Calendar } from "lucide-react";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

type ReleaseType = "feature" | "improvement" | "bugfix";

interface ReleaseItem {
  type: ReleaseType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  highlights?: string;
  items: ReleaseItem[];
}

const releases: Release[] = [
  {
    version: "0.2.0",
    date: "2026-02-06",
    highlights: "정식 배포 및 모바일 지원",
    items: [
      { type: "feature", text: "Vercel + Railway 배포 완료" },
      { type: "feature", text: "반응형 UI: 모바일 햄버거 메뉴 추가" },
      { type: "feature", text: "베타 테스트 안내 배너" },
      { type: "improvement", text: "영문 기사 자동 필터링" },
      { type: "improvement", text: "저작권 문구 자동 제거" },
      { type: "improvement", text: "SEO 최적화 (메타태그, 사이트맵)" },
      { type: "improvement", text: "Google/네이버 검색엔진 등록" },
      { type: "bugfix", text: "HuggingFaceEmbeddings 호환성 문제 해결" },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-02-03",
    highlights: "핵심 기능 완성",
    items: [
      { type: "feature", text: "기사 분석 API: URL 입력 → AI 분석" },
      { type: "feature", text: "북마크 기능: 기사 저장 및 관리" },
      { type: "feature", text: "관심 키워드: 맞춤 기사 우선 노출" },
      { type: "improvement", text: "단어 정의 형식 통일" },
      { type: "improvement", text: "요약 마크다운 렌더링" },
      { type: "improvement", text: "키워드 중복 필터링" },
      { type: "improvement", text: "기사 이미지 크롤링" },
    ],
  },
  {
    version: "0.0.1",
    date: "2026-02-01",
    highlights: "초기 릴리즈",
    items: [
      { type: "feature", text: "Spring Boot 백엔드 구축" },
      { type: "feature", text: "React + TypeScript 프론트엔드" },
      { type: "feature", text: "FastAPI RAG AI 엔진" },
      { type: "feature", text: "Naver 뉴스 크롤러" },
      { type: "feature", text: "Ollama + exaone3.5 LLM 연동" },
      { type: "feature", text: "MariaDB 데이터베이스 연동" },
    ],
  },
];

const typeConfig = {
  feature: {
    icon: Rocket,
    label: "새 기능",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  improvement: {
    icon: Wrench,
    label: "개선",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  bugfix: {
    icon: Bug,
    label: "버그 수정",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
};

export default function UpdatesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090a0c] text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090a0c]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </button>
          <span className="text-xs font-medium uppercase tracking-widest text-white/50">
            Release Notes
          </span>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        <motion.div
          className="mb-16 text-center"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            업데이트 내역
          </h1>
          <p className="mt-4 text-lg text-white/60">
            AI Reader의 발전 과정을 확인하세요
          </p>
        </motion.div>

        {/* 타임라인 */}
        <div className="relative">
          {/* 세로 라인 */}
          <div className="absolute left-[19px] top-0 h-full w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent sm:left-[23px]" />

          <div className="space-y-12">
            {releases.map((release, index) => (
              <motion.div
                key={release.version}
                className="relative pl-12 sm:pl-16"
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* 버전 원형 마커 */}
                <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#12141a] text-xs font-bold sm:h-12 sm:w-12 sm:text-sm">
                  v{release.version.split(".")[1]}
                </div>

                {/* 릴리즈 카드 */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                  {/* 헤더 */}
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold text-white sm:text-2xl">
                      v{release.version}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                      <Calendar className="h-3 w-3" />
                      {release.date}
                    </span>
                  </div>

                  {release.highlights && (
                    <p className="mb-5 text-sm text-white/50">
                      {release.highlights}
                    </p>
                  )}

                  {/* 변경사항 목록 */}
                  <ul className="space-y-2.5">
                    {release.items.map((item, itemIndex) => {
                      const config = typeConfig[item.type];
                      const Icon = config.icon;
                      return (
                        <li
                          key={itemIndex}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${config.bg}`}
                          >
                            <Icon className={`h-3 w-3 ${config.color}`} />
                          </span>
                          <span className="text-white/80">{item.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 하단 CTA */}
        <motion.div
          className="mt-20 text-center"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-white/40">더 많은 기능이 곧 추가됩니다</p>
          <button
            onClick={() => navigate("/experience")}
            className="mt-6 rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            서비스 체험하기
          </button>
        </motion.div>
      </main>
    </div>
  );
}

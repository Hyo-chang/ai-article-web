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
    version: "0.8.0",
    date: "2026-03-09",
    highlights: "카테고리 분류 정확도 개선",
    items: [
      { type: "improvement", text: "기사 카테고리 분류 정확도 개선: 크롤링 키워드 기반 카테고리 자동 지정" },
      { type: "improvement", text: "세계/정치/경제 등 카테고리 혼용 오류 수정 (이란·중동 뉴스 세계 카테고리로 정확 분류)" },
      { type: "feature", text: "관리자 기능: 제목 키워드 기반 기존 기사 카테고리 일괄 재분류 (653건 수정)" },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-03-09",
    highlights: "Railway 배포 안정화",
    items: [
      { type: "improvement", text: "Railway 빌드 실패 완전 해결: KOMORAN(JitPack) 의존성 제거" },
      { type: "improvement", text: "Dockerfile 멀티스테이지 빌드 적용으로 배포 안정성 향상" },
      { type: "bugfix", text: "admin_job_run 테이블 자동 생성 추가" },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-03-06",
    highlights: "이메일 구독 알림",
    items: [
      { type: "feature", text: "이메일 구독 알림: 관심 카테고리 기반 기사 3개를 매일 원하는 시간에 발송" },
      { type: "feature", text: "마이페이지에서 구독 ON/OFF 및 발송 시간(06~22시) 직접 설정 가능" },
      { type: "bugfix", text: "열람 기록 404 오류 수정" },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-03-04",
    highlights: "SEO 강화 및 AdSense 준비",
    items: [
      { type: "feature", text: "About 페이지 추가 (/about)" },
      { type: "improvement", text: "동적 canonical 태그 적용으로 Google 중복 색인 방지" },
      { type: "improvement", text: "ads.txt 추가 (Google AdSense 인증)" },
      { type: "improvement", text: "SitemapController 성능 개선 (DB 필터링, HTTP 캐싱)" },
      { type: "improvement", text: "브랜드명 통일: AI Reader → AHAread" },
      { type: "bugfix", text: "짧은 기사(100자 미만) 필터링으로 저품질 기사 차단" },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-02-26",
    highlights: "인기 기사 & 급상승 키워드 기능",
    items: [
      { type: "feature", text: "인기 기사: 네이버 뉴스 랭킹 기준 실시간 인기 기사 표시" },
      { type: "feature", text: "급상승 키워드: 인기 기사에서 추출한 트렌드 키워드 표시" },
      { type: "feature", text: "Google 로그인: 구글 계정으로 간편 로그인 가능" },
      { type: "feature", text: "AHA 로고: 새로운 브랜드 로고 및 'Article Highlights with AI' 태그라인 추가" },
      { type: "improvement", text: "인기 기사/키워드 5-6개씩 슬라이드 페이지네이션" },
      { type: "improvement", text: "좌우 화살표 및 페이지 인디케이터 추가" },
      { type: "improvement", text: "키워드 추출 정확도 개선: 불용어 필터링 강화" },
      { type: "improvement", text: "복합 명사 정리: '오늘이사회' → '이사회' 자동 분리" },
      { type: "bugfix", text: "프로필 이미지 로그인 시 불러오지 못하던 문제 수정" },
    ],
  },
  {
    version: "0.3.5",
    date: "2026-02-18",
    highlights: "데이터베이스 인프라 개선",
    items: [
      { type: "feature", text: "Railway MySQL로 데이터베이스 이전: 더 안정적인 서비스" },
      { type: "improvement", text: "클라우드 DB 적용: 디스크 공간 문제 해결" },
      { type: "improvement", text: "데이터베이스 연결 안정성 향상" },
      { type: "bugfix", text: "서버 502 에러 해결" },
    ],
  },
  {
    version: "0.3.4",
    date: "2026-02-17",
    highlights: "커스텀 도메인 및 SEO 최적화",
    items: [
      { type: "feature", text: "커스텀 도메인 연결: aharead.com으로 접속 가능" },
      { type: "feature", text: "Cloudflare CDN 적용: 더 빠른 로딩 속도" },
      { type: "improvement", text: "SEO 최적화: prerender.io 연동으로 검색엔진 크롤링 개선" },
      { type: "improvement", text: "네이버 서치어드바이저 등록 및 사이트맵 제출" },
      { type: "improvement", text: "구글 서치콘솔 등록 및 사이트맵 제출" },
      { type: "improvement", text: "검색봇(Googlebot, Yeti) 접근 허용 규칙 추가" },
    ],
  },
  {
    version: "0.3.3",
    date: "2026-02-16",
    highlights: "AI 채팅 UI 개선",
    items: [
      { type: "improvement", text: "AI 채팅 색상 테마를 indigo/purple로 통일" },
      { type: "improvement", text: "채팅창 리사이즈 핸들을 왼쪽 위로 이동 (사용성 개선)" },
      { type: "improvement", text: "다크모드 채팅 입력창 배경색 강화 (가독성 향상)" },
      { type: "bugfix", text: "채팅 입력창 및 사용자 메시지 텍스트를 검정색으로 변경 (가독성 대폭 개선)" },
      { type: "bugfix", text: "AI 응답 메시지 다크모드 대비 개선" },
    ],
  },
  {
    version: "0.3.2",
    date: "2026-02-12",
    highlights: "내가 분석한 기사 기능 및 버그 수정",
    items: [
      { type: "feature", text: "내가 분석한 기사: 분석 결과를 마이페이지에서 다시 확인 가능" },
      { type: "feature", text: "분석 결과 전용 페이지: 요약, 원문, 키워드, 단어 해석 한눈에 보기" },
      { type: "feature", text: "비로그인 사용자도 분석 결과 페이지 동일하게 이용 가능" },
      { type: "bugfix", text: "분석하기 결과에서 기사 원문(본문)이 표시되지 않던 문제 수정" },
    ],
  },
  {
    version: "0.3.1",
    date: "2026-02-11",
    highlights: "게시판 인증 버그 수정 및 안정화",
    items: [
      { type: "bugfix", text: "게시판 글쓰기/댓글/좋아요 401 인증 오류 수정 (JWT 타입 불일치 해결)" },
      { type: "bugfix", text: "프로필 이미지 업로드 500 오류 수정 (DB 컬럼 VARCHAR→LONGTEXT)" },
      { type: "bugfix", text: "커뮤니티 '돌아가기' 버튼이 홈으로 정상 이동하도록 수정" },
      { type: "improvement", text: "게시판 전체 기능 정상 작동 확인 (글쓰기, 수정, 삭제, 댓글, 대댓글, 좋아요)" },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-02-10",
    highlights: "커뮤니티 게시판 기능",
    items: [
      { type: "feature", text: "커뮤니티 게시판: 카테고리별 게시판 (자유, 질문, 정보공유, 후기)" },
      { type: "feature", text: "게시글 CRUD: 작성, 수정, 삭제, 검색 기능" },
      { type: "feature", text: "댓글/대댓글: 게시글에 댓글 및 대댓글 작성 가능" },
      { type: "feature", text: "좋아요 기능: 게시글과 댓글에 좋아요 표시" },
      { type: "improvement", text: "사이드바에 커뮤니티 메뉴 추가" },
      { type: "improvement", text: "로그인 사용자만 글쓰기 가능 (비로그인 시 안내)" },
      { type: "improvement", text: "페이지네이션 지원" },
    ],
  },
  {
    version: "0.2.2",
    date: "2026-02-07",
    highlights: "AI 채팅, 프로필 이미지, 검색 고도화",
    items: [
      { type: "feature", text: "AI 채팅 기능: 기사 본문을 드래그하여 AI에게 질문 가능" },
      { type: "feature", text: "프로필 이미지 업로드: 마이페이지에서 프로필 사진 변경 가능 (2MB 제한)" },
      { type: "feature", text: "검색 기능 고도화: 제목뿐만 아니라 기사 본문 내용까지 검색" },
      { type: "improvement", text: "검색 결과 초기화 버튼 추가: 검색 후 '초기화' 버튼으로 쉽게 리셋" },
      { type: "improvement", text: "AI Summary 섹션에 드래그 질문 안내 문구 추가" },
      { type: "improvement", text: "검색창 플레이스홀더 변경: '제목 또는 내용 검색'" },
      { type: "bugfix", text: "검색 초기화 시 버튼이 바로 사라지도록 수정" },
    ],
  },
  {
    version: "0.2.1",
    date: "2026-02-07",
    highlights: "다크 모드 지원",
    items: [
      { type: "feature", text: "다크 모드 / 라이트 모드 테마 전환 기능" },
      { type: "feature", text: "시스템 테마 자동 감지 (OS 설정 연동)" },
      { type: "improvement", text: "사이드바에 테마 토글 버튼 추가" },
      { type: "improvement", text: "홈페이지, 기사 상세, 마이페이지 다크 모드 대응" },
      { type: "improvement", text: "next-themes + Tailwind dark: prefix 활용" },
    ],
  },
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
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <motion.div
          className="mb-10 text-center sm:mb-16"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            업데이트 내역
          </h1>
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-6">
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

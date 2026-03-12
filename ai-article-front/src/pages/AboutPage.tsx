import { useNavigate } from "react-router-dom";
import { useCanonical } from "../hooks/useCanonical";
import { useNoAds } from "../hooks/useNoAds";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  {
    title: "AI 기사 요약",
    description:
      "복잡한 뉴스 기사를 AI가 핵심 내용만 추려 3줄로 요약합니다. 바쁜 일상 속에서도 중요한 정보를 빠르게 파악할 수 있습니다.",
  },
  {
    title: "핵심 키워드 추출",
    description:
      "기사에서 중요한 키워드를 자동으로 추출하고, 관련 기사와 트렌드를 한눈에 파악할 수 있도록 연결해 드립니다.",
  },
  {
    title: "단어 해설",
    description:
      "기사 속 전문 용어, 신조어, 낯선 개념을 AI가 자동으로 감지하여 쉽게 풀어 설명합니다. 배경 지식 없이도 깊은 이해가 가능합니다.",
  },
  {
    title: "대화형 AI 분석",
    description:
      "기사를 읽다가 궁금한 점이 생기면 AI에게 바로 질문하세요. 기사 내용을 바탕으로 맥락에 맞는 답변을 제공합니다.",
  },
  {
    title: "URL 실시간 분석",
    description:
      "읽고 싶은 기사의 URL을 붙여넣으면 AI가 즉시 분석을 시작합니다. 어떤 뉴스 사이트의 기사든 분석 가능합니다.",
  },
  {
    title: "맞춤형 뉴스 피드",
    description:
      "관심 키워드를 설정하면 나에게 맞는 기사를 우선적으로 추천합니다. 북마크와 열람 기록으로 나만의 뉴스 아카이브를 만들어 보세요.",
  },
];

export default function AboutPage() {
  const navigate = useNavigate();
  useCanonical("/about");
  useNoAds();

  return (
    <div className="min-h-screen bg-[#090a0c] text-white">
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
            About AHAread
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Hero */}
        <motion.div
          className="mb-14 text-center sm:mb-20"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            AHAread 소개
          </h1>
          <p className="mt-4 text-lg text-white/60">
            AI 기술로 뉴스를 더 쉽고 깊게 읽는 방법
          </p>
        </motion.div>

        {/* 서비스 소개 */}
        <motion.div
          className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">
            AHAread란 무엇인가요?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-white/70">
            <p>
              AHAread는 매일 쏟아지는 수많은 뉴스 기사 속에서 진짜 중요한 정보를
              빠르게 파악할 수 있도록 돕는 AI 기반 뉴스 분석 플랫폼입니다.
            </p>
            <p>
              인공지능이 기사를 자동으로 수집하고 요약·분석하여, 독자가 핵심
              내용을 짧은 시간 안에 이해할 수 있도록 구성합니다. 단순한 요약을
              넘어 키워드 추출, 전문 용어 해설, 대화형 AI 질의응답 기능을 통해
              뉴스를 더욱 깊이 있게 소비할 수 있는 경험을 제공합니다.
            </p>
            <p>
              정치, 경제, 사회, 문화, IT, 세계, 연예 등 7개 카테고리의 뉴스를
              매일 수집하여 국내외 주요 이슈를 한 곳에서 확인할 수 있습니다.
            </p>
          </div>
        </motion.div>

        {/* 만든 이유 */}
        <motion.div
          className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">
            왜 만들었나요?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-white/70">
            <p>
              현대인은 하루에도 수백 개의 뉴스 알림을 받습니다. 하지만 대부분의
              기사는 제목만 보거나 스크롤을 빠르게 내리며 지나치게 됩니다.
              정보는 넘쳐나지만, 정작 깊이 있는 이해는 점점 어려워지고 있습니다.
            </p>
            <p>
              AHAread는 이 문제를 해결하기 위해 탄생했습니다. AI가 기사의
              핵심만 정리해주고, 어려운 용어를 쉽게 풀어주며, 궁금한 점을 바로
              질문할 수 있도록 하여 뉴스 리딩의 질을 높이는 것이 목표입니다.
            </p>
          </div>
        </motion.div>

        {/* 주요 기능 */}
        <motion.div
          className="mb-8"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <h2 className="mb-6 text-xl font-bold text-white">주요 기능</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <h3 className="mb-2 font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 운영 정보 */}
        <motion.div
          className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">운영 정보</h2>
          <div className="space-y-2 text-sm leading-relaxed text-white/70">
            <p>• 서비스명: AHAread</p>
            <p>• 서비스 URL: https://www.aharead.com</p>
            <p>• 운영 시작: 2026년 2월</p>
            <p>• 문의 이메일: wee7846@gmail.com</p>
            <p className="pt-2 text-white/50">
              서비스 관련 문의, 오류 제보, 개선 제안은 언제든지 이메일로
              연락 주시기 바랍니다.
            </p>
          </div>
        </motion.div>

        {/* 하단 버튼 */}
        <motion.div
          className="mt-16 flex flex-wrap items-center justify-center gap-4"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={() => navigate("/privacy")}
            className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            개인정보처리방침
          </button>
          <button
            onClick={() => navigate("/terms")}
            className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            이용약관
          </button>
        </motion.div>
      </main>
    </div>
  );
}

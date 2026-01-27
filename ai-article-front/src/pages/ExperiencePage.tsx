import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const slideVariants = {
  left: {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
};

const heroBackground = "bg-[#141414]";

const pageBackground = "bg-[#090a0c]";
const aboutBackground =
  "bg-gradient-to-b from-[#0d0d0d] via-[#121212] to-[#151515]";
const featureBackground =
  "bg-gradient-to-b from-[#12141c] via-[#0c0f16] to-[#08090d]";
const reviewBackground =
  "bg-gradient-to-b from-[#11131a] via-[#0d1016] to-[#08090d]";

const demoCards = [
  {
    title: "AI 요약 데모",
    description: "기사 전문을 입력하면 3단계 구조로 핵심 요약을 생성합니다.",
  },
  {
    title: "키워드 탐색",
    description:
      "전 세계 트렌드도 한눈에 파악할 수 있도록 핵심 키워드를 추출합니다.",
  },
  {
    title: "단어 설명",
    description: "전문용어나 신조어 등 모르는 단어를 AI가 판단하여 단어의 의미를 설명합니다.",
  },
  {
    title: "대화형 분석",
    description:
      "궁금한 점이 생기면 AI에게 바로 질문하세요. 맥락을 이해한 답변을 제공합니다.",
  },
] as const;

const featureList = [
  {
    title: "AI 요약 엔진",
    description:
      "복잡한 기사도 핵심 메시지만 추출하여 30초 만에 이해할 수 있게 구성합니다.",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "프리미엄 키워드 분석",
    description:
      "문맥과 관련성을 고려해 키워드를 정리하고, 연관된 흐름까지 짚어 드립니다.",
    image:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "맞춤형 인사이트",
    description:
      "읽는 습관을 학습해 지금 필요한 관점을 제안하고 이어서 읽을 콘텐츠를 추천합니다.",
    image:
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

export default function ExperiencePage() {
  const navigate = useNavigate();

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden ${pageBackground} text-white`}
    >
      {/* Hero Section */}
      <section
        className={`${heroBackground} relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24`}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center translate-y-[-2cm]">
          <span className="select-none font-['Playfair_Display',serif] text-[8rem] font-bold tracking-tight text-[#dcdcdc] opacity-10 sm:text-[10rem] md:text-[12rem]">
            EASY READ
          </span>
        </div>
        <motion.div
          className="relative z-10 mx-auto max-w-4xl text-center text-white"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <span className="font-light text-sm text-gray-400">
              AI that makes understanding news effortless.
            </span>
            <span className="w-full max-w-[80%] border-t border-gray-500/60" />
          </div>

          <div className="mt-10 space-y-8 sm:space-y-10">
            <div className="space-y-6">
              <motion.p
                className="text-center text-4xl font-semibold tracking-[0.3em] text-gray-300 sm:text-5xl"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                AI가 주도하는
              </motion.p>

              <motion.h1
                className="text-center text-6xl font-semibold tracking-tight text-white sm:text-7xl md:text-8xl"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              >
                <span className="relative inline-block">
                  <span className="absolute inset-x-0 bottom-0 h-2 rounded-full bg-white/15" />
                  <motion.span
                    className="relative inline-block origin-bottom"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    새로운 뉴스 리딩
                  </motion.span>
                </span>
              </motion.h1>
            </div>

            <motion.p
              className="text-center text-lg leading-relaxed text-gray-400 sm:text-xl"
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              AI Reader는 복잡한 정보를 선별해 정돈하고, 당신의 인사이트를 넓혀줄 경험을 제공합니다.
            </motion.p>
          </div>

          <motion.button
            type="button"
            onClick={() => navigate("/home")}
            className="group mt-12 inline-flex items-center justify-center rounded-full bg-[#dcdcdc] px-12 py-3.5 text-lg font-semibold text-[#0f0f0f] shadow-[0_14px_28px_rgba(220,220,220,0.25)] transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_40px_rgba(255,255,255,0.35)]"
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="relative inline-flex items-center gap-4">
              <span className="absolute inset-0 rounded-full bg-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative font-semibold">지금 체험해보기</span>
              <motion.span
                className="relative text-2xl"
                animate={{ x: 0 }}
                whileHover={{ x: 14 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                →
              </motion.span>
            </span>
          </motion.button>
        </motion.div>
      </section>

      {/* About & Demo Section */}
      <section
        className={`${aboutBackground} relative flex min-h-screen items-center px-6 py-24`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/85 via-[#121215]/75 to-[#09090c]/90" />
          <div className="absolute left-1/2 top-16 h-28 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/25 to-transparent" />
          <div className="absolute left-[12%] bottom-[14%] h-40 w-40 rounded-full bg-white/10 blur-3xl opacity-[0.18]" />
          <div className="absolute right-[16%] top-[20%] h-48 w-48 rounded-full bg-white/8 blur-3xl opacity-[0.12]" />
          <div className="absolute inset-0 flex items-start justify-center pt-12 sm:pt-16">
            <span className="select-none font-['Playfair_Display',serif] text-[5rem] font-semibold tracking-tight text-white/5 sm:text-[7.5rem]">
              WHY ARE WE DOING
            </span>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-16 px-4 text-center">
          <motion.div
            className="flex flex-col items-center gap-5"
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
              About
            </span>
            <h2 className="text-5xl font-bold tracking-tight text-[#f1f1f1] sm:text-6xl">
              정보의 홍수 속에서 길을 찾다
            </h2>
            <p className="mx-auto max-w-[640px] text-sm leading-relaxed text-gray-400 sm:text-base">
              AI Reader는 방대한 문장을 정제해 의미를 구조화하고, 지금 알아야 할 핵심만 남겨 전달합니다. 균형 잡힌 시각과 깊이 있는 인사이트를 통해, 정보의 홍수 속에서도 스마트한 판단을 돕습니다.
            </p>
          </motion.div>

          <div className="grid w-full max-w-4xl grid-cols-1 gap-7 md:grid-cols-2">
            {demoCards.map((card, index) => (
              <motion.div
                key={card.title}
                className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-left text-[#f5f5f5] shadow-[0_16px_44px_rgba(6,8,14,0.5)] backdrop-blur-sm transition-all duration-150 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_26px_50px_rgba(8,10,18,0.55)]"
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: 0.08 * index,
                }}
                whileHover={{
                  scale: 1.08,
                  y: -10,
                  transition: { duration: 0.08, ease: "easeOut" },
                }}
                whileTap={{
                  scale: 0.95,
                  transition: { duration: 0.08, ease: "easeOut" },
                }}
              >
                <span className="h-px w-10 bg-gradient-to-r from-white/60 via-white/20 to-transparent" />
                <h3 className="text-lg font-semibold text-white">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Section */}
      <section
        className={`${featureBackground} relative flex min-h-screen items-center px-6 py-24`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#090a0f]/90 via-[#0c0f16]/85 to-[#08090d]/95" />
          <div className="absolute inset-0 flex items-start justify-center pt-[calc(4rem+1.8cm)] sm:pt-[calc(5rem+1.8cm)]">
            <span className="select-none font-['Playfair_Display',serif] text-[4.5rem] font-semibold tracking-tight text-white/5 sm:text-[7rem]">
              WHAT'S NEXT
            </span>
          </div>
          <div className="absolute left-[18%] top-[18%] h-56 w-56 rounded-full bg-white/12 blur-3xl opacity-[0.16]" />
          <div className="absolute right-[12%] bottom-[14%] h-64 w-64 rounded-full bg-white/10 blur-3xl opacity-[0.14]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-16 px-4 text-center">
          <motion.div
            className="flex flex-col items-center gap-4 text-white"
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Future
            </span>
            <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
              AI가 그려내는 다음 장면
            </h2>
            <p className="mx-auto max-w-[720px] text-sm leading-relaxed text-white/65 sm:text-base">
              다가오는 업데이트는 더욱 정교한 분석과 빠른 통찰을 약속합니다. 데이터를
              연결하고 패턴을 예측하며, 한발 앞선 뉴스 이해를 지원합니다.
            </p>
          </motion.div>

          <div className="grid w-full gap-7 text-left text-white md:grid-cols-3">
            {featureList.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-[0_24px_48px_rgba(6,10,18,0.55)] backdrop-blur-sm"
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: 0.08 * index,
                }}
                whileHover={{
                  scale: 1.06,
                  y: -12,
                  transition: { duration: 0.1, ease: "easeOut" },
                }}
                whileTap={{
                  scale: 0.95,
                  transition: { duration: 0.08, ease: "easeOut" },
                }}
              >
                <div className="absolute inset-0">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-full w-full object-cover opacity-35 transition duration-200 group-hover:opacity-55"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0b0d16]/90 via-[#111422]/70 to-[#1a2335]/60" />
                </div>
                <div className="relative flex h-full flex-col gap-5 p-7">
                  <span className="h-px w-10 bg-gradient-to-r from-white/70 via-white/25 to-transparent" />
                  <h3 className="text-2xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/70">
                    {feature.description}
                  </p>
                  <span className="mt-auto text-xs uppercase tracking-[0.3em] text-white/50">
                    
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section (리뷰 섹션 대체) */}
      <section
        className={`${reviewBackground} relative flex min-h-screen items-center px-6 py-24`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[15%] top-16 h-56 w-56 rounded-full bg-[#2563eb]/12 blur-3xl" />
          <div className="absolute right-[20%] bottom-10 h-72 w-72 rounded-full bg-[#38bdf8]/14 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl text-white">
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">
              FAQ
            </p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              자주 묻는 질문
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/70">
              서비스 준비 중에 많이 받는 질문을 정리했어요.
            </p>
          </motion.div>

          <div className="mt-12 space-y-4">
            {[
              {
                q: "요약의 출처와 링크가 제공되나요?",
                a: "네. 기사 원문 링크와 언론사 정보가 함께 표시됩니다.",
              },
              {
                q: "개인정보는 어떻게 처리되나요?",
                a: "로그인/맞춤 추천이 필요한 최소한의 정보만 암호화해 보관합니다.",
              },
              {
                q: "팀/기업용 기능이 있나요?",
                a: "공유 링크, 워크스페이스, 권한 관리 기능을 준비 중입니다.",
              },
              {
                q: "모바일에서도 잘 동작하나요?",
                a: "반응형 레이아웃으로 모바일/태블릿/데스크톱을 지원합니다.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.q}
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: 0.06 * i,
                }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <p className="text-left text-base font-semibold text-white">
                  <span className="mr-2 text-[#93c5fd]">Q.</span>
                  {item.q}
                </p>
                <p className="mt-3 pl-6 text-left text-white/75">
                  <span className="mr-2 font-semibold text-white">A.</span>
                  {item.a}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex justify-center pt-12"
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <motion.button
              type="button"
              onClick={() => navigate("/home")}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-12 py-3.5 text-lg font-semibold text-white shadow-[0_18px_35px_rgba(12,18,28,0.35)] transition duration-200 hover:-translate-y-1 hover:border-white/40 hover:bg-white/15"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              체험 계속하기
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

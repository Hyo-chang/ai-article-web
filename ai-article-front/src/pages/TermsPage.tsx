import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const sections = [
  {
    title: "제1조 (목적)",
    content: [
      "본 약관은 AI Reader(이하 \"서비스\")가 제공하는 AI 기반 뉴스 기사 분석 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
    ],
  },
  {
    title: "제2조 (서비스의 내용)",
    content: [
      "AI Reader는 다음과 같은 서비스를 제공합니다.",
      "• 뉴스 기사 자동 수집 및 카테고리 분류",
      "• AI 기반 기사 요약 및 핵심 키워드 추출",
      "• 단어 해석 및 정의 제공",
      "• 기사 북마크 및 열람 이력 관리",
      "• 사용자 맞춤 관심 키워드 설정",
      "• URL 입력을 통한 실시간 기사 분석",
      "• 커뮤니티 게시판 (게시글, 댓글, 좋아요)",
    ],
  },
  {
    title: "제3조 (회원가입 및 계정)",
    content: [
      "• 이용자는 이메일 주소와 비밀번호로 회원가입할 수 있습니다.",
      "• 회원가입 시 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.",
      "• 계정 정보의 관리 책임은 이용자에게 있으며, 제3자에게 계정을 양도하거나 대여할 수 없습니다.",
    ],
  },
  {
    title: "제4조 (이용자의 의무)",
    content: [
      "이용자는 다음 행위를 해서는 안 됩니다.",
      "• 타인의 개인정보를 수집, 저장, 공개하는 행위",
      "• 서비스의 정상적인 운영을 방해하는 행위",
      "• 자동화된 수단(봇, 스크래퍼 등)을 이용한 대량 접근",
      "• 게시판에 광고, 스팸, 불법 정보를 게시하는 행위",
      "• 다른 이용자에 대한 비방, 욕설, 혐오 표현",
      "• 기타 법령 또는 공서양속에 반하는 행위",
    ],
  },
  {
    title: "제5조 (지적재산권)",
    content: [
      "• 서비스가 제공하는 AI 분석 결과, UI 디자인, 소프트웨어 등에 대한 지적재산권은 AI Reader에 귀속됩니다.",
      "• 수집된 뉴스 기사의 저작권은 해당 언론사에 귀속되며, AI Reader는 공정 이용 범위 내에서 요약 및 분석 목적으로만 활용합니다.",
      "• 이용자가 게시판에 작성한 게시물의 저작권은 작성자에게 있습니다.",
    ],
  },
  {
    title: "제6조 (서비스의 변경 및 중단)",
    content: [
      "• AI Reader는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.",
      "• 천재지변, 시스템 장애 등 불가항력적인 사유로 서비스가 중단될 수 있으며, 이에 대해 책임을 지지 않습니다.",
      "• 현재 베타 서비스 기간으로, 일부 기능이 불안정할 수 있습니다.",
    ],
  },
  {
    title: "제7조 (면책 조항)",
    content: [
      "• AI가 생성한 요약 및 분석 결과는 참고용이며, 정확성을 보장하지 않습니다.",
      "• 뉴스 기사의 내용에 대한 책임은 해당 언론사에 있습니다.",
      "• 이용자가 서비스를 통해 얻은 정보를 활용하여 발생한 손해에 대해 AI Reader는 책임을 지지 않습니다.",
      "• 게시판에 게시된 내용에 대한 책임은 작성자 본인에게 있습니다.",
    ],
  },
  {
    title: "제8조 (분쟁 해결)",
    content: [
      "• 서비스 이용과 관련하여 분쟁이 발생한 경우, 쌍방 간 합의에 의해 해결합니다.",
      "• 합의가 이루어지지 않을 경우, 관할 법원에서 해결합니다.",
    ],
  },
  {
    title: "제9조 (약관의 개정)",
    content: [
      "• 시행일: 2026년 2월 12일",
      "• 본 약관은 필요에 따라 개정될 수 있으며, 개정 시 서비스 내 공지를 통해 안내합니다.",
      "• 문의: wee7846@gmail.com",
    ],
  },
];

export default function TermsPage() {
  const navigate = useNavigate();

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
            Terms of Service
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <motion.div
          className="mb-16 text-center"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            이용약관
          </h1>
          <p className="mt-4 text-lg text-white/60">
            AI Reader 서비스 이용에 관한 약관
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <h2 className="mb-4 text-lg font-bold text-white">
                {section.title}
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-white/70">
                {section.content.map((line, lineIndex) => (
                  <p key={lineIndex}>{line}</p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 text-center"
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
            개인정보처리방침 보기
          </button>
        </motion.div>
      </main>
    </div>
  );
}

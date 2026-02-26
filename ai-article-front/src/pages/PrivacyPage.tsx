import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const sections = [
  {
    title: "1. 수집하는 개인정보 항목",
    content: [
      "AHAread는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.",
      "• 회원가입 시: 이메일 주소, 비밀번호(암호화 저장), 닉네임",
      "• 서비스 이용 시: 기사 열람 이력, 북마크 목록, 관심 키워드, 게시글/댓글 내용",
      "• 자동 수집: 접속 로그, 쿠키, 브라우저 종류",
    ],
  },
  {
    title: "2. 개인정보의 수집 및 이용 목적",
    content: [
      "수집된 개인정보는 다음의 목적을 위해 이용됩니다.",
      "• 회원 관리: 회원 식별, 로그인 인증, 계정 관리",
      "• 서비스 제공: 맞춤형 뉴스 추천, AI 기사 분석, 북마크 및 열람 이력 관리",
      "• 서비스 개선: 이용 통계 분석, 서비스 품질 향상",
    ],
  },
  {
    title: "3. 개인정보의 보유 및 이용 기간",
    content: [
      "• 회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.",
      "• 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.",
      "  - 로그인 기록: 3개월 (통신비밀보호법)",
    ],
  },
  {
    title: "4. 개인정보의 제3자 제공",
    content: [
      "AHAread는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.",
      "다만, 아래의 경우에는 예외로 합니다.",
      "• 이용자가 사전에 동의한 경우",
      "• 법령에 의해 요구되는 경우",
    ],
  },
  {
    title: "5. 쿠키(Cookie)의 사용",
    content: [
      "AHAread는 로그인 상태 유지 및 사용자 환경 설정(다크 모드 등)을 위해 쿠키 및 로컬 스토리지를 사용합니다.",
      "• 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.",
    ],
  },
  {
    title: "6. 개인정보의 안전성 확보 조치",
    content: [
      "• 비밀번호는 단방향 암호화(BCrypt)하여 저장합니다.",
      "• JWT 토큰 기반 인증으로 세션 보안을 유지합니다.",
      "• HTTPS를 통한 데이터 전송 암호화를 적용합니다.",
    ],
  },
  {
    title: "7. 이용자의 권리",
    content: [
      "이용자는 언제든지 다음의 권리를 행사할 수 있습니다.",
      "• 개인정보 열람, 수정, 삭제 요청",
      "• 회원 탈퇴를 통한 개인정보 처리 정지 요청",
      "• 마이페이지에서 닉네임, 프로필 이미지, 관심 키워드 등을 직접 관리할 수 있습니다.",
    ],
  },
  {
    title: "8. 개인정보 보호책임자",
    content: [
      "• 서비스명: AHAread",
      "• 이메일: wee7846@gmail.com",
      "• 개인정보 관련 문의사항은 위 이메일로 연락해 주시기 바랍니다.",
    ],
  },
  {
    title: "9. 개정 이력",
    content: [
      "• 시행일: 2026년 2월 12일",
      "• 본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 공지사항을 통해 안내드립니다.",
    ],
  },
];

export default function PrivacyPage() {
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
            Privacy Policy
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <motion.div
          className="mb-10 text-center sm:mb-16"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            개인정보처리방침
          </h1>
          <p className="mt-4 text-lg text-white/60">
            AHAread의 개인정보 처리에 관한 안내
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-6"
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
            onClick={() => navigate("/terms")}
            className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            이용약관 보기
          </button>
        </motion.div>
      </main>
    </div>
  );
}

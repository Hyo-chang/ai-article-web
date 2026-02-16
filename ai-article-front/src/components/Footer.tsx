import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-[#0a0b0d]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* 로고 및 저작권 */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              AI Reader
            </span>
            <p className="text-xs text-gray-500 dark:text-white/50">
              &copy; {currentYear} AI Reader. All rights reserved.
            </p>
          </div>

          {/* 링크 */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              to="/privacy"
              className="text-gray-600 transition hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
            >
              개인정보처리방침
            </Link>
            <span className="text-gray-300 dark:text-white/20">|</span>
            <Link
              to="/terms"
              className="text-gray-600 transition hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
            >
              이용약관
            </Link>
            <span className="text-gray-300 dark:text-white/20">|</span>
            <a
              href="mailto:wee7846@gmail.com"
              className="text-gray-600 transition hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
            >
              문의하기
            </a>
          </nav>
        </div>

        {/* 부가 정보 */}
        <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-white/10">
          <p className="text-xs text-gray-400 dark:text-white/40">
            AI Reader는 AI 기술을 활용하여 뉴스 기사를 요약하고 분석하는 서비스입니다.
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> · </span>
            분석 결과는 참고용이며 정확성을 보장하지 않습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}

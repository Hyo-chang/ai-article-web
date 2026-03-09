import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [contactOpen, setContactOpen] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setContactOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-[#0a0b0d]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* 로고 및 저작권 */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              AHAread
            </span>
            <p className="text-xs text-gray-500 dark:text-white/50">
              &copy; {currentYear} AHAread. All rights reserved.
            </p>
          </div>

          {/* 링크 */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              to="/about"
              className="text-gray-600 transition hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
            >
              소개
            </Link>
            <span className="text-gray-300 dark:text-white/20">|</span>
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
            <div ref={contactRef} className="relative">
              <button
                onClick={() => setContactOpen((v) => !v)}
                className="text-gray-600 transition hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
              >
                문의하기
              </button>
              {contactOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#1a1b1f]">
                  <a
                    href="mailto:wee7846@gmail.com"
                    className="flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-white/80 dark:hover:bg-white/5"
                    onClick={() => setContactOpen(false)}
                  >
                    ✉️ 이메일로 문의
                  </a>
                  <Link
                    to="/community"
                    className="flex items-center gap-2 rounded-b-xl px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-white/80 dark:hover:bg-white/5"
                    onClick={() => setContactOpen(false)}
                  >
                    💬 커뮤니티에서 문의
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* 부가 정보 */}
        <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-white/10">
          <p className="text-xs text-gray-400 dark:text-white/40">
            AHAread는 AI 기술을 활용하여 뉴스 기사를 요약하고 분석하는 서비스입니다.
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> · </span>
            분석 결과는 참고용이며 정확성을 보장하지 않습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}

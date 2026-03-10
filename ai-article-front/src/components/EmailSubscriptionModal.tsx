import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../services/AuthContext";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../lib/api";

type Phase = "idle" | "opening" | "form" | "submitting" | "closing" | "success";

type AuthUser = {
  token: string;
  userId?: number;
  email?: string;
  username?: string;
  nickname?: string;
};

const CATEGORIES = [
  { code: "100", name: "정치", emoji: "🏛️" },
  { code: "101", name: "경제", emoji: "💰" },
  { code: "102", name: "사회", emoji: "🌍" },
  { code: "103", name: "생활/문화", emoji: "🎭" },
  { code: "104", name: "세계", emoji: "🌐" },
  { code: "105", name: "IT/과학", emoji: "💻" },
  { code: "106", name: "연예", emoji: "🎬" },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

const CONTAINER_H = 700;
const ENV_H = 280;
const ENVELOPE_TOP = CONTAINER_H - ENV_H; // 420
const CARD_H = 400;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailSubscriptionModal({ isOpen, onClose }: Props) {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const typedUser = user as AuthUser | null;

  const [phase, setPhase] = useState<Phase>("idle");
  const [useExisting, setUseExisting] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [keywordTags, setKeywordTags] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [hour, setHour] = useState(9);
  const [error, setError] = useState("");
  const keywordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase("idle");
      setError("");
      setUseExisting(true);
      setSelectedCategories([]);
      setKeywordTags([]);
      setKeywordInput("");
      setHour(9);

      const t1 = setTimeout(() => setPhase("opening"), 350);
      const t2 = setTimeout(() => setPhase("form"), 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isOpen]);

  const flapOpen = ["opening", "form", "submitting"].includes(phase);
  const cardVisible = ["form", "submitting"].includes(phase);

  const toggleCategory = (code: string) => {
    setSelectedCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const addKeyword = (raw: string) => {
    const tokens = raw.split(",").map((k) => k.trim()).filter((k) => k && !keywordTags.includes(k));
    if (tokens.length > 0) {
      setKeywordTags((prev) => [...prev, ...tokens]);
    }
    setKeywordInput("");
  };

  const removeKeyword = (tag: string) => {
    setKeywordTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(keywordInput);
    } else if (e.key === "Backspace" && keywordInput === "" && keywordTags.length > 0) {
      setKeywordTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (!typedUser?.token) return;
    // 입력 중인 키워드도 반영
    const finalTags = [...keywordTags, ...keywordInput.split(",").map((k) => k.trim()).filter(Boolean)];
    setPhase("submitting");
    setError("");

    try {
      let emailKeywords: string | null = null;
      if (!useExisting) {
        const cats = selectedCategories
          .map((c) => CATEGORIES.find((cat) => cat.code === c)?.name ?? "")
          .filter(Boolean);
        const combined = [...cats, ...finalTags].join(",");
        emailKeywords = combined || null;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/mypage/email-subscription`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typedUser.token}`,
        },
        body: JSON.stringify({ subscribed: true, hour, emailKeywords }),
      });

      if (!res.ok) throw new Error("Failed");

      setPhase("closing");
      setTimeout(() => {
        setPhase("success");
        setTimeout(() => onClose(), 3200);
      }, 1050);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
      setPhase("form");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">

        {/* 배경 */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={onClose}
          style={{
            background:
              "radial-gradient(ellipse 85% 60% at 50% 55%, rgba(66,133,244,0.14) 0%, rgba(6,6,18,0.96) 62%)",
          }}
        />

        {/* 메인 컨테이너 */}
        <motion.div
          className="relative z-10"
          style={{ width: "min(480px, 93vw)", height: `${CONTAINER_H}px` }}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >

          {/* ══ 카드 (봉투 body 밖 절대 배치, z=5) ══ */}
          <motion.div
            className="absolute inset-x-4 overflow-y-auto"
            style={{
              top: 0,
              height: CARD_H,
              background: "#ffffff",
              borderRadius: 14,
              boxShadow: "0 28px 72px rgba(0,0,0,0.52), 0 4px 18px rgba(0,0,0,0.28)",
              zIndex: 5,
              transformOrigin: "50% 90%",
              // 스크롤바 숨기기
              scrollbarWidth: "none",
            }}
            initial={{ y: ENVELOPE_TOP + 14, rotate: -1.0, opacity: 0 }}
            animate={{
              y: cardVisible ? 8 : ENVELOPE_TOP + 14,
              rotate: cardVisible ? -2.5 : -1.0,
              opacity: cardVisible ? 1 : 0,
            }}
            transition={{ duration: 1.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 카드 상단 Gmail 4색 줄 */}
            <div style={{
              height: 4,
              background: "linear-gradient(90deg, #EA4335 0%, #FBBC04 33%, #34A853 66%, #4285F4 100%)",
              borderRadius: "14px 14px 0 0",
              flexShrink: 0,
            }} />

            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-center"
                style={{ height: CARD_H - 4 }}>
                <div className="text-5xl">✉️</div>
                <p className="text-gray-600 font-medium">
                  뉴스레터 구독은 로그인 후 이용할 수 있습니다.
                </p>
                <button
                  onClick={() => { onClose(); navigate("/login"); }}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  로그인하기
                </button>
              </div>
            ) : (
              <div className="p-4 pt-3">
                <AnimatePresence>
                  {cardVisible && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.4 }}
                    >
                      <h2 className="text-lg font-bold text-gray-900 mb-0.5">뉴스레터 구독</h2>
                      <p className="text-xs text-gray-400 mb-3">
                        매일 원하는 시간에 맞춤 기사를 보내드립니다
                      </p>

                      {/* 관심사 토글 */}
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-3 text-sm">
                        <button
                          className={`flex-1 py-2 font-medium transition ${
                            useExisting ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => setUseExisting(true)}
                        >
                          기존 관심사 사용
                        </button>
                        <button
                          className={`flex-1 py-2 font-medium transition ${
                            !useExisting ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => setUseExisting(false)}
                        >
                          직접 설정
                        </button>
                      </div>

                      {/* 직접 설정 영역 */}
                      {!useExisting && (
                        <div className="mb-3">
                          {/* 카테고리 — 수평 스크롤 */}
                          <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">카테고리</p>
                          <div
                            className="flex gap-1.5 mb-3"
                            style={{ overflowX: "auto", flexWrap: "nowrap", paddingBottom: 4, scrollbarWidth: "none" }}
                          >
                            {CATEGORIES.map((cat) => (
                              <button
                                key={cat.code}
                                onClick={() => toggleCategory(cat.code)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap flex-shrink-0 ${
                                  selectedCategories.includes(cat.code)
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "border-gray-200 text-gray-600 hover:border-indigo-300"
                                }`}
                              >
                                {cat.emoji} {cat.name}
                              </button>
                            ))}
                          </div>

                          {/* 키워드 태그 입력 */}
                          <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                            키워드{" "}
                            <span className="font-normal text-gray-400 normal-case">
                              (Enter 또는 쉼표로 추가)
                            </span>
                          </p>

                          {/* 태그 + 입력창 수평 스크롤 컨테이너 */}
                          <div
                            className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-400 transition mb-1"
                            style={{ overflowX: "auto", flexWrap: "nowrap", scrollbarWidth: "none", minHeight: 40 }}
                            onClick={() => keywordInputRef.current?.focus()}
                          >
                            {keywordTags.map((tag) => (
                              <span
                                key={tag}
                                className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200 whitespace-nowrap flex-shrink-0"
                              >
                                {tag}
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeKeyword(tag); }}
                                  className="text-indigo-400 hover:text-indigo-700 text-xs leading-none ml-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <input
                              ref={keywordInputRef}
                              type="text"
                              value={keywordInput}
                              onChange={(e) => setKeywordInput(e.target.value)}
                              onKeyDown={handleKeywordKeyDown}
                              onBlur={() => { if (keywordInput.trim()) addKeyword(keywordInput); }}
                              placeholder={keywordTags.length === 0 ? "예: 이란, 반도체, 삼성" : ""}
                              className="flex-1 text-sm outline-none min-w-20 bg-transparent"
                              style={{ minWidth: 80 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mb-3">
                            입력한 키워드를 포함하는 기사를 선별합니다
                          </p>
                        </div>
                      )}

                      {/* 발송 시간 */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">발송 시간</p>
                        <select
                          value={hour}
                          onChange={(e) => setHour(Number(e.target.value))}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-400"
                        >
                          {HOURS.map((h) => (
                            <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                      </div>

                      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

                      <button
                        onClick={handleSubmit}
                        disabled={phase === "submitting"}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        {phase === "submitting" ? "구독 중..." : "구독하기 ✉️"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* ══ 봉투 본체 (z=10) — flapOpen 시 위쪽 폴드 영역 숨김 ══ */}
          <div
            className="absolute inset-x-0 bottom-0 overflow-hidden"
            style={{
              height: ENV_H,
              zIndex: 10,
              borderRadius: 18,
              boxShadow:
                "0 -2px 0 rgba(0,0,0,0.06), 0 16px 60px rgba(0,0,0,0.4), 0 0 0 1.5px rgba(255,255,255,0.18)",
            }}
          >
            {/* 크림 종이 배경 */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(162deg, #FFFEF8 0%, #F4EFE3 100%)" }} />

            {/* Gmail 4색 줄 */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 5, zIndex: 4,
              background: "linear-gradient(90deg, #EA4335 0%, #FBBC04 33%, #34A853 66%, #4285F4 100%)",
            }} />

            {/* 좌 폴드 */}
            <div style={{
              position: "absolute", inset: 0,
              clipPath: "polygon(0 0, 0 100%, 50% 53%)",
              background: "linear-gradient(90deg, #DDD7C6 0%, #EAE5D5 100%)",
            }} />
            {/* 우 폴드 */}
            <div style={{
              position: "absolute", inset: 0,
              clipPath: "polygon(100% 0, 100% 100%, 50% 53%)",
              background: "#EDE9DA",
            }} />
            {/* 하단 폴드 */}
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "0 0 16px 16px",
              clipPath: "polygon(0 100%, 100% 100%, 50% 53%)",
              background: "#CCC8B8",
            }} />

            {/* AHAread 씰 */}
            <div style={{
              position: "absolute", bottom: 28, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              zIndex: 3,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 3px 12px rgba(66,133,244,0.35), 0 1px 4px rgba(0,0,0,0.15)",
              }}>
                <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>A</span>
              </div>
              <span style={{
                fontSize: 9.5, color: "#999", letterSpacing: "0.16em",
                fontWeight: 700, textTransform: "uppercase",
              }}>
                AHAread
              </span>
            </div>

            {/* 구독 완료 오버레이 */}
            <AnimatePresence>
              {phase === "success" && (
                <motion.div
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center"
                  style={{
                    background: "linear-gradient(162deg, #FFFEF8 0%, #F4EFE3 100%)",
                    borderRadius: 18,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.45 }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -18 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 250, damping: 16 }}
                    className="text-6xl mb-4"
                  >
                    ✉️
                  </motion.div>
                  <motion.p
                    className="text-xl font-bold text-gray-800 mb-2 text-center px-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26 }}
                  >
                    구독해주셔서 감사합니다!
                  </motion.p>
                  <motion.p
                    className="text-gray-500 text-sm text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.48 }}
                  >
                    매일 {String(hour).padStart(2, "0")}:00에 기사를 보내드릴게요 ✨
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ══ 플랩 (봉투 body 밖, z=20) ══ */}
          <motion.div
            style={{
              position: "absolute",
              top: ENVELOPE_TOP,
              left: 0, right: 0,
              height: Math.round(ENV_H * 0.54),
              transformOrigin: "top center",
              transformPerspective: 2400,
              zIndex: 20,
              backfaceVisibility: "hidden" as const,
              WebkitBackfaceVisibility: "hidden" as const,
            }}
            animate={{ rotateX: flapOpen ? -180 : 0 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{
              width: "100%", height: "100%",
              clipPath: "polygon(0 0, 100% 0, 50% 84%)",
              background: "linear-gradient(160deg, #6366f1 0%, #4338ca 100%)",
              borderRadius: "18px 18px 0 0",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              clipPath: "polygon(0 0, 100% 0, 50% 84%)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 55%)",
              borderRadius: "18px 18px 0 0",
            }} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 5,
              background: "linear-gradient(90deg, #EA4335 0%, #FBBC04 33%, #34A853 66%, #4285F4 100%)",
              borderRadius: "18px 18px 0 0",
            }} />
          </motion.div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-40 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition font-bold text-lg leading-none"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            ×
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

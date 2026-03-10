import { useState, useEffect } from "react";
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
  const [keywords, setKeywords] = useState("");
  const [hour, setHour] = useState(9);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPhase("idle");
      setError("");
      setUseExisting(true);
      setSelectedCategories([]);
      setKeywords("");
      setHour(9);

      const t1 = setTimeout(() => setPhase("opening"), 400);
      const t2 = setTimeout(() => setPhase("form"), 1350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen]);

  const flapOpen = ["opening", "form", "submitting"].includes(phase);

  const toggleCategory = (code: string) => {
    setSelectedCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    if (!typedUser?.token) return;
    setPhase("submitting");
    setError("");

    try {
      let emailKeywords: string | null = null;
      if (!useExisting) {
        const cats = selectedCategories
          .map((c) => CATEGORIES.find((cat) => cat.code === c)?.name ?? "")
          .filter(Boolean);
        const kws = keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);
        const combined = [...cats, ...kws].join(",");
        emailKeywords = combined || null;
      }

      const res = await fetch(
        `${getApiBaseUrl()}/api/mypage/email-subscription`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${typedUser.token}`,
          },
          body: JSON.stringify({ subscribed: true, hour, emailKeywords }),
        }
      );

      if (!res.ok) throw new Error("Failed");

      setPhase("closing");
      setTimeout(() => {
        setPhase("success");
        setTimeout(() => onClose(), 2800);
      }, 950);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
      setPhase("form");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Envelope container */}
        <motion.div
          className="relative z-10 w-full max-w-[360px]"
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 40 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: "1200px" }}
        >
          {/* Envelope body */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ height: 520, background: "#3730a3" }}
          >
            {/* Left fold */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(0 0, 0 100%, 50% 57%)",
                background: "#2e27a0",
              }}
            />
            {/* Right fold */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(100% 0, 100% 100%, 50% 57%)",
                background: "#4338ca",
              }}
            />
            {/* Bottom fold */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(0 100%, 100% 100%, 50% 57%)",
                background: "#1e1b4b",
              }}
            />

            {/* Card inside envelope */}
            <motion.div
              className="absolute inset-x-3 bg-white rounded-xl overflow-y-auto"
              style={{ top: 24, bottom: 76 }}
              animate={{ opacity: flapOpen ? 1 : 0 }}
              transition={{
                duration: 0.35,
                delay: flapOpen ? 0.55 : 0,
              }}
            >
              {!isLoggedIn ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                  <div className="text-5xl">✉️</div>
                  <p className="text-gray-600 font-medium">
                    뉴스레터 구독은 로그인 후 이용할 수 있습니다.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      navigate("/login");
                    }}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition"
                  >
                    로그인하기
                  </button>
                </div>
              ) : (
                <div className="p-5">
                  <AnimatePresence>
                    {(phase === "form" || phase === "submitting") && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                      >
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                          뉴스레터 구독
                        </h2>
                        <p className="text-sm text-gray-400 mb-5">
                          매일 원하는 시간에 맞춤 기사를 보내드립니다
                        </p>

                        {/* Toggle */}
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5 text-sm">
                          <button
                            className={`flex-1 py-2.5 font-medium transition ${
                              useExisting
                                ? "bg-indigo-600 text-white"
                                : "text-gray-500 hover:bg-gray-50"
                            }`}
                            onClick={() => setUseExisting(true)}
                          >
                            기존 관심사 사용
                          </button>
                          <button
                            className={`flex-1 py-2.5 font-medium transition ${
                              !useExisting
                                ? "bg-indigo-600 text-white"
                                : "text-gray-500 hover:bg-gray-50"
                            }`}
                            onClick={() => setUseExisting(false)}
                          >
                            직접 설정
                          </button>
                        </div>

                        {/* Direct settings */}
                        <AnimatePresence>
                          {!useExisting && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mb-4"
                            >
                              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                카테고리
                              </p>
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {CATEGORIES.map((cat) => (
                                  <button
                                    key={cat.code}
                                    onClick={() => toggleCategory(cat.code)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                      selectedCategories.includes(cat.code)
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "border-gray-200 text-gray-600 hover:border-indigo-300"
                                    }`}
                                  >
                                    {cat.emoji} {cat.name}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                키워드{" "}
                                <span className="font-normal text-gray-400 normal-case">
                                  (쉼표 구분, 선택사항)
                                </span>
                              </p>
                              <input
                                type="text"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="예: 이란, 반도체, 삼성"
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-400 mb-1"
                              />
                              <p className="text-xs text-gray-400">
                                입력한 키워드를 포함하는 기사를 선별합니다
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Time */}
                        <div className="mb-5">
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                            발송 시간
                          </p>
                          <select
                            value={hour}
                            onChange={(e) => setHour(Number(e.target.value))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-400"
                          >
                            {HOURS.map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, "0")}:00
                              </option>
                            ))}
                          </select>
                        </div>

                        {error && (
                          <p className="text-xs text-red-500 mb-3">{error}</p>
                        )}

                        <button
                          onClick={handleSubmit}
                          disabled={phase === "submitting"}
                          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          {phase === "submitting" ? "구독 중..." : "구독하기 ✉️"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Success overlay */}
            <AnimatePresence>
              {phase === "success" && (
                <motion.div
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl"
                  style={{ background: "#3730a3" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    className="text-6xl mb-5"
                  >
                    ✉️
                  </motion.div>
                  <motion.p
                    className="text-2xl font-bold text-white mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    구독해주셔서 감사합니다!
                  </motion.p>
                  <motion.p
                    className="text-indigo-200 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    매일 {String(hour).padStart(2, "0")}:00에 기사를
                    보내드릴게요 ✨
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Flap */}
          <motion.div
            className="absolute top-0 inset-x-0"
            style={{
              transformOrigin: "top center",
              zIndex: 20,
              height: 215,
              backfaceVisibility: "hidden",
            }}
            animate={{ rotateX: flapOpen ? -180 : 0 }}
            transition={{ duration: 0.88, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                clipPath: "polygon(0 0, 100% 0, 50% 73%)",
                background: "linear-gradient(150deg, #4f46e5 0%, #6366f1 100%)",
                borderRadius: "16px 16px 0 0",
              }}
            />
          </motion.div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-40 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition text-sm font-bold"
          >
            ×
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

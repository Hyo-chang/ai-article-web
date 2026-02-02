// src/pages/MyPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../services/AuthContext";
import { fetchJson, getApiBaseUrl } from "@/lib/api";
import defaultUserImage from "@/image/userimage.png";

type CategoryWithKeywords = {
  categoryId: string;
  categoryName: string;
  keywords: string[];
};

const MAX_KEYWORDS = 4;

type AuthUser = NonNullable<ReturnType<typeof useAuth>["user"]> & {
  nickname?: string;
  profileImageUrl?: string | null;
};

const MyPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const typedUser = user as AuthUser | null;

  const initialNickname =
    typedUser?.nickname ?? typedUser?.username ?? typedUser?.email ?? "사용자";
  const initialProfileImage = typedUser?.profileImageUrl ?? null;

  const [nickname, setNickname] = useState(initialNickname);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialProfileImage);
  const objectUrlRef = useRef<string | null>(null);

  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isSavingKeywords, setIsSavingKeywords] = useState(false);
  const [categories, setCategories] = useState<CategoryWithKeywords[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const storageKey = typedUser?.userId ? `preferredKeywords:${typedUser.userId}` : null;

  useEffect(() => {
    if (!storageKey) {
      setSelectedKeywords([]);
      return;
    }
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      setSelectedKeywords([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setSelectedKeywords(
          parsed
            .filter((item): item is string => typeof item === "string")
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0),
        );
      } else {
        setSelectedKeywords([]);
      }
    } catch (err) {
      console.warn("Failed to load preferred keywords:", err);
      setSelectedKeywords([]);
    }
  }, [storageKey]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        const data = await fetchJson<CategoryWithKeywords[] | null>(
          "/api/categories/with-trending-keywords",
          { signal: controller.signal },
        );
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setCategoriesError(
          err instanceof Error ? err.message : "카테고리를 불러오지 못했습니다.",
        );
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setNickname(
      typedUser?.nickname ?? typedUser?.username ?? typedUser?.email ?? "사용자",
    );
  }, [typedUser?.email, typedUser?.nickname, typedUser?.username]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(typedUser?.profileImageUrl ?? null);
    }
  }, [selectedFile, typedUser?.profileImageUrl]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleProfileImageSelect = (file: File) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setSelectedFile(file);
    setPreviewUrl(nextUrl);
  };

  const handleNicknameSave = async () => {
    if (!typedUser?.token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSavingNickname(true);

      // TODO: 프로필 이미지 업로드는 별도 파일 업로드 API 필요
      // 현재는 닉네임(username)만 업데이트
      const response = await fetch(`${getApiBaseUrl()}/api/mypage/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typedUser.token}`,
        },
        body: JSON.stringify({
          username: nickname,
          profileImageUrl: previewUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "프로필 저장에 실패했습니다.");
      }

      const updatedProfile = await response.json();

      // localStorage의 user 데이터 업데이트
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.username = updatedProfile.username;
        userData.profileImageUrl = updatedProfile.profileImageUrl;
        localStorage.setItem("user", JSON.stringify(userData));
      }

      alert("프로필이 저장되었습니다.");
      await refreshUser();
      if (selectedFile) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("updateProfile failed:", error);
      alert(error instanceof Error ? error.message : "프로필 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((item) => item !== keyword);
      }
      if (prev.length >= MAX_KEYWORDS) {
        alert(`최대 ${MAX_KEYWORDS}개까지 선택할 수 있습니다.`);
        return prev;
      }
      return [...prev, keyword];
    });
  };

  const handleKeywordSave = async () => {
    if (!storageKey || !typedUser?.token) {
      alert("로그인 후 저장할 수 있습니다.");
      return;
    }

    try {
      setIsSavingKeywords(true);

      // 백엔드에 관심 카테고리 저장 (선택된 키워드를 카테고리로 저장)
      const response = await fetch(`${getApiBaseUrl()}/api/mypage/interests`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typedUser.token}`,
        },
        body: JSON.stringify({
          categories: selectedKeywords,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "관심사 저장에 실패했습니다.");
      }

      // localStorage에도 저장 (프론트 캐시용)
      localStorage.setItem(storageKey, JSON.stringify(selectedKeywords));
      window.dispatchEvent(new Event("preferredKeywordsUpdated"));
      alert("관심 키워드가 저장되었습니다.");
    } catch (error) {
      console.error("saveInterests failed:", error);
      alert(error instanceof Error ? error.message : "관심사 저장에 실패했습니다.");
    } finally {
      setIsSavingKeywords(false);
    }
  };

  const [isResetting, setIsResetting] = useState(false);

  const handleKeywordReset = async () => {
    if (!storageKey || !typedUser?.token) {
      setSelectedKeywords([]);
      return;
    }

    const confirmed = window.confirm("관심 키워드를 모두 초기화하시겠습니까?");
    if (!confirmed) return;

    try {
      setIsResetting(true);

      // 백엔드에 빈 배열 전송하여 초기화
      const response = await fetch(`${getApiBaseUrl()}/api/mypage/interests`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typedUser.token}`,
        },
        body: JSON.stringify({ categories: [] }),
      });

      if (!response.ok) {
        throw new Error("초기화에 실패했습니다.");
      }

      // localStorage 초기화
      localStorage.removeItem(storageKey);

      // UI 상태 초기화
      setSelectedKeywords([]);

      window.dispatchEvent(new Event("preferredKeywordsUpdated"));
      alert("관심 키워드가 초기화되었습니다.");
    } catch (error) {
      console.error("resetInterests failed:", error);
      alert(error instanceof Error ? error.message : "초기화에 실패했습니다.");
    } finally {
      setIsResetting(false);
    }
  };

  if (!typedUser) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg text-slate-700">로그인 후 이용해 주세요.</p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#5B47FB] px-6 py-3 text-white shadow-lg transition hover:bg-[#4936E0]"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0f1115] px-4 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_45%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.15),transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">My Space</p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              읽기 경험을 내 취향으로
            </h1>
            <p className="mt-2 text-sm text-white/70">
              닉네임, 키워드, 프로필을 정리하면 맞춤 추천이 더 정교해집니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </button>
        </div>

        <ProfileCard
          email={typedUser.email ?? typedUser.username ?? "이메일 없음"}
          nickname={nickname}
          profileImageUrl={previewUrl}
          onNicknameChange={setNickname}
          onProfileImageSelect={handleProfileImageSelect}
          onSave={handleNicknameSave}
          isSaving={isSavingNickname}
        />

        <KeywordSection
          selectedKeywords={selectedKeywords}
          onToggleKeyword={handleKeywordToggle}
          onSave={handleKeywordSave}
          onReset={handleKeywordReset}
          isSaving={isSavingKeywords}
          isResetting={isResetting}
          categories={categories}
          isLoading={categoriesLoading}
          error={categoriesError}
          maxSelections={MAX_KEYWORDS}
        />
      </div>
    </div>
  );
};

interface ProfileCardProps {
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  onNicknameChange: (value: string) => void;
  onProfileImageSelect: (file: File) => void;
  onSave: () => void;
  isSaving: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  email,
  nickname,
  profileImageUrl,
  onNicknameChange,
  onProfileImageSelect,
  onSave,
  isSaving,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#15181f]/95 p-6 shadow-2xl shadow-black/40">
      <h2 className="text-xl font-semibold text-white md:text-2xl">기본 정보</h2>
      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-28 w-28 rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-1 shadow-inner">
            <img
              src={profileImageUrl ?? defaultUserImage}
              alt="프로필 이미지"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onProfileImageSelect(file);
              }
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={handleButtonClick}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:text-white"
          >
            프로필 이미지 변경
          </button>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">닉네임</label>
            <input
              value={nickname}
              onChange={(event) => onNicknameChange(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-white placeholder:text-white/30 transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="닉네임을 입력하세요"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">이메일</label>
            <div className="flex h-12 items-center rounded-2xl border border-white/15 bg-white/5 px-4 text-white/80">
              {email}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-black shadow-lg shadow-black/50 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>
    </section>
  );
};

interface KeywordSectionProps {
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  isResetting: boolean;
  categories: CategoryWithKeywords[];
  isLoading: boolean;
  error: string | null;
  maxSelections: number;
}

const KeywordSection: React.FC<KeywordSectionProps> = ({
  selectedKeywords,
  onToggleKeyword,
  onSave,
  onReset,
  isSaving,
  isResetting,
  categories,
  isLoading,
  error,
  maxSelections,
}) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#15181f]/95 p-6 shadow-2xl shadow-black/40">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Interests</p>
          <h2 className="text-xl font-semibold text-white md:text-2xl">관심사 카테고리</h2>
          <p className="text-sm text-white/70">
            키워드 카테고리에서 최대 {maxSelections}개까지 선택하면 홈 화면 추천 기사에 우선 반영됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-4 py-4">
          {isLoading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              키워드를 불러오는 중입니다…
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {!isLoading && !error && categories.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              아직 표시할 키워드가 없습니다.
            </div>
          )}

          {!isLoading &&
            !error &&
            categories.map((category) => (
              <div
                key={category.categoryId}
                className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-inner shadow-black/30"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    {category.categoryName}
                  </h3>
                  <span className="text-xs text-white/50">
                    {category.keywords.length > 0 ? `${category.keywords.length}개 키워드` : "키워드 없음"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.keywords.length === 0 ? (
                    <span className="text-xs text-white/60">등록된 키워드가 없습니다.</span>
                  ) : (
                    category.keywords.map((keyword) => {
                      const isActive = selectedKeywords.includes(keyword);
                      const baseClasses = "rounded-full px-4 py-1.5 text-sm transition";
                      const activeClasses =
                        "bg-sky-100 text-sky-900 border border-sky-200 shadow-inner shadow-sky-200/60";
                      const inactiveClasses =
                        "bg-white text-gray-700 border border-gray-200 hover:bg-sky-50 hover:text-sky-900";
                      return (
                        <button
                          key={`${category.categoryId}-${keyword}`}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => onToggleKeyword(keyword)}
                          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                        >
                          #{keyword}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving || isResetting}
            className="inline-flex items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResetting ? "초기화 중..." : "전체 초기화"}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || isResetting}
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "저장 중..." : "관심사 저장"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default MyPage;

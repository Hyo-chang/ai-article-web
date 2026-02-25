import { Sparkles, Home, FileText, User as UserIcon, Clock3, Menu, X, History, Sun, Moon, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type React from "react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../services/AuthContext";

interface HeaderProps {
  sidebarWidth: number;
  onLoginClick?: () => void;
  onHomeClick?: () => void;
  onAnalyzeClick?: () => void;
  onHistoryClick?: () => void;
  onExperienceClick?: () => void;
  onSidebarResizeStart?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  activeView?: "home" | "analyze" | "history";
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function Header({
  sidebarWidth,
  onLoginClick,
  onHomeClick,
  onAnalyzeClick,
  onHistoryClick,
  onExperienceClick,
  onSidebarResizeStart,
  activeView = "home",
  isMobileMenuOpen = false,
  onMobileMenuToggle,
}: HeaderProps) {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const displayName = (() => {
    if (!user) return "사용자";
    if ("name" in user && user.name) return user.name;
    if ("username" in user && (user as { username?: string }).username) {
      return (user as { username?: string }).username as string;
    }
    if ("nickname" in user && (user as { nickname?: string }).nickname) {
      return (user as { nickname?: string }).nickname as string;
    }
    if ("email" in user && (user as { email?: string }).email) {
      const email = (user as { email?: string }).email as string;
      return email.split("@")[0] || email;
    }
    return "사용자";
  })();

  const handleLoginClick = () => {
    onLoginClick?.();
    if (!onLoginClick) {
      navigate("/login");
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate("/experience");
  };

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      navigate("/home");
    }
  };

  const handleAnalyzeClick = () => {
    if (onAnalyzeClick) {
      onAnalyzeClick();
      return;
    }
    navigate("/home");
  };

  const handleHistoryClick = () => {
    if (onHistoryClick) {
      onHistoryClick();
      return;
    }
    navigate("/home");
  };

  const handleExperienceClick = () => {
    onExperienceClick?.();
    navigate("/experience");
  };

  const navItems = [
    {
      key: "home" as const,
      label: "홈",
      icon: Home,
      onClick: handleHomeClick,
      isActive: activeView === "home",
    },
    {
      key: "analyze" as const,
      label: "분석하기",
      icon: FileText,
      onClick: handleAnalyzeClick,
      isActive: activeView === "analyze",
    },
    {
      key: "history" as const,
      label: "기록",
      icon: Clock3,
      onClick: handleHistoryClick,
      isActive: activeView === "history",
    },
  ];

  return (
    <>
      {/* Mobile Menu Button - 모바일에서만 표시 */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1c20] text-white shadow-lg md:hidden"
        aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay - 모바일 메뉴가 열렸을 때 배경 어둡게 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onMobileMenuToggle}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 border-r border-black/40 bg-[linear-gradient(180deg,#1a1c20_0%,#15171b_45%,#111215_100%)] text-[#dcdcdc] transition-transform duration-300 md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: sidebarWidth }}
      >
        <div className="grid h-screen grid-rows-[auto_1fr_auto] px-6 py-10">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleHomeClick}
            className="transition-transform duration-200 hover:scale-105 focus:outline-none"
          >
            <img
              src="/logo.png"
              alt="AHA Logo"
              className="h-48 w-48 object-contain"
            />
          </button>
        </div>

        <nav className="mt-12 flex flex-col gap-4 text-sm font-medium">
          {navItems.map(({ key, label, icon: Icon, onClick, isActive }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className={`flex items-center gap-3 rounded-r-full px-4 py-3.5 transition-colors duration-300 ease-in-out ${
                isActive
                  ? "border-r-2 border-[#cfd2da] bg-[#1a1a1a] text-[#f5f5f5]"
                  : "text-[#c0c4cc] hover:bg-[#191919] hover:text-[#ffffff]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleExperienceClick}
            className="mt-6 flex items-center gap-3 rounded-r-full px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#9398a3] transition-colors duration-300 hover:text-white"
          >
            <Sparkles className="h-4 w-4" />
            <span>체험하기</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/updates")}
            className="mt-2 flex items-center gap-3 rounded-r-full px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#9398a3] transition-colors duration-300 hover:text-white"
          >
            <History className="h-4 w-4" />
            <span>업데이트</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/board")}
            className="mt-2 flex items-center gap-3 rounded-r-full px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#9398a3] transition-colors duration-300 hover:text-white"
          >
            <MessageSquare className="h-4 w-4" />
            <span>커뮤니티</span>
          </button>

          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="mt-4 flex items-center gap-3 rounded-r-full px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#9398a3] transition-colors duration-300 hover:text-white"
              aria-label={resolvedTheme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {resolvedTheme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>라이트 모드</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>다크 모드</span>
                </>
              )}
            </button>
          )}
        </nav>

        <div className="mt-10 border-t border-black/70 pt-6">
          {isLoggedIn ? (
            <div className="flex flex-col items-center gap-4 text-sm text-[#d4d4d4]">
              <Link
                to="/mypage"
                className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-[#f5f5f5] transition-colors hover:bg-[#242424]"
              >
                <UserIcon className="h-4 w-4" />
                <span>{displayName}님 반갑습니다 👋</span>
              </Link>
              <Button
                size="sm"
                className="w-full rounded-full border border-[#2b2b2b] bg-[#151515] text-[#dcdcdc] hover:bg-[#1f1f1f] hover:text-white"
                onClick={handleLogoutClick}
                aria-label="로그아웃"
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button
                size="sm"
                className="w-full rounded-full border border-[#2b2b2b] bg-[#151515] text-[#dcdcdc] hover:bg-[#1f1f1f] hover:text-white"
                onClick={handleLoginClick}
              >
                로그인하기
              </Button>
              <p className="text-xs text-[#8f94a0]">AI Reader와 함께 맞춤형 인사이트를 만나보세요.</p>
            </div>
          )}
        </div>
      </div>
        {/* 데스크톱에서만 리사이즈 핸들 표시 */}
        <button
          type="button"
          onMouseDown={onSidebarResizeStart}
          className="absolute inset-y-0 right-0 hidden w-3 cursor-col-resize bg-transparent transition hover:bg-white/10 md:block"
          aria-label="사이드바 너비 조절"
        />
      </aside>
    </>
  );
}

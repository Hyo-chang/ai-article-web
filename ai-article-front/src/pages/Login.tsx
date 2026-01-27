import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Sparkles, Mail, Lock, Eye, EyeOff, Home } from "lucide-react";
import { toast } from "sonner"; // toast 알림을 위해 그대로 유지

// ✅ AuthContext에서 useAuth 훅 임포트 (경로 확인)
import { useAuth } from "../services/AuthContext";

// ✅ LoginProps 인터페이스는 이제 필요 없습니다. (onLogin prop을 사용하지 않을 것이므로)
// interface LoginProps {
//   onLogin?: (email: string, password: string) => void;
//   onSwitchToSignUp?: () => void;
// }

// ✅ Login 컴포넌트에서 더 이상 props를 받지 않습니다.
export function Login() {
  // ✅ { onLogin, onSwitchToSignUp }: LoginProps 제거
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const navigate = useNavigate();

  // ✅ AuthContext에서 login 함수 가져오기
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    setIsLoading(true); // 로그인 요청 시작 시 로딩 true

    try {
      // ✅ 백엔드와 연동되는 실제 로그인 로직 호출
      // 백엔드 LoginRequest는 username 필드를 사용하므로, email 값을 username으로 전달
      await login(email, password);

      toast.success("로그인되었습니다!"); // 로그인 성공 토스트
      navigate("/home"); // 성공 시 홈으로 이동
    } catch (error: any) {
      // ✅ 백엔드 에러 응답 처리
      const errorMessage =
        error.response?.data?.message || // 백엔드에서 보낸 구체적인 에러 메시지
        error.message || // axios나 다른 네트워크 에러 메시지
        "로그인에 실패했습니다. 다시 시도해주세요."; // 일반적인 폴백 메시지

      toast.error(errorMessage); // 실패 토스트 메시지 표시
      console.error("Login failed:", error); // 디버깅을 위해 콘솔에 에러 출력
    } finally {
      setIsLoading(false); // 성공 또는 실패와 관계없이 로딩 종료
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-[#0f1115] text-white overflow-hidden">
      <button
        type="button"
        onClick={() => navigate("/home")}
        className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        <Home className="h-4 w-4" />
        홈으로
      </button>
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-[#1e1e1e] via-[#2a2a2a] to-[#121212] text-[#f5f5f5] mb-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
            <Sparkles className="h-5 w-5 text-[#f5f5f5]" />
          </div>
          <h1 className="text-3xl mb-2 font-semibold text-white">AI Reader</h1>
          <p className="text-white/70">다시 오신 것을 환영합니다</p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl bg-[#15181f] border border-white/10 shadow-2xl shadow-[#00000080] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-white/80">
                이메일
              </Label>
              <div className="relative flex h-12 items-center rounded-xl border border-white/15 bg-black/20 px-4">
                <Mail className="mr-3 h-5 w-5 text-white/70" />
                <Input
                  id="email"
                  type="email" // ✅ 백엔드에서 email을 username으로 받을 것이므로 'email' type 유지 가능
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full flex-1 border-none bg-transparent p-0 text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-0"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/80">
                  비밀번호
                </Label>
                <button
                  type="button"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  비밀번호 찾기
                </button>
              </div>
              <div className="relative flex h-12 items-center rounded-xl border border-white/15 bg-black/20 px-4">
                <Lock className="mr-3 h-5 w-5 text-white/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-full flex-1 border-none bg-transparent p-0 pr-10 text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-0"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading} // 로딩 중일 때 버튼 비활성화
              className="w-full h-12 rounded-xl bg-white text-black font-semibold shadow-lg shadow-black/50 transition hover:bg-white/90 disabled:opacity-60"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-white/70">
            아직 계정이 없으신가요?{" "}
            <button
              onClick={() => {
                // ✅ onSwitchToSignUp prop 사용하지 않으므로, 항상 /signup으로 이동
                // if (onSwitchToSignUp) {
                //   onSwitchToSignUp();
                // } else {
                //   navigate("/signup");
                // }
                navigate("/signup"); // ✅ 회원가입 경로 확인
              }}
              className="text-white font-semibold hover:underline underline-offset-4 transition-colors"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

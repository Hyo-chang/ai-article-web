import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Sparkles, Mail, Lock, Eye, EyeOff, User, Home } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { getApiBaseUrl } from "@/lib/api";

interface SignUpProps {
  onSignUp?: (name: string, email: string, password: string) => void;
  onSwitchToLogin?: () => void;
}

export function SignUp({ onSignUp, onSwitchToLogin }: SignUpProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    if (password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다");
      return;
    }

    setIsLoading(true);

    try {
      const apiBase = getApiBaseUrl();
      await axios.post(`${apiBase}/api/auth/signup`, {
        username: name,
        email,
        password,
      });

      setIsLoading(false);
      toast.success("회원가입이 완료되었습니다!");
      if (onSignUp) onSignUp(name, email, password);
      else navigate("/login");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setIsLoading(false);
      console.error("회원가입 실패:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "회원가입에 실패했습니다. 다시 시도해주세요.");
      } else {
        toast.error("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-[#0f1115] text-white overflow-hidden">
      <button
        type="button"
        onClick={() => navigate("/experience")}
        className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        <Home className="h-4 w-4" />
        홈으로
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-[#1e1e1e] via-[#2a2a2a] to-[#121212] text-[#f5f5f5] mb-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
            <Sparkles className="h-5 w-5 text-[#f5f5f5]" />
          </div>
          <h1 className="text-3xl mb-2 font-semibold text-white">AI Reader 시작하기</h1>
          <p className="text-white/70">계정을 만들고 스마트한 독해를 경험하세요</p>
        </div>

        <div className="rounded-3xl bg-[#15181f] border border-white/10 shadow-2xl shadow-[#00000080] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-white/80">
                이름
              </Label>
              <div className="relative flex h-12 items-center rounded-xl border border-white/15 bg-black/20 px-4">
                <User className="mr-3 h-5 w-5 text-white/70" />
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-full flex-1 border-none bg-transparent p-0 text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-0"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-white/80">
                이메일
              </Label>
              <div className="relative flex h-12 items-center rounded-xl border border-white/15 bg-black/20 px-4">
                <Mail className="mr-3 h-5 w-5 text-white/70" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full flex-1 border-none bg-transparent p-0 text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-0"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-white/80">
                비밀번호
              </Label>
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
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-white/50">최소 8자 이상 입력해주세요</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-white/80">
                비밀번호 확인
              </Label>
              <div className="relative flex h-12 items-center rounded-xl border border-white/15 bg-black/20 px-4">
                <Lock className="mr-3 h-5 w-5 text-white/70" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-full flex-1 border-none bg-transparent p-0 pr-10 text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-0"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-white text-black font-semibold shadow-lg shadow-black/50 transition hover:bg-white/90 disabled:opacity-60"
            >
              {isLoading ? "가입 중..." : "회원가입"}
            </Button>
          </form>

          <p className="text-xs text-white/50 text-center mt-5">
            회원가입을 진행하면{" "}
            <button className="text-white underline-offset-4 hover:underline">이용약관</button>과{" "}
            <button className="text-white underline-offset-4 hover:underline">개인정보처리방침</button>
            에 동의하는 것으로 간주됩니다
          </p>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-white/70">
            이미 계정이 있으신가요?{" "}
            <button
              onClick={() => {
                if (onSwitchToLogin) onSwitchToLogin();
                else navigate("/login");
              }}
              className="text-white font-semibold hover:underline underline-offset-4 transition-colors"
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

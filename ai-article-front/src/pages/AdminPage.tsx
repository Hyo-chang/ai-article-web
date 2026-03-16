import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthContext";
import { getApiBaseUrl } from "../lib/api";
import { useNoAds } from "../hooks/useNoAds";

const ADMIN_EMAIL = "wee7846@gmail.com";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? "1234";
const API = getApiBaseUrl();

function adminHeaders() {
  return { "X-Admin-Token": ADMIN_TOKEN, "Content-Type": "application/json" };
}

interface Stats {
  userCount: number;
  articleCount: number;
  postCount: number;
  subscriberCount: number;
}

interface JobRun {
  run_id: number;
  job_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  note: string | null;
}

interface AdminUser {
  userId: number;
  username: string;
  email: string;
  createdAt: string | null;
  provider: string;
  emailSubscribed: boolean;
  notificationHour: number;
}

type Tab = "dashboard" | "members";

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useNoAds();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState(ADMIN_EMAIL);
  const [memberSearch, setMemberSearch] = useState("");

  // 권한 체크
  useEffect(() => {
    if (user === undefined) return;
    if (!user || user.email !== ADMIN_EMAIL) navigate("/home", { replace: true });
  }, [user, navigate]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers: adminHeaders() }),
        fetch(`${API}/api/admin/runs/latest?limit=20`, { headers: adminHeaders() }),
      ]);
      if (s.ok) setStats(await s.json());
      if (r.ok) setRuns(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: adminHeaders() });
      if (res.ok) setMembers(await res.json());
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.email !== ADMIN_EMAIL) return;
    fetchDashboard();
  }, [user, fetchDashboard]);

  useEffect(() => {
    if (user?.email !== ADMIN_EMAIL) return;
    if (tab === "members" && members.length === 0) fetchMembers();
  }, [tab, user, members.length, fetchMembers]);

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 5000);
  };

  const runAction = async (label: string, url: string, method = "POST", body?: object) => {
    showMsg(`⏳ ${label} 실행 중...`);
    try {
      const res = await fetch(`${API}${url}`, {
        method,
        headers: adminHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      showMsg(`✅ ${label} 완료: ${JSON.stringify(data)}`);
    } catch (e) {
      showMsg(`❌ ${label} 실패: ${String(e)}`);
    }
    fetchDashboard();
  };

  if (!user || user.email !== ADMIN_EMAIL) return null;

  const statCards = [
    { label: "총 사용자", value: stats?.userCount, icon: "👤", color: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" },
    { label: "총 기사", value: stats?.articleCount, icon: "📰", color: "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800" },
    { label: "총 게시글", value: stats?.postCount, icon: "💬", color: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800" },
    { label: "이메일 구독자", value: stats?.subscriberCount, icon: "📧", color: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800" },
  ];

  const statusColor = (s: string) => {
    if (s === "SUCCESS") return "text-green-600 dark:text-green-400";
    if (s === "FAILED") return "text-red-500";
    if (s === "RUNNING") return "text-blue-500";
    return "text-slate-400";
  };

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return !q || m.email.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
  });

  const subscriberCount = members.filter((m) => m.emailSubscribed).length;
  const googleCount = members.filter((m) => m.provider === "google").length;
  const localCount = members.filter((m) => m.provider === "local" || !m.provider).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">관리자 패널</h1>
            <p className="text-xs text-slate-400 mt-0.5">AHAread · {ADMIN_EMAIL}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { fetchDashboard(); if (tab === "members") fetchMembers(); }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              새로고침
            </button>
            <button
              onClick={() => navigate("/home")}
              className="rounded-lg bg-slate-800 dark:bg-slate-200 px-3 py-1.5 text-sm text-white dark:text-slate-900 hover:opacity-80"
            >
              홈으로
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 w-fit">
          {(["dashboard", "members"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {t === "dashboard" ? "대시보드" : "회원 관리"}
            </button>
          ))}
        </div>

        {/* 액션 메시지 */}
        {actionMsg && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm font-mono text-slate-700 dark:text-slate-200 break-all">
            {actionMsg}
          </div>
        )}

        {/* ── 대시보드 탭 ── */}
        {tab === "dashboard" && (
          <>
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {statCards.map((c) => (
                <div key={c.label} className={`rounded-2xl ${c.color} border p-4`}>
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {loading ? "—" : (c.value?.toLocaleString() ?? "—")}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.label}</div>
                </div>
              ))}
            </div>

            {/* 빠른 실행 */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">빠른 실행</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => runAction("제목 기반 재분류", "/api/admin/recategorize-by-title")}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                  제목 기반 재분류
                </button>
                <button onClick={() => runAction("URL 기반 재분류", "/api/admin/recategorize-by-url")}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                  URL 기반 재분류
                </button>
                <button onClick={() => runAction("카테고리 코드 백필", "/api/admin/backfill/category-code")}
                  className="rounded-lg bg-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-700">
                  카테고리 코드 백필
                </button>
                <button onClick={() => runAction("스냅샷 정리", "/api/admin/cleanup/older-than?hours=48&snapshotsOnly=true", "DELETE")}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">
                  스냅샷 정리 (48h↑)
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-white outline-none w-56"
                  placeholder="이메일 주소"
                />
                <button
                  onClick={() => runAction("이메일 테스트", `/api/admin/test-email?email=${encodeURIComponent(testEmail)}`)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm text-white hover:bg-amber-600">
                  이메일 발송 테스트
                </button>
              </div>
            </div>

            {/* 작업 이력 */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">최근 작업 이력</h2>
              {loading ? (
                <p className="text-sm text-slate-400">불러오는 중...</p>
              ) : runs.length === 0 ? (
                <p className="text-sm text-slate-400">이력 없음</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                        <th className="pb-2 pr-3">ID</th>
                        <th className="pb-2 pr-3">작업명</th>
                        <th className="pb-2 pr-3">시작</th>
                        <th className="pb-2 pr-3">종료</th>
                        <th className="pb-2">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {runs.map((r) => (
                        <tr key={r.run_id} className="text-slate-600 dark:text-slate-300">
                          <td className="py-2 pr-3 text-slate-400">{r.run_id}</td>
                          <td className="py-2 pr-3 font-mono">{r.job_name}</td>
                          <td className="py-2 pr-3">{r.started_at ? new Date(r.started_at).toLocaleString("ko-KR") : "—"}</td>
                          <td className="py-2 pr-3">{r.finished_at ? new Date(r.finished_at).toLocaleString("ko-KR") : "—"}</td>
                          <td className={`py-2 font-semibold ${statusColor(r.status)}`}>{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 회원 관리 탭 ── */}
        {tab === "members" && (
          <>
            {/* 요약 카드 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "전체 회원", value: members.length, color: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" },
                { label: "일반 가입", value: localCount, color: "bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600" },
                { label: "Google 가입", value: googleCount, color: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800" },
              ].map((c) => (
                <div key={c.label} className={`rounded-2xl ${c.color} border p-4`}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {membersLoading ? "—" : c.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.label}</div>
                </div>
              ))}
            </div>

            {/* 검색 */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  가입 회원 목록
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {membersLoading ? "로딩 중..." : `${filteredMembers.length}명`}
                  </span>
                </h2>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="이메일 / 닉네임 검색"
                  className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 text-sm text-slate-800 dark:text-white outline-none w-52"
                />
              </div>

              {membersLoading ? (
                <p className="text-sm text-slate-400">불러오는 중...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                        <th className="pb-2 pr-3">ID</th>
                        <th className="pb-2 pr-3">닉네임</th>
                        <th className="pb-2 pr-3">이메일</th>
                        <th className="pb-2 pr-3">가입일</th>
                        <th className="pb-2 pr-3">가입 방식</th>
                        <th className="pb-2">뉴스레터</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {filteredMembers.map((m) => (
                        <tr key={m.userId} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2 pr-3 text-slate-400">{m.userId}</td>
                          <td className="py-2 pr-3 font-medium">{m.username}</td>
                          <td className="py-2 pr-3">{m.email}</td>
                          <td className="py-2 pr-3 text-slate-400">
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })
                              : "—"}
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              m.provider === "google"
                                ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                            }`}>
                              {m.provider ?? "local"}
                            </span>
                          </td>
                          <td className="py-2">
                            {m.emailSubscribed ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                구독 ({m.notificationHour}시)
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">미구독</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredMembers.length === 0 && (
                    <p className="text-center py-8 text-sm text-slate-400">검색 결과 없음</p>
                  )}
                </div>
              )}
            </div>

            {/* 구독자 현황 */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">이메일 구독 현황</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 rounded-full bg-slate-100 dark:bg-slate-700 h-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: members.length > 0 ? `${(subscriberCount / members.length) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 w-20 text-right">
                  {subscriberCount} / {members.length}명
                </span>
              </div>
              {/* 시간대별 구독자 */}
              <div className="grid grid-cols-6 gap-1 md:grid-cols-12">
                {Array.from({ length: 24 }, (_, h) => {
                  const cnt = members.filter((m) => m.emailSubscribed && m.notificationHour === h).length;
                  return (
                    <div key={h} className="text-center">
                      <div className={`rounded text-xs py-1 font-medium ${
                        cnt > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-slate-50 dark:bg-slate-700/30 text-slate-300"
                      }`}>
                        {cnt > 0 ? cnt : "·"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{h}시</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

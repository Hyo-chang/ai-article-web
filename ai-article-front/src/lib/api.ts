// 기본 백엔드 주소를 8080으로 고정
const DEFAULT_LOCAL_API = "http://localhost:8080";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isAbsoluteUrl(pathOrUrl: string) {
  return /^https?:\/\//i.test(pathOrUrl);
}

export function getApiBaseUrl() {
  // 1️⃣ 환경 변수 우선 (있다면 그걸 사용)
  const envValue = (
    import.meta.env.VITE_API_BASE_URL as string | undefined
  )?.trim();
  if (envValue) {
    console.log("🔧 Using API base from .env:", envValue);
    return trimTrailingSlash(envValue);
  }

  // 2️⃣ localhost 환경일 때는 8080 고정
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      console.log("🔧 Detected localhost, forcing backend port 8080");
      return DEFAULT_LOCAL_API;
    }
    // 배포 환경일 때는 origin 사용
    return trimTrailingSlash(origin);
  }

  // 3️⃣ 기본값 fallback
  return DEFAULT_LOCAL_API;
}

function resolveUrl(pathOrUrl: string) {
  if (!pathOrUrl) {
    return getApiBaseUrl();
  }
  if (isAbsoluteUrl(pathOrUrl)) {
    return pathOrUrl;
  }
  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

function mergeHeaders(headers?: HeadersInit) {
  const merged = new Headers(headers ?? undefined);
  if (!merged.has("Accept")) {
    merged.set("Accept", "application/json");
  }
  return merged;
}

function previewBody(body: string, length = 180) {
  const trimmed = body.trim();
  if (!trimmed) return "본문 없음";
  return trimmed.length > length ? `${trimmed.slice(0, length)}…` : trimmed;
}

export async function fetchJson<T>(pathOrUrl: string, init: RequestInit = {}) {
  const finalUrl = resolveUrl(pathOrUrl);
  console.log("🚀 Fetching:", finalUrl); // ✅ 요청 주소 로그로 확인

  const response = await fetch(finalUrl, {
    ...init,
    headers: mergeHeaders(init.headers),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(
      `요청 실패 (${response.status}): ${
        previewBody(rawBody) || response.statusText
      }`
    );
  }

  if (!rawBody.trim()) {
    return null as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch (error) {
    throw new Error(
      `JSON 파싱 실패 (status ${response.status}). 응답 미리보기: ${previewBody(
        rawBody
      )}`
    );
  }
}

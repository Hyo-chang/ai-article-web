# AHAread - AI 뉴스 분석 플랫폼

> **서비스 URL**: https://www.aharead.com

## 기술 스택

| 구성요소 | 기술 | 배포 |
|---------|------|------|
| **Backend** | Spring Boot 3.5.6, Java 21, Spring Security (JWT) | Railway |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS | Vercel |
| **AI Engine** | FastAPI, LangChain, Ollama (Exaone 3.5), Chroma | Local + ngrok |
| **Database** | MySQL 8.0 (Railway) | Railway |
| **Infra** | Cloudflare (DNS/CDN), prerender.io (SEO) | - |

## 디렉토리 구조

```
ai-article-backend/   # Java Spring Boot 백엔드
ai-article-front/     # React + TypeScript 프론트엔드
rag-ai/               # Python AI 엔진 (RAG)
scripts/              # 뉴스 크롤러
```

## 로컬 개발 환경

```bash
# 백엔드
cd ai-article-backend && mvn spring-boot:run

# 프론트엔드
cd ai-article-front && npm run dev

# AI 엔진
cd rag-ai && C:\dev\venv\Scripts\uvicorn.exe api_main:app --host 0.0.0.0 --port 8020

# 크롤러 (자동 루프)
cd scripts && C:\dev\venv\Scripts\python.exe crawling.py \
  --keywords "정치" "경제" "사회" "생활/문화" "IT/과학" "세계" "연예" \
  --max-articles-per-keyword 5 --total-phases 1 \
  --loop --wait-min 300 --wait-max 600
```

## 크롤링 명령어

### 터미널 1: RAG AI 서버
```bash
cd C:\ai-article-web\ai-article-web\rag-ai
C:\dev\venv\Scripts\uvicorn.exe api_main:app --host 0.0.0.0 --port 8020
```

### 터미널 2: ngrok 터널
```bash
ngrok http 8020
```
→ 나온 URL을 Railway `RAG_AI_URL` 환경변수에 설정

### 터미널 3: 크롤링
```bash
cd C:\ai-article-web\ai-article-web\scripts
C:\dev\venv\Scripts\python.exe crawling.py --keywords "정치" "경제" "사회" "생활/문화" "IT/과학" "세계" "연예" --max-articles-per-keyword 5 --total-phases 1 --loop --wait-min 300 --wait-max 600
```

### 크롤링 옵션
| 옵션 | 설명 |
|------|------|
| `--total-phases 1` | 1단계만 (카테고리 검색, 권장) |
| `--max-articles-per-keyword 5` | 카테고리당 최대 5개 |
| `--loop` | 무한 반복 |
| `--wait-min 300` | 최소 대기 5분 |
| `--wait-max 600` | 최대 대기 10분 |

## 배포 환경

### Railway (Backend + MySQL)
```
SPRING_DATASOURCE_URL=jdbc:mariadb://mysql.railway.internal:3306/railway?allowPublicKeyRetrieval=true&useSSL=false
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=wIFypzjybWyEcAiqhTUIxJHstVKEvOaB
RAG_AI_URL=<ngrok URL>
```

### Vercel (Frontend)
- 자동 배포: `main` 브랜치 push 시
- 환경변수: `VITE_API_BASE_URL`, `PRERENDER_TOKEN`

### Cloudflare
- Worker: `aharead-prerender` (봇 → prerender.io 프록시)
- WAF: Yeti/Googlebot User-Agent Skip 규칙

## 주요 API

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인 (JWT)

### 기사
- `GET /api/articles` - 목록
- `GET /api/articles/search?q=` - 검색
- `POST /api/articles/analyze` - URL 분석
- `POST /api/analysis/chat` - AI 채팅

### 마이페이지
- `GET /api/mypage/bookmarks` - 북마크
- `GET /api/mypage/history` - 열람 기록
- `GET /api/mypage/analyzed-articles` - 분석 기록
- `PUT /api/mypage/interests` - 관심 키워드

### 게시판
- `GET /api/posts` - 목록
- `POST /api/posts` - 작성
- `POST /api/posts/{id}/comments` - 댓글
- `POST /api/posts/{id}/like` - 좋아요

## 주요 엔티티

- `ArticleV2` - 기사 정보
- `ExtractedKeywordV2` - 추출 키워드
- `WordDefinition` - 단어 정의
- `User`, `UserReadHistory` - 사용자/열람 이력
- `UserBookmark` - 북마크
- `UserAnalyzedArticle` - 분석 기록
- `Post`, `Comment` - 게시판

## 카테고리 코드

| 코드 | 이름 |
|------|------|
| 100 | 정치 |
| 101 | 경제 |
| 102 | 사회 |
| 103 | 생활/문화 |
| 104 | 세계 |
| 105 | IT/과학 |
| 106 | 연예 |

## RAG AI 설정

- **LLM**: Ollama + exaone3.5
- **임베딩**: `snunlp/KR-SBERT-V40K-klueNLI-augSTS`
- **형태소 분석**: KiwiPiePy
- **Python 가상환경**: `C:\dev\venv` (한글 경로 이슈 회피)

## SEO 설정

### 도메인 설정
- **Primary Domain**: `www.aharead.com`
- `aharead.com` → 301 → `www.aharead.com`
- `ai-article-web.vercel.app` → 301 → `www.aharead.com`
- Cloudflare: Always Use HTTPS ✅

### 검색엔진 등록
- Google Search Console: ✅ 완료
- Naver Search Advisor: ✅ 완료

### 동적 Sitemap
- **엔드포인트**: `GET /sitemap.xml` (백엔드 SitemapController)
- Vercel에서 백엔드로 프록시 (vercel.json rewrites)
- 정적 페이지 9개 + 기사 상세 페이지 자동 포함
- 현재 208페이지 색인 등록

### 메타 태그 (index.html)
```html
<meta name="naver-site-verification" content="bc4fc2c6977231b5e922cbae621f0aaf592d1b3a" />
<meta name="google-site-verification" content="LJoNpweN77r27SkzzvvWeT_7UqtAxWoIqwX_6L1hXvc" />
```

### Google AdSense
- **Publisher ID**: ca-pub-9123736919448805
- 상태: 심사 중 (2026-02-28 신청)

## Git 컨벤션

```
feat: 새 기능
fix: 버그 수정
refactor: 리팩토링
docs: 문서
chore: 기타
```

---

## 최근 작업 (2026-03-09)

### Railway 빌드 실패 해결
- **원인**: KOMORAN(JitPack 의존성)이 pom.xml에 있어 JitPack 521 에러로 모든 빌드 실패
- KOMORAN 완전 제거: `pom.xml`, `KomoranConfig.java` 삭제, `KoreanNlpService.java` 수정
  - mecab이 기본 NLP provider라 KOMORAN은 실제로 미사용 상태였음
- `Dockerfile` 멀티스테이지 빌드로 변경 (eclipse-temurin:21-jdk-jammy → jre-jammy)
- `mvnw` Git 실행권한 추가 (`git update-index --chmod=+x`) - permission denied 해결
- `AdminRunLogger.java` `@PostConstruct`로 `admin_job_run` 테이블 자동 생성
- **결과**: Railway 배포 SUCCESS ✅

---

## 작업 기록 (2026-03-06)

### 이메일 구독 알림 기능
- `User.java`: `emailSubscribed`, `notificationHour` 필드 추가
- `EmailService.java`: HTML 이메일 빌더 (기사 3개 요약+링크)
- `EmailScheduler.java`: 매 정시 실행 (Asia/Seoul), 관심 카테고리 기반 발송
- `MyPageController`: `GET/PUT /api/mypage/email-subscription` 엔드포인트
- `MyPage.tsx`: 이메일 구독 섹션 추가 (토글 + 시간 선택 + 저장)
- Railway 환경변수 필요: `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD`

### 버그 수정
- 히스토리 404 버그 수정 (`useReadHistory.ts` URL 수정)

---

## 작업 기록 (2026-03-04)

### SEO / AdSense 추가 작업
- `ads.txt` 추가 (`public/ads.txt`, `ca-pub-9123736919448805`)
- About 페이지 추가 (`/about`) + Footer에 "소개" 링크
- 동적 canonical 태그 페이지별 적용 (Google 색인 중복 방지)
- SitemapController 효율 개선 (DB 필터링, HTTP 캐싱)
- 짧은 기사(100자 미만) DB 삭제 + 크롤러 필터 추가
- Google AdSense 재신청 (심사 중)

---

## 작업 기록 (2026-02-28)

### SEO 최적화 및 AdSense 연동
- 브랜드명 통일: AI Reader → AHAread (메타태그, robots.txt)
- 도메인 통일: www.aharead.com을 Primary로 설정
  - Cloudflare: Always Use HTTPS 활성화
  - Vercel: aharead.com, ai-article-web.vercel.app → 301 리다이렉트
- 동적 Sitemap 구현
  - `SitemapController.java` 추가 (백엔드)
  - 정적 페이지 + 기사 상세 페이지 자동 포함
  - Vercel에서 `/sitemap.xml` → Railway 백엔드 프록시
  - 208페이지 Google Search Console 등록
- Google AdSense 신청 (심사 중)

---

## 작업 기록 (2026-02-20)

### 코드 정리
- 프론트엔드 미사용 컴포넌트 8개 삭제 (899줄)
  - `ArticleHistory.tsx`, `KeywordExplorer.tsx`
  - `ui/checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `drawer.tsx`, `table.tsx`, `textarea.tsx`
- 백엔드 미사용 컨트롤러 2개 삭제 (66줄)
  - `UserReadHistoryController.java`, `TrendController.java`

### AI 툴팁 추가
- 기사 상세 페이지 AI 버튼 옆 말풍선 툴팁
- "다시 보지 않기" 클릭 시 localStorage 저장

### 카테고리 키워드 수정
- `category_dict_v2` 테이블에 7개 카테고리 데이터 삽입
- `CategoryService`: `extracted_keyword_v2` 대신 `articlev2.word`에서 키워드 직접 추출하도록 변경
- 빈도순 정렬 후 상위 10개 키워드 반환

### 문서 정리
- `PROJECT_SUMMARY.md`: 자소서용 프로젝트 요약 문서 생성
- `CLAUDE.md`: 개발 문서 간소화 및 최신화

---

## TODO

- [x] Google AdSense 신청 (심사 중 - 2026-02-28, 재신청 2026-03-04)
- [x] 이메일 구독 알림 기능 구현 (2026-03-06)
- [x] Railway 빌드 실패 해결 (2026-03-09)
- [ ] AdSense 승인 후 광고 배치
- [ ] 이메일 구독 실제 테스트 (Gmail 앱 비밀번호 설정 완료, 정시 발송 확인 필요)
- [ ] 카카오톡 알림 (카카오 채널 API)
- [ ] 기사 추천 알고리즘 고도화
- [ ] 기사별 동적 메타태그 (og:title, og:description)

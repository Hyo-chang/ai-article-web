# Article Support Service

AI 기반 뉴스 기사 자동 수집, 요약, 분석 플랫폼

## 기술 스택

| 구성요소 | 기술 | 포트 |
|---------|------|------|
| Backend | Spring Boot 3.5.6, Java 21 | 8080 |
| Frontend | React 18 + TypeScript, Vite | 5173 |
| AI Engine | FastAPI, LangChain, Chroma | 8020 |
| Database | MariaDB 11.2 | 3307 |

## 디렉토리 구조

```
ai-article-backend/   # Java Spring Boot 백엔드
ai-article-front/     # React + TypeScript 프론트엔드
rag-ai/               # Python AI 엔진 (RAG)
scripts/              # 크롤러 스크립트
```

## 실행 방법

```bash
# 전체 스택 실행
docker-compose up -d

# 개별 실행
cd ai-article-backend && mvn spring-boot:run
cd ai-article-front && npm run dev
cd rag-ai && uvicorn api_main:app --port 8020
```

## 주요 API 엔드포인트

- `POST /api/articles/v2` - 기사 등록 및 AI 분석
- `GET /api/articles/{id}/summary` - 기사 요약 조회
- `POST /api/admin/crawl` - 크롤링 실행
- `GET /api/categories` - 카테고리 목록
- `POST /api/auth/login` - JWT 로그인

## 데이터 흐름

```
크롤러 → Backend API → MariaDB → RAG AI → 분석 결과 저장 → Frontend 표시
```

## 주요 엔티티

- `ArticleV2` - 기사 정보
- `ExtractedKeywordV2` - 추출 키워드
- `WordDefinition` - 단어 정의
- `User`, `UserReadHistory` - 사용자 및 열람 이력

## 개발 시 참고사항

- Backend 설정: `ai-article-backend/src/main/resources/application.properties`
- Frontend API 호출: `ai-article-front/src/services/`
- AI 분석 로직: `rag-ai/ArticleAnalyzer.py`
- 크롤러: `scripts/crawling.py` (Naver 뉴스)

## 크롤링 설정

### Python 가상환경
- 경로: `C:\dev\venv` (한글 경로 이슈로 영문 경로 사용)
- 이유: kiwipiepy가 한글 사용자 경로에서 모델 로딩 실패

### 크롤링 실행 방법
```bash
# 단일 실행
PYTHONIOENCODING=utf-8 /c/dev/venv/Scripts/python.exe scripts/crawling.py \
  --keywords "경제" "정치" "IT" \
  --max-articles-per-keyword 10 \
  --total-phases 1

# 자동 루프 (5~10분 간격)
PYTHONIOENCODING=utf-8 /c/dev/venv/Scripts/python.exe scripts/crawling.py \
  --keywords "경제" "정치" "IT" \
  --max-articles-per-keyword 10 \
  --loop \
  --wait-min 300 \
  --wait-max 600 \
  --total-phases 1
```

### 크롤링 옵션
| 옵션 | 설명 |
|------|------|
| `--loop` | 주기적 반복 실행 |
| `--wait-min`, `--wait-max` | 반복 간격 (초) |
| `--dry-run` | 테스트 모드 (DB 저장 안 함) |
| `--total-phases 1` | 1단계만 (빠름, 키워드 추출 없음) |
| `--total-phases 2` | 2단계 (키워드 확장, 모델 로딩 필요) |

### 크롤링 특징
- **네이버 뉴스 URL만 수집** (`n.news.naver.com`)
- HTML 구조가 통일되어 본문 추출 안정적
- 네이버 API 키 필요: `rag-ai/.env`의 `NAVER_CLIENT_ID`, `NAVER_CLIENT_PASSWD`

## RAG AI 상태

- 현재: **실제 AI 분석 활성화됨** (테스트 모드 해제 완료)
- LLM: Ollama + exaone3.5
- 임베딩: HuggingFace `snunlp/KR-SBERT-V40K-klueNLI-augSTS`

## 최근 수정 사항 (2026-02-01)

### 1. 단어 정의 형식 통일 (`rag-ai/ArticleAnalyzer.py`)
- 프롬프트 개선: `{단어}은(는) ~이다.` 형식으로 일관된 출력
- 후처리 추가: 마크다운 볼드(`**`), 접두사, 따옴표 자동 제거
- 위치: `_refine_definition_with_llm()` 함수

### 2. 요약 마크다운 렌더링 (`ai-article-front/`)
- `parseMarkdownBold()` 함수 추가
- `**키워드**` → 파란색 볼드로 표시
- 적용 파일:
  - `src/pages/article_content.tsx` (ArticleSummary 컴포넌트)
  - `src/components/AnalysisResult.tsx`

### 3. 키워드 중복 필터링 (`rag-ai/news_keyword_extractor.py`)
- `_filter_similar_keywords()` 함수 추가
- 부분 문자열 중복 제거 (예: "공급" + "공급망" → "공급망"만 유지)

### 4. 이미지 크롤링 (`scripts/crawling.py`)
- `extract_image_url()` 함수 추가
- 네이버 기본 로고 필터링 (`pstatic.net/static.news` 제외)
- og:image 또는 본문 내 이미지 추출

### 5. 크롤링 타임아웃 증가
- 10초 → 300초 (AI 분석 시간 고려)

## 카테고리 목록

| 코드 | 이름 |
|------|------|
| 100 | 정치 |
| 101 | 경제 |
| 102 | 사회 |
| 103 | 생활/문화 |
| 104 | 세계 |
| 105 | IT/과학 |
| 106 | 엔터 |

## 완료된 작업 (2026-02-02)

### DB 초기화
- 카테고리 106 (엔터) 추가 완료
- 관련 테이블 초기화 완료:
  - `extracted_keyword_v2`: 150건 삭제
  - `article_processed_content_v2`: 30건 삭제
  - `article_category_map_v2`: 30건 삭제
  - `category_keyword_trend_snapshot`: 3169건 삭제
  - `keyword`: 4094건 삭제
- `word_definition` 테이블은 유지 (정의는 재사용 가능)

## 최근 수정 사항 (2026-02-02 저녁)

### 1. cp949 인코딩 오류 수정 (`rag-ai/ArticleAnalyzer.py`, `api_main.py`)
- `sanitize_text()` 함수 추가: 특수문자를 일반 문자로 변환
- 처리 문자: en-dash, em-dash, bullet, smart quotes, zero-width space 등
- 적용 위치: 네이버 API 결과, RAG 결과, LLM 정제 결과, 에러 메시지
- **추가 수정 (2026-02-03)**:
  - `\u22ef` (midline horizontal ellipsis ⋯) 문자 추가
  - `api_main.py`에서 기사 제목 출력 시 `sanitize_text()` 적용

### 2. 관심 키워드 초기화 버튼 개선 (`ai-article-front/src/pages/MyPage.tsx`)
- 백엔드 API 연동하여 완전 초기화 (기존: UI만 초기화)
- localStorage 동시 삭제
- 확인 다이얼로그 추가
- 빨간색 "전체 초기화" 버튼 스타일

### 3. 기사에서 관심 키워드 등록 기능 (`ai-article-front/src/pages/article_content.tsx`)
- KeywordSection 컴포넌트에 키워드 등록 기능 추가
- 키워드 클릭 시 `+` 버튼으로 관심 키워드 등록
- 이미 등록된 키워드는 체크(✓) 표시
- 최대 4개 제한, 비로그인 시 비활성화

## 최근 수정 사항 (2026-02-03)

### 1. 기사 분석 API (`/api/articles/analyze`)
- 프론트엔드에서 URL 입력 → 실시간 크롤링 + AI 분석
- `ArticleSummaryController.java`에 POST 엔드포인트 추가
- Python 크롤러(`crawling.py`) → RAG AI → DB 저장 → 결과 반환
- 기존 mock 데이터 제거, 실제 API 호출로 변경

### 2. 북마크 기능 전체 구현

**백엔드 API (4개)**
- `GET /api/mypage/bookmarks/ids` - 북마크된 기사 ID 목록
- `GET /api/mypage/bookmarks` - 북마크 목록 (기사 정보 포함)
- `POST /api/mypage/bookmarks` - 북마크 추가
- `DELETE /api/mypage/bookmarks/{articleId}` - 북마크 삭제

**새 파일**
- `UserBookmark.java` - 북마크 엔티티
- `UserBookmarkRepository.java` - 북마크 레포지토리
- `useBookmarks.ts` - 프론트엔드 북마크 hook
- `BookmarkSection.tsx` - 마이페이지 북마크 목록 컴포넌트

**UI 변경**
- `ArticleCardList.tsx` - 모든 기사 카드에 하트 버튼 추가
- `article_content.tsx` - 기사 상세 페이지 헤더에 하트 버튼
- `MyPage.tsx` - 북마크 섹션 추가 (목록/삭제/이동)

### 3. 분석하기 UI 개선 (`ArticleInput.tsx`)
- 불필요한 탭 UI 제거 (URL 입력 탭 버튼 삭제)
- 분석 소요시간 안내 문구 추가: "실시간 AI 분석으로 1~2분 정도 소요"

### 4. 카테고리 키워드 조회 개선
- `ExtractedKeywordV2Repository` - 카테고리별 키워드 조회 Native Query 추가
- `CategoryService` - 스냅샷 테이블 대신 extracted_keyword_v2에서 직접 조회
- 기사 분석되면 해당 카테고리 키워드 바로 표시

### 5. DB 설정 변경
- `application.properties`: `ddl-auto=validate` → `update` (테이블 자동 생성)
- `user_bookmark` 테이블 자동 생성됨

## 배포 완료 (2026-02-04)

### 배포 URL
| 서비스 | URL | 플랫폼 |
|--------|-----|--------|
| Frontend | https://ai-article-web.vercel.app | Vercel |
| Backend | https://ai-article-web-production.up.railway.app | Railway ($5/월) |
| RAG AI | ngrok 터널 (로컬 데스크탑) | localhost:8020 |

### 배포 구조
```
[사용자] → Vercel (Frontend)
              ↓
         Railway (Backend) ← RAG_AI_URL 환경변수
              ↓
         ngrok 터널 → 로컬 데스크탑 (RAG AI + Ollama)
              ↓
         MariaDB (203.231.146.220:3306)
```

### 환경변수 설정 (Railway)
- `RAG_AI_URL`: ngrok 터널 URL (매번 변경됨, 확인 필요)

### 로컬 서버 실행 명령어 (데스크탑)

**1. RAG AI 서버**
```bash
cd C:\ai-article-web\ai-article-web\rag-ai
C:\dev\venv\Scripts\uvicorn.exe api_main:app --host 0.0.0.0 --port 8020
```

**2. ngrok 터널**
```bash
ngrok http 8020
```

**3. 자동 크롤링 (무한 루프)**
```bash
cd C:\ai-article-web\ai-article-web\scripts
C:\dev\venv\Scripts\python.exe crawling.py --keywords "정치" "경제" "사회" "생활/문화" "IT/과학" "세계" "연예" --max-articles-per-keyword 5 --total-phases 1 --loop --wait-min 300 --wait-max 600
```

## 최근 수정 사항 (2026-02-04)

### 1. 반응형 UI 개선 (모바일 대응)
- `Header.tsx`: 모바일 햄버거 메뉴 추가
- `App.tsx`: 화면 크기 감지하여 사이드바 동적 표시
- `KeywordCategories.tsx`: 모바일 패딩/타이틀 크기 조정
- `ArticleCardList.tsx`: 기사 카드 및 검색창 반응형 레이아웃
- 768px 미만: 사이드바 숨김 + 햄버거 메뉴
- 768px 이상: 사이드바 항상 표시

### 2. 영문 기사 필터링 (`scripts/crawling.py`)
- `contains_korean()`: 한글 포함 여부 체크
- `is_korean_article()`: 제목/본문에 한글 없으면 영문 기사로 판단
- 영문 기사는 `⏭️ SKIP (영문 기사)` 로그와 함께 자동 제외

### 3. 저작권 문구 제거 (`scripts/crawling.py`)
- `clean_article_body()`: 기사 본문에서 불필요한 내용 제거
- 제거 대상:
  - 저작권 문구: `<저작권자 ⓒ MBN 무단전재 및 재배포 금지>`
  - 기자 이메일
  - 구독/앱 유도 문구
  - 연속 줄바꿈

## 최근 수정 사항 (2026-02-07)

### 1. 다크 모드 구현
- Tailwind `darkMode: 'class'` 설정
- next-themes ThemeProvider 래핑
- Header에 테마 토글 버튼 추가 (Sun/Moon 아이콘)
- HomePage, ArticleCardList, KeywordCategories, article_content 다크 모드 대응
- 시스템 테마 자동 감지 지원

### 2. AI 채팅 기능 완성
- Backend: `/api/analysis/chat` 엔드포인트 추가
- RAG AI: `/chat` 엔드포인트 추가
- 기사 맥락 기반 질문 응답
- 텍스트 드래그 → AI 질문 기능
- AI Summary 섹션에 드래그 질문 안내 문구 추가

### 3. 프로필 이미지 업로드
- Base64 인코딩으로 DB 저장 방식 구현
- 2MB 파일 크기 제한
- MyPage.tsx에서 파일 선택 → Base64 변환 → 저장

### 4. 검색 기능 고도화
- Backend: `GET /api/articles/search?q=키워드` 엔드포인트 추가
- 제목 + 본문 내용 동시 검색 (LIKE 쿼리)
- Frontend: 클라이언트 필터링 → 백엔드 API 호출로 변경
- 검색 결과 초기화 버튼 추가 (검색창 옆)
- 검색 중 로딩 상태 표시
- 플레이스홀더: "제목 또는 내용 검색"
- 초기화 버튼 클릭 시 버튼 즉시 사라지도록 수정 (overrideQuery 파라미터)

## 게시판 기능 구현 (2026-02-10)

### 구조
- 카테고리별 게시판: 자유, 질문, 정보공유, 후기
- CRUD + 댓글(대댓글) + 좋아요
- 로그인 사용자만 작성 가능
- 관리자(ROLE_ADMIN)만 공지글 작성 가능

### Backend 완료
**Entity (5개)**
- `PostCategory.java` - 게시판 카테고리
- `Post.java` - 게시글 (조회수, 좋아요수, 댓글수, 소프트삭제, isPinned 공지)
- `Comment.java` - 댓글 (대댓글 지원)
- `PostLike.java` - 게시글 좋아요
- `CommentLike.java` - 댓글 좋아요

**Repository (5개)**
- `PostCategoryRepository.java`
- `PostRepository.java` - 공지글 우선 정렬 (isPinned DESC)
- `CommentRepository.java`
- `PostLikeRepository.java`
- `CommentLikeRepository.java`

**DTO (7개)**
- `PostCreateRequest.java`, `PostUpdateRequest.java`
- `PostListResponse.java`, `PostDetailResponse.java`
- `CommentCreateRequest.java`, `CommentResponse.java`
- `PostCategoryResponse.java`

**Service (3개)**
- `PostService.java` - 게시글 CRUD, 검색, 페이징, 관리자 공지 처리
- `CommentService.java` - 댓글 CRUD
- `LikeService.java` - 좋아요 토글

**Controller (1개)**
- `PostController.java` - 전체 API 엔드포인트 (null 체크로 401 반환)

### API 엔드포인트
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/posts/categories` | 카테고리 목록 | X |
| GET | `/api/posts` | 게시글 목록 (페이징) | X |
| GET | `/api/posts/{id}` | 게시글 상세 | X |
| POST | `/api/posts` | 게시글 작성 | O |
| PUT | `/api/posts/{id}` | 게시글 수정 | O |
| DELETE | `/api/posts/{id}` | 게시글 삭제 | O |
| GET | `/api/posts/search?q=` | 게시글 검색 | X |
| POST | `/api/posts/{id}/like` | 좋아요 토글 | O |
| POST | `/api/posts/{id}/comments` | 댓글 작성 | O |
| PUT | `/api/posts/comments/{id}` | 댓글 수정 | O |
| DELETE | `/api/posts/comments/{id}` | 댓글 삭제 | O |
| POST | `/api/posts/comments/{id}/like` | 댓글 좋아요 | O |

### Frontend 완료
- `BoardPage.tsx` - 게시글 목록, 카테고리 필터, 검색, 페이징
  - sticky 헤더 + 뒤로가기 버튼 (UpdatesPage 스타일)
  - 다크 테마 UI (`bg-[#090a0c]`, `border-white/10`)
- `PostDetailPage.tsx` - 상세보기, 댓글, 좋아요
  - AuthContext 사용 (localStorage 직접 접근 X)
  - 다크 테마 UI
- `PostWritePage.tsx` - 글쓰기/수정
  - 관리자만 공지글 체크박스 표시
  - AuthContext 사용
  - 다크 테마 UI
- Header에 커뮤니티 링크 추가
- 라우팅: `/board`, `/board/:category`, `/board/post/:postId`, `/board/write`, `/board/edit/:postId`

### 관리자 권한 부여 완료
- `wee7846@gmail.com` 계정에 `ROLE_ADMIN` 권한 부여됨
- SQL: `INSERT INTO user_roles (user_id, role_id) VALUES (1, 2)`

### 초기 카테고리 데이터
DB에 직접 실행 필요 (`data-post-category.sql`):
```sql
INSERT INTO post_category (category_code, category_name, description, display_order)
VALUES ('free', '자유게시판', '자유롭게 이야기를 나눠보세요', 1),
       ('question', '질문게시판', '궁금한 점을 질문해보세요', 2),
       ('info', '정보공유', '유용한 정보를 공유해주세요', 3),
       ('review', '후기게시판', '서비스 이용 후기를 남겨주세요', 4);
```

### ✅ 해결됨: 글쓰기 401 에러 (2026-02-11)
**증상**: 로그인 후에도 게시글 작성 시 401 Unauthorized 에러 발생

**원인**: `@AuthenticationPrincipal User` 타입 불일치
- Spring Security가 `UserDetailsImpl`을 반환하는데 `User` 엔티티로 캐스팅 시도
- 캐스팅 실패로 `currentUser`가 항상 null

**해결 방법** (커밋 5cf9954):
```java
// Before: @AuthenticationPrincipal User currentUser (타입 불일치)
// After: SecurityContextHolder에서 UserDetailsImpl 직접 추출
private Integer getCurrentUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth.getPrincipal() instanceof UserDetailsImpl details) {
        return details.getUserId();
    }
    return null;
}
```

**추가 수정사항**:
- 프로필 이미지 500 에러: DB 컬럼 `VARCHAR` → `LONGTEXT` 변경
- 돌아가기 버튼: `navigate(-1)` → `navigate('/home')` 변경

## 사용자별 기사 분석 기록 (2026-02-11)

### 기능
- 로그인 사용자가 URL로 기사 분석 시 결과를 DB에 저장
- 마이페이지에서 분석 기록 조회/삭제 가능
- RAG AI 서버 `/analyze-url` 엔드포인트 직접 호출 (Python 크롤러 불필요)

### Backend

**Entity**
- `UserAnalyzedArticle.java` - 분석 기록 저장 (제목, 본문, 요약, 키워드, 정의, 이미지URL 등)

**Repository**
- `UserAnalyzedArticleRepository.java` - 사용자별 분석 기록 조회

**Service**
- `UserAnalyzedArticleService.java` - 분석 기록 CRUD

**DTO**
- `AnalyzeUrlRequest.java` - RAG AI 요청 (snake_case: `article_url`)
- `AnalyzeUrlResponse.java` - RAG AI 응답
- `UserAnalyzedArticleResponse.java` - 프론트엔드 응답

**API 엔드포인트**
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/articles/analyze` | URL 분석 + 결과 저장 | O |
| GET | `/api/mypage/analyzed-articles` | 분석 기록 목록 | O |
| GET | `/api/analyzed-article/{id}` | 분석 기록 상세 | O |
| DELETE | `/api/analyzed-article/{id}` | 분석 기록 삭제 | O |

### Frontend

**새 파일**
- `AnalyzedArticlePage.tsx` - 분석 결과 상세 페이지 (`/analyzed/:id`)
- `AnalyzedArticleSection.tsx` - 마이페이지 분석 기록 목록 컴포넌트

**수정된 파일**
- `App.tsx` - 라우트 추가, `handleAnalyze()` 수정 (로그인 시 분석 결과 페이지로 이동)
- `MyPage.tsx` - 분석 기록 섹션 추가

### RAG AI

**새 엔드포인트**
- `POST /analyze-url` - URL에서 기사 크롤링 + AI 분석 수행
  - 요청: `{ "article_url": "https://..." }`
  - 응답: `{ "success": true, "title": "...", "summary": "...", "keywords": [...], "definitions": {...}, ... }`

## 도메인 및 SEO 설정 (2026-02-17)

### 커스텀 도메인
- **도메인**: `aharead.com`
- **구매처**: (도메인 등록 업체)
- **DNS**: Cloudflare

### 배포 구조 (업데이트)
```
[사용자] → aharead.com → Cloudflare Worker → prerender.io (봇) / Vercel (일반)
                                    ↓
                              Vercel (Frontend)
                                    ↓
                              Railway (Backend)
```

### Cloudflare 설정
- **Worker 이름**: `aharead-prerender`
- **기능**: 검색 봇 감지 → prerender.io로 프록시
- **봇 허용 규칙**: Security → Security rules → Custom rules
  - Rule: `Allow Naver Bot` - User Agent contains "Yeti" or "Googlebot" → Skip

### prerender.io 설정
- **계정**: 가입 완료 (무료 플랜, 월 250회)
- **토큰**: Cloudflare Worker 환경변수에 저장
- **캐시 관리**: https://prerender.io → Cache Manager
- **주의**: 코드 변경 후 캐시 삭제 필요 (`clear cache`)

### 검색엔진 등록 현황

| 플랫폼 | 상태 | URL |
|--------|------|-----|
| 네이버 서치어드바이저 | ✅ 소유권 확인 완료, 사이트맵 제출 완료 | https://searchadvisor.naver.com |
| 구글 서치콘솔 | ✅ 소유권 확인 완료, 사이트맵 제출 완료 | https://search.google.com/search-console |

### 메타 태그 (index.html)
```html
<!-- 네이버 서치어드바이저 -->
<meta name="naver-site-verification" content="dcd3d2f73f0409732734c882921df23527c6bf6c" />
<meta name="naver-site-verification" content="bc4fc2c6977231b5e922cbae621f0aaf592d1b3a" />

<!-- 구글 서치콘솔 -->
<meta name="google-site-verification" content="LJoNpweN77r27SkzzvvWeT_7UqtAxWoIqwX_6L1hXvc" />
```

### 대기 중인 작업
- [ ] **1~2주 후 색인 확인**: 구글/네이버에서 `site:aharead.com` 검색
- [ ] **색인 확인되면 구글 애드센스 재신청**

---

## 최근 수정 사항 (2026-02-16)

### AI 채팅 UI 개선
- 전체 색상 테마를 indigo/purple로 통일
- 리사이즈 핸들을 왼쪽 위로 이동 (overflow:hidden으로 인한 클리핑 해결)
- 사용자 메시지 배경색 개선: `bg-indigo-100` + `text-black` (가독성 대폭 개선)
- 다크모드 채팅 입력창 배경색 강화: `bg-white/5` → `bg-slate-700`
- AI 응답 메시지 다크모드 대비 개선: `bg-white/10` → `bg-slate-700`
- 채팅 입력창 및 메시지 텍스트를 검정색으로 변경
- 적용 파일: `AnalyzedArticlePage.tsx`, `article_content.tsx`

### prerender.io 연동 (SEO 개선)
- **문제**: React SPA라서 네이버/구글 봇이 JavaScript를 실행 못해 빈 페이지로 인식
- **해결**: prerender.io 미들웨어 추가하여 봇에게 렌더링된 HTML 제공
- **설정 파일**: `ai-article-front/middleware.ts`
- **환경변수**: Vercel에 `PRERENDER_TOKEN` 추가 필요
- **prerender.io 계정**: 가입 완료 (무료 플랜, 월 250회)
- **토큰**: Vercel 환경변수에 저장됨

### 검색엔진 색인 현황
- **Google**: 2페이지 색인됨, 3페이지 대기 중 (일일 할당량 제한)
- **네이버**: prerender.io 설정 완료, 수집 요청 필요

### ✅ 완료됨 (2026-02-17)
1. ~~네이버 서치어드바이저에서 웹 페이지 수집 요청~~ → aharead.com으로 완료
2. ~~Google Search Console에서 색인 요청~~ → aharead.com으로 완료
3. 색인 성공 확인 후 검색 테스트 → **1~2주 대기 중**

## 다음 작업 (TODO)

### 🔴 우선순위 높음 (2026-02-12 수정 필요)
- [x] **AnalyzedArticlePage 본문 표시** ✅
  - 확인 완료: 백엔드에서 body 필드 정상 반환
  - App.tsx에서 data.body 전달 완료
- [x] **AnalyzedArticlePage에 "AI에게 질문하기" UI 추가** ✅
  - 기존 article_content.tsx의 ChatSection 컴포넌트 가져오기
  - 분석 결과 페이지에서도 AI 질문 가능하도록
- [x] **키워드 추출 품질 개선** ✅
  - 연속된 명사를 복합어로 결합하는 로직 추가 (`news_keyword_extractor.py`)
  - "청년도약계좌", "청년미래적금" 등 복합 키워드가 분리되지 않고 유지됨
- [x] **요약 품질 개선** ✅
  - LLM 프롬프트에 구체적인 예시와 규칙 추가 (`ArticleAnalyzer.py`)
  - "키워드만 작성하고 설명 생략 금지" 규칙 명시
  - 올바른 예시/잘못된 예시 포함하여 LLM 가이드
- [x] **AI 채팅 UI 개선** ✅
  - 플로팅 버튼 형태로 변경 (우측 하단 고정)
  - 클릭 시 채팅창 확장/축소 토글
  - 그라데이션 디자인 + 애니메이션 효과
  - 텍스트 드래그 시 채팅창 자동 열림
  - 적용 파일: `AnalyzedArticlePage.tsx`, `article_content.tsx`

### 🟢 우선순위 낮음
- [ ] **Google AdSense 적용**
  - [x] 개인정보처리방침 페이지 생성 ✅ (`/privacy`)
  - [x] 이용약관 페이지 생성 ✅ (`/terms`)
  - [x] Footer 컴포넌트 추가 (HomePage) ✅
  - [ ] AdSense 계정 신청 및 승인 (https://www.google.com/adsense)
  - [ ] 승인 후 광고 코드 삽입 (`index.html`에 스크립트 추가)

## 현재 작업 브랜치

- `main` - 메인 브랜치

## Git 컨벤션

- 커밋 메시지: `[타입] 설명` (feat, fix, refactor, docs, chore)

## Docker Hub 이미지

Docker Hub 계정: `hyopang`

| 이미지 | 크기 | 설명 |
|--------|------|------|
| `hyopang/ai-article-backend:latest` | 541MB | Spring Boot 백엔드 |
| `hyopang/ai-article-frontend:latest` | 74.6MB | React 프론트엔드 (Nginx) |
| `hyopang/ai-article-rag-ai:latest` | 13.2GB | Python AI 엔진 |

```bash
# 이미지 Pull
docker pull hyopang/ai-article-backend:latest
docker pull hyopang/ai-article-frontend:latest
docker pull hyopang/ai-article-rag-ai:latest
```

## 원격 개발 설정 (TODO)

### 목적
- 데스크탑(GPU)에서 AI 서버 실행
- 노트북에서 외부 개발 시 원격 접속

### 다음 작업
1. **Tailscale 설치** (데스크탑 + 노트북) - VPN 연결
2. 데스크탑에서 `docker-compose up -d` 실행
3. VS Code Remote SSH로 노트북에서 원격 개발

### 구조
```
데스크탑 (Docker 서비스 실행)
  ├── backend:8080
  ├── frontend:5173
  ├── rag-ai:8020
  └── db:3307
       ▲
       │ Tailscale VPN
       ▼
노트북 (VS Code Remote SSH로 접속)
```

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
C:\dev\venv\Scripts\python.exe crawling.py --keywords "정치" "경제" "사회" "생활" "세계" "IT" "연예" --max-articles-per-keyword 5 --total-phases 1 --loop --wait-min 300 --wait-max 600
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

## 다음 작업 (TODO)

### 🔴 우선순위 높음
- [ ] **AI 채팅 기능 구현** - 기사 맥락 기반 대화
  - RAG AI에 `/chat` 엔드포인트 추가
  - `ArticleChat.tsx` 실제 API 연결 (현재 mock 데이터)

### 🟡 우선순위 중간
- [ ] 다크 모드 추가
- [ ] 프로필 이미지 업로드 기능 완성 (현재 UI만 있음)
- [ ] 검색 기능 고도화 (내용 검색)

### 🟢 우선순위 낮음
- [ ] Tailscale 원격 개발 환경 구축
- [ ] **Google AdSense 적용**
  - [ ] 개인정보처리방침 페이지 생성
  - [ ] 이용약관 페이지 생성
  - [ ] AdSense 계정 신청 및 승인
  - [ ] 광고 코드 삽입

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

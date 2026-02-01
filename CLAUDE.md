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

## 다음 작업 (TODO)

### 즉시 필요
1. **word_definition 테이블 초기화** - 이전 형식의 정의 삭제 필요
   ```sql
   DELETE FROM word_definition;
   ```
2. 서버 재시작 (RAG AI, Frontend)
3. 단일 크롤링 테스트로 형식 확인

### 테스트 완료 후
- 대량 크롤링 실행
- 프론트엔드에서 요약/키워드/단어해석 표시 확인

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

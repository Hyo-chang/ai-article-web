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

- 현재: **테스트 모드** (더미 데이터 반환)
- 이유: 로컬 환경 성능 부족 (Ollama + exaone3.5)
- 배포 시: `api_main.py`에서 테스트 모드 해제 후 실제 AI 분석 활성화

## 현재 작업 브랜치

- `main` - 메인 브랜치

## Git 컨벤션

- 커밋 메시지: `[타입] 설명` (feat, fix, refactor, docs, chore)

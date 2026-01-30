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

## 현재 작업 브랜치

- `main` - 메인 브랜치

## Git 컨벤션

- 커밋 메시지: `[타입] 설명` (feat, fix, refactor, docs, chore)

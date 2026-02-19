# AhaRead - AI 뉴스 분석 플랫폼

> **서비스 URL**: https://aharead.com

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
  --keywords "정치" "경제" "사회" "IT/과학" \
  --max-articles-per-keyword 5 --total-phases 1 \
  --loop --wait-min 300 --wait-max 600
```

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

### 검색엔진 등록
- Google Search Console: ✅ 완료
- Naver Search Advisor: ✅ 완료

### 메타 태그 (index.html)
```html
<meta name="naver-site-verification" content="bc4fc2c6977231b5e922cbae621f0aaf592d1b3a" />
<meta name="google-site-verification" content="LJoNpweN77r27SkzzvvWeT_7UqtAxWoIqwX_6L1hXvc" />
```

## Git 컨벤션

```
feat: 새 기능
fix: 버그 수정
refactor: 리팩토링
docs: 문서
chore: 기타
```

---

## 최근 작업 (2026-02-19)

### 코드 정리
- 프론트엔드 미사용 컴포넌트 8개 삭제 (899줄)
  - `ArticleHistory.tsx`, `KeywordExplorer.tsx`
  - `ui/checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `drawer.tsx`, `table.tsx`, `textarea.tsx`
- 백엔드 미사용 컨트롤러 2개 삭제 (66줄)
  - `UserReadHistoryController.java`, `TrendController.java`

### AI 툴팁 추가
- 기사 상세 페이지 AI 버튼 옆 말풍선 툴팁
- "다시 보지 않기" 클릭 시 localStorage 저장

---

## TODO

- [ ] Google AdSense 신청 (색인 확인 후)
- [ ] 기사 추천 알고리즘 고도화

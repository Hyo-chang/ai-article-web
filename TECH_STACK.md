# AI Article Reader - 기술 스택

> AI 기반 뉴스 기사 자동 수집, 요약, 분석 플랫폼

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | AI Article Reader |
| 개발 기간 | 2026.02.01 ~ 현재 |
| 팀 구성 | 1인 개발 |
| 서비스 URL | https://ai-article-web.vercel.app |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                             │
│                    React + TypeScript + Vite                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Railway)                             │
│                    Spring Boot + Java 21                         │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│      MariaDB              │   │      RAG AI Engine            │
│      (Database)           │   │      FastAPI + LangChain      │
└───────────────────────────┘   └───────────────────────────────┘
                                              │
                                              ▼
                                ┌───────────────────────────────┐
                                │      Ollama + exaone3.5       │
                                │      (Local LLM)              │
                                └───────────────────────────────┘
```

---

## Backend

### 핵심 기술

| 기술 | 버전 | 용도 |
|------|------|------|
| **Java** | 21 (LTS) | 메인 언어 |
| **Spring Boot** | 3.5.6 | 웹 프레임워크 |
| **Spring Security** | 6.x | 인증/인가 (JWT) |
| **Spring Data JPA** | 3.x | ORM, 데이터 접근 |
| **MariaDB** | 11.2 | 관계형 데이터베이스 |
| **Lombok** | 1.18.x | 보일러플레이트 코드 감소 |

### 주요 구현 기능

- **JWT 인증**: Access Token 기반 Stateless 인증
- **RESTful API**: 기사 CRUD, 사용자 관리, 북마크, 검색
- **검색 API**: 제목 + 본문 동시 검색 (JPQL LIKE 쿼리)
- **AI 연동**: RAG AI 서버와 HTTP 통신 (WebClient)

### 디렉토리 구조

```
ai-article-backend/
├── src/main/java/com/team/aiarticle/
│   ├── controller/     # REST API 엔드포인트
│   ├── service/        # 비즈니스 로직
│   ├── repository/     # JPA Repository
│   ├── entity/         # JPA Entity
│   ├── dto/            # Data Transfer Object
│   └── security/       # JWT, Spring Security 설정
└── src/main/resources/
    └── application.properties
```

---

## Frontend

### 핵심 기술

| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 18.x | UI 라이브러리 |
| **TypeScript** | 5.x | 정적 타입 |
| **Vite** | 6.x | 빌드 도구 |
| **Tailwind CSS** | 3.4.x | 유틸리티 CSS |
| **React Router** | 6.x | 클라이언트 라우팅 |
| **Framer Motion** | 11.x | 애니메이션 |

### 추가 라이브러리

| 라이브러리 | 용도 |
|------------|------|
| **next-themes** | 다크모드/라이트모드 테마 관리 |
| **lucide-react** | 아이콘 라이브러리 |
| **sonner** | 토스트 알림 |
| **clsx / tailwind-merge** | 조건부 클래스 관리 |

### 주요 구현 기능

- **반응형 UI**: 모바일/태블릿/데스크톱 대응
- **다크 모드**: 시스템 테마 자동 감지 + 수동 전환
- **무한 스크롤 & 페이지네이션**: 기사 목록
- **드래그 선택 → AI 질문**: 텍스트 선택 후 AI에게 질문
- **북마크**: 기사 저장 및 관리
- **관심 키워드**: 맞춤 기사 우선 노출

### 디렉토리 구조

```
ai-article-front/
├── src/
│   ├── components/     # 재사용 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── hooks/          # 커스텀 훅
│   ├── services/       # API 호출, 인증 컨텍스트
│   ├── types/          # TypeScript 타입 정의
│   └── App.tsx         # 라우터 설정
├── public/
└── tailwind.config.cjs
```

---

## AI / RAG Engine

### 핵심 기술

| 기술 | 버전 | 용도 |
|------|------|------|
| **Python** | 3.11+ | 메인 언어 |
| **FastAPI** | 0.100+ | 비동기 웹 프레임워크 |
| **LangChain** | 0.1.x | LLM 오케스트레이션 |
| **ChromaDB** | 0.4.x | 벡터 데이터베이스 |
| **Ollama** | - | 로컬 LLM 서빙 |
| **exaone3.5** | - | 한국어 특화 LLM (LG AI Research) |

### 임베딩 모델

| 모델 | 용도 |
|------|------|
| **snunlp/KR-SBERT-V40K-klueNLI-augSTS** | 한국어 문장 임베딩 (HuggingFace) |

### 주요 구현 기능

- **기사 요약**: 3단계 구조화 요약 생성
- **키워드 추출**: 핵심 키워드 자동 추출
- **단어 정의**: 전문용어/신조어 설명 생성
- **RAG 채팅**: 기사 맥락 기반 Q&A
- **카테고리 분류**: AI 기반 자동 분류

### 디렉토리 구조

```
rag-ai/
├── api_main.py           # FastAPI 엔드포인트
├── ArticleAnalyzer.py    # 기사 분석 로직
├── news_keyword_extractor.py  # 키워드 추출
├── chroma_store.py       # 벡터 DB 관리
└── .env                  # 환경 변수
```

---

## Crawler

### 핵심 기술

| 기술 | 용도 |
|------|------|
| **Python** | 크롤링 스크립트 |
| **Naver Search API** | 뉴스 검색 |
| **BeautifulSoup4** | HTML 파싱 |
| **Requests** | HTTP 요청 |

### 주요 기능

- **네이버 뉴스 크롤링**: n.news.naver.com 기사 수집
- **본문 추출**: 통일된 HTML 구조에서 본문 파싱
- **이미지 추출**: og:image 또는 본문 이미지
- **영문 기사 필터링**: 한글 미포함 기사 자동 제외
- **저작권 문구 제거**: 불필요한 문구 클리닝
- **자동 루프**: 주기적 크롤링 (5~10분 간격)

---

## Infrastructure & DevOps

### 배포 환경

| 서비스 | 플랫폼 | 비용 |
|--------|--------|------|
| Frontend | **Vercel** | 무료 |
| Backend | **Railway** | $5/월 |
| RAG AI | **로컬 서버 + ngrok** | 무료 |
| Database | **MariaDB** (자체 서버) | - |

### 배포 파이프라인

```
GitHub Push → Vercel/Railway 자동 배포 (CI/CD)
```

### 컨테이너화

| 기술 | 용도 |
|------|------|
| **Docker** | 컨테이너 런타임 |
| **Docker Compose** | 멀티 컨테이너 오케스트레이션 |

### Docker 이미지

```bash
# Docker Hub
hyopang/ai-article-backend:latest   # 541MB
hyopang/ai-article-frontend:latest  # 74.6MB
hyopang/ai-article-rag-ai:latest    # 13.2GB
```

---

## 데이터베이스 스키마

### 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `user` | 사용자 정보 |
| `articlev2` | 기사 정보 (제목, 본문, 요약, 키워드) |
| `user_bookmark` | 사용자 북마크 |
| `user_read_history` | 열람 기록 |
| `user_interest` | 관심 카테고리 |
| `category_dict_v2` | 카테고리 사전 |
| `extracted_keyword_v2` | 추출된 키워드 |
| `word_definition` | 단어 정의 |

### ERD 요약

```
User ──────┬──── UserBookmark ──── ArticleV2
           │
           ├──── UserReadHistory ── ArticleV2
           │
           └──── UserInterest ───── CategoryDictV2
```

---

## 개발 환경

### 필수 도구

| 도구 | 용도 |
|------|------|
| **Git** | 버전 관리 |
| **VS Code** | IDE |
| **IntelliJ IDEA** | Java IDE (선택) |
| **Postman** | API 테스트 |
| **Docker Desktop** | 컨테이너 관리 |

### 로컬 실행

```bash
# 전체 스택 실행
docker-compose up -d

# 개별 실행
cd ai-article-backend && mvn spring-boot:run
cd ai-article-front && npm run dev
cd rag-ai && uvicorn api_main:app --port 8020
```

---

## 주요 성과 및 특징

### 기술적 성과

- **Full-Stack 개발**: 백엔드, 프론트엔드, AI 엔진 전체 구현
- **RAG 시스템 구축**: LangChain + ChromaDB 기반 검색 증강 생성
- **로컬 LLM 연동**: Ollama + exaone3.5 한국어 특화 모델 활용
- **실시간 크롤링**: 네이버 뉴스 자동 수집 및 분석 파이프라인

### UX 개선

- **반응형 디자인**: 모바일 우선 접근
- **다크 모드**: 시스템 테마 연동
- **AI 채팅**: 드래그 선택 → 질문 UX

### 배포 및 운영

- **CI/CD**: GitHub → Vercel/Railway 자동 배포
- **모니터링**: Railway 로그 대시보드
- **비용 최적화**: 프론트엔드 무료 배포, 백엔드 최소 플랜

---

## 향후 개선 계획

- [ ] Full-Text Search (MySQL FULLTEXT 또는 Elasticsearch)
- [ ] 게시판 및 댓글 기능
- [ ] Google AdSense 수익화
- [ ] 성능 모니터링 (Sentry, DataDog)
- [ ] 테스트 코드 작성 (JUnit, Jest)

---

## 라이선스

MIT License

---

## 연락처

- **GitHub**: [Hyo-chang](https://github.com/Hyo-chang)
- **Email**: (이메일 주소)

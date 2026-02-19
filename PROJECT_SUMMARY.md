# AhaRead - AI 기반 뉴스 분석 플랫폼

> **서비스 URL**: https://aharead.com

AI가 뉴스 기사를 자동으로 수집, 요약, 분석하여 사용자에게 핵심 정보를 제공하는 웹 플랫폼

---

## 기술 스택

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| **Java** | 21 (LTS) | 메인 언어 |
| **Spring Boot** | 3.5.6 | REST API 서버 |
| **Spring Security** | 6.x | JWT 인증/인가 |
| **Spring Data JPA** | - | ORM, 데이터 접근 |
| **MySQL** | 8.0 | 운영 데이터베이스 (Railway) |
| **MariaDB Driver** | - | JDBC 드라이버 |

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 18 | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안정성 |
| **Vite** | 6.x | 빌드 도구 |
| **Tailwind CSS** | 3.x | 스타일링 |
| **React Router** | 6.x | 클라이언트 라우팅 |
| **next-themes** | - | 다크 모드 지원 |

### AI / ML
| 기술 | 용도 |
|------|------|
| **Python 3.11** | AI 엔진 |
| **FastAPI** | AI API 서버 |
| **LangChain** | LLM 오케스트레이션 |
| **Ollama + Exaone 3.5** | 로컬 LLM (요약, 분석) |
| **HuggingFace Transformers** | 한국어 임베딩 모델 |
| **Chroma** | 벡터 데이터베이스 |
| **KiwiPiePy** | 한국어 형태소 분석 |

### DevOps / Infra
| 기술 | 용도 |
|------|------|
| **Vercel** | 프론트엔드 호스팅 |
| **Railway** | 백엔드 + MySQL 호스팅 |
| **Cloudflare** | DNS, CDN, WAF |
| **Docker** | 컨테이너화 |
| **GitHub Actions** | CI/CD |
| **ngrok** | AI 서버 터널링 |

### SEO / Analytics
| 기술 | 용도 |
|------|------|
| **prerender.io** | SPA 서버사이드 렌더링 (봇용) |
| **Google Search Console** | 검색엔진 색인 관리 |
| **Naver Search Advisor** | 네이버 검색 등록 |

---

## 주요 기능

### 1. AI 기사 분석
- 뉴스 URL 입력 시 실시간 크롤링 + AI 분석
- **3줄 요약**: LLM 기반 핵심 내용 추출
- **키워드 추출**: 형태소 분석 + 복합어 처리
- **단어 정의**: 어려운 용어 자동 설명

### 2. 기사 큐레이션
- 7개 카테고리별 뉴스 자동 수집 (정치, 경제, 사회, IT/과학 등)
- 네이버 뉴스 API 기반 크롤링
- 영문 기사 자동 필터링
- 저작권 문구 자동 제거

### 3. AI 챗봇
- 기사 맥락 기반 질의응답
- 텍스트 드래그 → AI 질문 기능
- 플로팅 채팅 UI (리사이즈 가능)

### 4. 사용자 기능
- JWT 기반 회원 인증
- 기사 북마크 / 열람 기록
- 관심 키워드 설정 (개인화)
- 프로필 이미지 업로드

### 5. 커뮤니티
- 게시판 CRUD (자유/질문/정보/후기)
- 댓글 / 대댓글
- 좋아요 기능
- 관리자 공지글

### 6. UI/UX
- 반응형 디자인 (모바일 대응)
- 다크 모드 지원
- 실시간 검색 (제목 + 본문)

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                         사용자                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare (DNS/CDN)                     │
│                    - WAF (봇 허용 규칙)                      │
│                    - prerender.io 연동                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│   Vercel (Frontend)  │         │  Railway (Backend)   │
│   - React + Vite     │  ────▶  │  - Spring Boot       │
│   - Static Hosting   │         │  - REST API          │
└──────────────────────┘         └──────────────────────┘
                                          │
                         ┌────────────────┼────────────────┐
                         ▼                ▼                ▼
              ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
              │ Railway MySQL   │ │ ngrok Tunnel│ │ Naver News API  │
              │ - 사용자 데이터  │ │     │       │ │ - 기사 검색     │
              │ - 기사 데이터    │ │     ▼       │ └─────────────────┘
              └─────────────────┘ │ ┌─────────┐ │
                                  │ │ RAG AI  │ │
                                  │ │ Server  │ │
                                  │ │ (Local) │ │
                                  │ └─────────┘ │
                                  │     │       │
                                  │     ▼       │
                                  │ ┌─────────┐ │
                                  │ │ Ollama  │ │
                                  │ │ (LLM)   │ │
                                  │ └─────────┘ │
                                  └─────────────┘
```

---

## API 엔드포인트 (주요)

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 (JWT 발급) |

### 기사
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/articles` | 기사 목록 |
| GET | `/api/articles/search?q=` | 기사 검색 |
| POST | `/api/articles/analyze` | URL 분석 요청 |
| POST | `/api/analysis/chat` | AI 채팅 |

### 마이페이지
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/mypage/bookmarks` | 북마크 목록 |
| GET | `/api/mypage/history` | 열람 기록 |
| GET | `/api/mypage/analyzed-articles` | 분석 기록 |

### 게시판
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/posts` | 게시글 목록 |
| POST | `/api/posts` | 게시글 작성 |
| POST | `/api/posts/{id}/comments` | 댓글 작성 |

---

## 개발 성과

### 성능
- 기사 분석 평균 응답 시간: ~60초 (LLM 처리 포함)
- 프론트엔드 빌드 크기: 686KB (gzip: 214KB)

### SEO
- Google / Naver 검색엔진 등록 완료
- prerender.io로 SPA 크롤링 문제 해결

### 코드 품질
- TypeScript 적용으로 타입 안정성 확보
- 미사용 코드 정리 (965줄 삭제)

---

## 프로젝트 구조

```
ai-article-web/
├── ai-article-backend/     # Spring Boot 백엔드
│   ├── src/main/java/
│   │   ├── controller/     # REST 컨트롤러
│   │   ├── service/        # 비즈니스 로직
│   │   ├── repository/     # JPA 레포지토리
│   │   ├── entity/         # 엔티티 클래스
│   │   └── dto/            # 데이터 전송 객체
│   └── src/main/resources/
│       └── application.properties
│
├── ai-article-front/       # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 호출
│   │   └── types/          # TypeScript 타입
│   └── tailwind.config.cjs
│
├── rag-ai/                 # Python AI 엔진
│   ├── api_main.py         # FastAPI 서버
│   ├── ArticleAnalyzer.py  # 기사 분석 로직
│   └── news_keyword_extractor.py  # 키워드 추출
│
└── scripts/
    └── crawling.py         # 뉴스 크롤러
```

---

## 팀 구성

- **1인 개발** (풀스택)
  - 백엔드 설계 및 구현
  - 프론트엔드 UI/UX
  - AI 파이프라인 구축
  - 인프라 및 배포

---

## 향후 계획

- [ ] Google AdSense 적용
- [ ] 기사 추천 알고리즘 고도화
- [ ] 모바일 앱 (React Native)

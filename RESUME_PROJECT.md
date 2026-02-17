# AI Article (아하리드) - 프로젝트 포트폴리오

> AI 기반 뉴스 기사 자동 수집, 요약, 분석 플랫폼

**배포 URL**: https://aharead.com
**개발 기간**: 2026년 1월 ~ 2월 (약 2개월)
**개발 방식**: AI 페어 프로그래밍 (Claude Code 활용)

---

## 프로젝트 요약

뉴스 기사를 자동으로 수집하고, AI가 요약/키워드 추출/단어 정의를 제공하는 풀스택 웹 서비스.
사용자는 URL만 입력하면 실시간으로 기사를 분석받을 수 있으며, AI와 대화하며 기사 내용을 심층 이해할 수 있습니다.

---

## 기술 스택

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| **Java** | 21 | 메인 언어 |
| **Spring Boot** | 3.5.6 | 웹 프레임워크 |
| **Spring Security** | - | 인증/인가 (JWT) |
| **Spring Data JPA** | - | ORM |
| **Spring WebFlux** | - | 비동기 HTTP 클라이언트 |
| **MariaDB** | 11.2 | 관계형 데이터베이스 |
| **KOMORAN** | 3.3.9 | 한국어 형태소 분석 |
| **Maven** | - | 빌드 도구 |

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 18.3.1 | UI 라이브러리 |
| **TypeScript** | 5.9.3 | 타입 안전성 |
| **Vite** | 6.3.5 | 빌드 도구 |
| **Tailwind CSS** | 3.4.18 | 스타일링 |
| **Radix UI** | - | 접근성 UI 컴포넌트 (20+개) |
| **React Router** | 7.9.4 | 라우팅 |
| **Framer Motion** | 12.23.24 | 애니메이션 |
| **Axios** | 1.13.0 | HTTP 클라이언트 |
| **react-hook-form** | 7.55.0 | 폼 관리 |
| **Recharts** | 2.15.2 | 데이터 시각화 |

### AI Engine
| 기술 | 용도 |
|------|------|
| **Python** | 메인 언어 |
| **FastAPI** | API 서버 |
| **LangChain** | LLM 오케스트레이션 |
| **Ollama** | 로컬 LLM 서버 (exaone3.5) |
| **HuggingFace** | 한국어 임베딩 (KR-SBERT) |
| **Chroma** | 벡터 데이터베이스 |

### DevOps & Infra
| 기술 | 용도 |
|------|------|
| **Docker** | 컨테이너화 |
| **Docker Compose** | 멀티 서비스 오케스트레이션 |
| **Vercel** | 프론트엔드 배포 |
| **Railway** | 백엔드 배포 |
| **Cloudflare** | DNS, CDN, Worker |
| **prerender.io** | SPA SEO 최적화 |
| **ngrok** | AI 서버 터널링 |

---

## 주요 기능

### 1. 뉴스 기사 자동 수집
- 네이버 뉴스 API 기반 자동 크롤링
- 7개 카테고리 (정치, 경제, 사회, 생활/문화, 세계, IT/과학, 연예)
- 주기적 자동 수집 (5~10분 간격)
- 한글 기사 필터링, 중복 제거

### 2. AI 기사 분석
- **요약**: LLM 기반 1~2문단 핵심 요약
- **키워드 추출**: TF-IDF + 임베딩 유사도 기반 5개 핵심어
- **단어 정의**: LLM이 어려운 용어 설명 (DB 캐싱)
- **실시간 분석**: URL 입력 → 크롤링 → 분석 → 결과 표시

### 3. AI 채팅
- 기사 맥락 기반 질의응답
- 텍스트 드래그 → 자동 질문 팝업
- RAG (Retrieval Augmented Generation) 적용

### 4. 사용자 기능
- 회원가입/로그인 (JWT 인증)
- 북마크 저장/관리
- 분석 기록 저장/조회
- 관심 키워드 4개 설정
- 열람 이력 통계

### 5. 커뮤니티 (게시판)
- 4개 카테고리 (자유, 질문, 정보공유, 후기)
- 게시글 CRUD + 검색
- 댓글/대댓글
- 좋아요 토글
- 관리자 공지글

### 6. UI/UX
- 다크/라이트 모드 (시스템 감지)
- 반응형 디자인 (모바일/데스크탑)
- 마크다운 렌더링 (**키워드** 하이라이트)
- 플로팅 AI 채팅 버튼

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         사용자                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare (DNS + CDN)                        │
│                    ├── Worker (봇 감지)                          │
│                    └── prerender.io (SEO)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│   Vercel (Frontend)   │         │  Railway (Backend)   │
│   React + TypeScript  │ ◄─────► │  Spring Boot 3.5.6   │
│   Vite + Tailwind     │   API   │  JWT + JPA           │
└──────────────────────┘         └──────────────────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          ▼                                  ▼
               ┌──────────────────────┐         ┌──────────────────────┐
               │   MariaDB (Remote)    │         │  RAG AI (Local GPU)  │
               │   23개 테이블          │         │  FastAPI + LangChain │
               │   관계형 데이터        │         │  Ollama + exaone3.5  │
               └──────────────────────┘         └──────────────────────┘
```

---

## 개발 규모

| 항목 | 수량 |
|------|------|
| Java 파일 | 131개 |
| TypeScript/TSX 파일 | 91개 |
| Python 파일 | 3개 |
| DB 엔티티 | 23개 |
| REST API 엔드포인트 | 50개+ |
| UI 컴포넌트 | 50개+ |

### 백엔드 구조
- **Controller**: 10개 (인증, 기사, 게시판, 마이페이지 등)
- **Service**: 22개 (비즈니스 로직)
- **Repository**: 20개 (데이터 접근)
- **Entity**: 23개 (테이블 매핑)

### 프론트엔드 구조
- **Pages**: 12개 (홈, 기사, 게시판, 마이페이지 등)
- **Components**: 20개+ (Header, ArticleCard, Chat 등)
- **Hooks**: API 데이터 페칭
- **Context**: 인증 상태 관리

---

## 핵심 성과

### 1. 풀스택 개발
- 백엔드(Spring Boot) + 프론트엔드(React) + AI(Python) 3개 스택 통합
- 단일 개발자가 전체 시스템 설계 및 구현

### 2. AI/ML 파이프라인 구축
- LangChain RAG 아키텍처 구현
- 로컬 LLM (Ollama) 연동
- 한국어 최적화 (KR-SBERT 임베딩, KOMORAN 형태소 분석)

### 3. 멀티 플랫폼 배포
- Docker Compose로 4개 서비스 오케스트레이션
- Vercel + Railway + ngrok 하이브리드 배포
- 실 서비스 운영 중 (aharead.com)

### 4. SEO 최적화
- Cloudflare Worker로 봇 감지
- prerender.io로 SPA 정적 렌더링
- Google/Naver 검색엔진 등록 완료

### 5. 빠른 개발 속도
- AI 페어 프로그래밍 (Claude Code) 활용
- 약 2개월 만에 프로덕션 배포
- 반복적인 기능 추가 및 개선

---

## 기술적 도전과 해결

### 1. React SPA SEO 문제
- **문제**: 검색 봇이 JavaScript를 실행하지 못해 빈 페이지 인식
- **해결**: Cloudflare Worker + prerender.io로 봇에게 정적 HTML 제공

### 2. JWT 인증 타입 불일치
- **문제**: `@AuthenticationPrincipal`이 엔티티와 타입 불일치
- **해결**: `SecurityContextHolder`에서 `UserDetailsImpl` 직접 추출

### 3. 한국어 인코딩 (cp949)
- **문제**: 특수문자로 인한 인코딩 오류
- **해결**: `sanitize_text()` 함수로 특수문자 변환

### 4. AI 분석 타임아웃
- **문제**: LLM 응답 시간 초과
- **해결**: 비동기 처리 + 610초 타임아웃 설정

### 5. 캐시 무효화
- **문제**: prerender.io 캐시로 인한 구버전 노출
- **해결**: 배포 시 캐시 clear 프로세스 추가

---

## 향후 계획

- [ ] Google AdSense 광고 수익화
- [ ] 사용자 맞춤 뉴스 추천 알고리즘
- [ ] 실시간 알림 (WebSocket)
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 모바일 앱 (React Native)

---

## 프로젝트 링크

| 항목 | URL |
|------|-----|
| **라이브 서비스** | https://aharead.com |
| **Vercel 배포** | https://ai-article-web.vercel.app |

---

## 이력서 작성 예시

> **AI Article (아하리드)** - AI 기반 뉴스 분석 플랫폼
>
> - **역할**: 풀스택 개발 (1인 개발)
> - **기간**: 2026.01 ~ 2026.02 (2개월)
> - **기술**: Spring Boot, React, TypeScript, Python, FastAPI, LangChain, MariaDB, Docker
>
> **주요 성과**:
> - Spring Boot 3.5.6으로 50개+ REST API 설계 및 구현
> - React 18 + TypeScript로 반응형 UI 개발 (다크모드, 모바일 대응)
> - LangChain + Ollama 기반 RAG 파이프라인 구축 (요약, 키워드, AI 채팅)
> - Docker Compose + Vercel + Railway로 프로덕션 배포
> - Cloudflare Worker + prerender.io로 SPA SEO 최적화
> - AI 페어 프로그래밍으로 빠른 개발 (2개월 내 프로덕션 출시)

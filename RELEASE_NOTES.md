# Release Notes

AHAread 서비스의 변경 사항을 기록합니다.

---

## v0.5.0 (2026-03-09)

### 인프라
- **Railway 빌드 완전 안정화**: KOMORAN(JitPack) 의존성 제거로 빌드 실패 해결
- **Dockerfile 멀티스테이지 빌드**: eclipse-temurin:21-jdk-jammy → jre-jammy 분리

### 버그 수정
- `admin_job_run` 테이블 자동 생성 (`@PostConstruct`)
- `mvnw` Git 실행권한 누락 수정

---

## v0.4.0 (2026-03-06)

### 새로운 기능
- **이메일 구독 알림**: 관심 카테고리 기반 기사 3개를 매일 원하는 시간에 이메일로 발송
  - MyPage에서 구독 ON/OFF 및 발송 시간(06~22시) 설정 가능
  - Gmail SMTP 연동

### 버그 수정
- 열람 기록 404 버그 수정

---

## v0.3.0 (2026-03-04)

### SEO / AdSense
- `ads.txt` 추가 (Google AdSense 인증)
- About 페이지 추가 (`/about`) - AdSense 필수 페이지
- 동적 canonical 태그 적용 (Google 중복 색인 방지)
- SitemapController 성능 개선 (DB 필터링, HTTP 캐싱)
- 짧은 기사(100자 미만) 필터링

### 브랜딩
- 브랜드명 통일: AI Reader → **AHAread**
- 도메인 통일: `www.aharead.com` Primary 설정
- Google AdSense 재신청 (심사 중)

---

## v0.2.0 (2026-02-28)

### SEO 최적화
- 동적 Sitemap 구현 (`/sitemap.xml` → 백엔드 프록시, 208페이지 등록)
- Google Search Console, 네이버 서치어드바이저 등록
- Cloudflare Always Use HTTPS 활성화

---

## v0.2.0 (2026-02-06)

### 배포
- **Frontend**: Vercel 배포 완료 (https://ai-article-web.vercel.app)
- **Backend**: Railway 배포 완료
- **RAG AI**: 로컬 서버 + ngrok 터널 구성

### 새로운 기능
- **반응형 UI**: 모바일 햄버거 메뉴 추가, 768px 기준 레이아웃 전환
- **베타 테스트 배너**: 상단 고정 안내 배너

### 개선
- **영문 기사 필터링**: 한글이 없는 기사 자동 제외
- **저작권 문구 제거**: 기사 본문에서 저작권, 기자 이메일, 구독 유도 문구 자동 제거
- **SEO 최적화**: 메타 태그, Open Graph, sitemap.xml, robots.txt 추가
- **검색엔진 등록**: Google Search Console, 네이버 서치어드바이저 연동

### 버그 수정
- HuggingFaceEmbeddings 호환성 문제 해결 (encode → embed_query)

---

## v0.1.0 (2026-02-03)

### 새로운 기능
- **기사 분석 API**: URL 입력 → 실시간 크롤링 + AI 분석
- **북마크 기능**: 기사 저장/삭제, 마이페이지에서 목록 확인
- **관심 키워드**: 기사에서 키워드 등록, 홈에서 우선 노출

### 개선
- **단어 정의 형식 통일**: `{단어}은(는) ~이다` 형식
- **요약 마크다운 렌더링**: `**키워드**` → 파란색 볼드
- **키워드 중복 필터링**: 부분 문자열 중복 제거
- **이미지 크롤링**: og:image 또는 본문 이미지 추출

---

## v0.0.1 (2026-02-01)

### 초기 릴리즈
- Spring Boot 백엔드 구축
- React + TypeScript 프론트엔드 구축
- FastAPI RAG AI 엔진 구축
- Naver 뉴스 크롤러 구현
- Ollama + exaone3.5 LLM 연동
- MariaDB 데이터베이스 연동

---

## 기술 스택

| 구성요소 | 기술 |
|---------|------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | Spring Boot 3.5.6, Java 21 |
| AI Engine | FastAPI, LangChain, Ollama (exaone3.5) |
| Database | MariaDB 11.2 |
| Deployment | Vercel, Railway |

---

## 로드맵

### 완료
- [x] AI 채팅: 기사 맥락 기반 대화
- [x] 이메일 구독 알림
- [x] Google AdSense 신청 (심사 중)
- [x] SEO 최적화 (Sitemap, canonical, Search Console)

### 예정
- [ ] AdSense 승인 후 광고 배치
- [ ] 카카오톡 알림 (카카오 채널 API)
- [ ] 기사 추천 알고리즘 고도화
- [ ] 기사별 동적 메타태그 (og:title, og:description)
- [ ] 다크 모드
- [ ] 프로필 이미지 업로드

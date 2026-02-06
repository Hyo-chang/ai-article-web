# Release Notes

AI Reader 서비스의 변경 사항을 기록합니다.

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

### 예정된 기능
- [ ] AI 채팅: 기사 맥락 기반 대화
- [ ] 다크 모드
- [ ] 프로필 이미지 업로드
- [ ] 검색 고도화 (내용 검색)
- [ ] Google AdSense 적용

# Changelog

## [2026-02-03] - 기사 분석 API 및 북마크 기능 추가

### 새로운 기능

#### 백엔드

**기사 분석 API (`/api/articles/analyze`)**
- 기사 URL을 입력받아 실시간 크롤링 + AI 분석 수행
- Python 크롤러와 RAG AI 서버 연동
- 분석 결과(요약, 키워드, 단어 정의) 반환

**북마크 기능**
- `UserBookmark` 엔티티 및 `user_bookmark` 테이블 추가
- `UserBookmarkRepository` - 북마크 CRUD 쿼리
- `MyPageController`에 북마크 API 4개 추가:
  - `GET /api/mypage/bookmarks/ids` - 북마크된 기사 ID 목록
  - `GET /api/mypage/bookmarks` - 북마크 목록 (기사 정보 포함)
  - `POST /api/mypage/bookmarks` - 북마크 추가
  - `DELETE /api/mypage/bookmarks/{articleId}` - 북마크 삭제

**카테고리 키워드 조회 개선**
- `ExtractedKeywordV2Repository`에 카테고리별 키워드 조회 쿼리 추가
- `CategoryService` - 스냅샷 테이블 대신 extracted_keyword_v2에서 직접 조회

#### 프론트엔드

**분석하기 UI 개선**
- `ArticleInput.tsx` - 불필요한 탭 UI 제거, 간소화
- 분석 소요 시간 안내 문구 추가 ("실시간 AI 분석으로 1~2분 정도 소요")
- `App.tsx` - mock 데이터 제거, 실제 API 호출로 변경

**북마크 기능**
- `useBookmarks.ts` - 북마크 상태 관리 hook
- `BookmarkSection.tsx` - 마이페이지 북마크 목록 컴포넌트
- `ArticleCardList.tsx` - 모든 기사 카드에 하트 버튼 추가 (상위 3개 + 나머지 목록)
- `article_content.tsx` - 기사 상세 페이지 헤더에 하트 버튼 추가
- `MyPage.tsx` - 북마크 섹션 추가 (목록 조회, 삭제, 기사로 이동)

### 수정된 파일

**Backend (6개)**
- `ArticleSummaryController.java` - 분석 엔드포인트 추가
- `MyPageController.java` - 북마크 API 추가
- `ExtractedKeywordV2Repository.java` - 카테고리별 키워드 쿼리
- `CategoryService.java` - 키워드 조회 로직 변경
- `UserBookmark.java` (NEW) - 북마크 엔티티
- `UserBookmarkRepository.java` (NEW) - 북마크 레포지토리
- `application.properties` - ddl-auto=update로 변경 (테이블 자동 생성)

**Frontend (6개)**
- `App.tsx` - useBookmarks 연동, 실제 분석 API 호출
- `ArticleCardList.tsx` - 북마크 버튼 추가
- `ArticleInput.tsx` - UI 간소화
- `article_content.tsx` - 북마크 버튼 추가
- `MyPage.tsx` - 북마크 섹션 추가
- `useBookmarks.ts` (NEW) - 북마크 hook
- `BookmarkSection.tsx` (NEW) - 북마크 목록 컴포넌트

### 기술적 변경사항

- JPA ddl-auto를 `validate` → `update`로 변경하여 새 테이블 자동 생성
- 카테고리별 키워드 조회를 JPQL에서 Native Query로 변경 (조인 호환성)
- 프론트엔드 분석 API 호출 시 fetch 사용 (axios 대신)

# AI Reader 앱 개발 계획

## 개요
- **목표**: Google Play Store 앱 출시
- **방식**: Capacitor (React 웹앱 → 네이티브 앱 변환)
- **예상 기간**: 2-3주

---

## Phase 1: 사전 준비 (1-2일)

### 1.1 Google Play 개발자 계정 등록
- [ ] Google Play Console 가입 (https://play.google.com/console)
- [ ] 등록비 결제: $25 (약 33,000원, 1회성)
- [ ] 개발자 프로필 작성

### 1.2 앱 정보 준비
- [ ] 앱 이름: "AI Reader - 뉴스 AI 요약"
- [ ] 패키지명: `com.aharead.app` (또는 원하는 이름)
- [ ] 앱 설명 (한글/영문)
- [ ] 카테고리: 뉴스 & 잡지 또는 도구

### 1.3 필수 에셋 준비
| 항목 | 규격 | 설명 |
|------|------|------|
| 앱 아이콘 | 512x512 PNG | Play Store 표시용 |
| Feature Graphic | 1024x500 PNG | 스토어 상단 배너 |
| 스크린샷 | 최소 2장 | 폰 화면 캡처 |
| 개인정보처리방침 URL | - | https://aharead.com/privacy ✅ 있음 |

---

## Phase 2: Capacitor 설정 (1-2일)

### 2.1 Capacitor 설치
```bash
cd ai-article-front
npm install @capacitor/core @capacitor/cli
npx cap init "AI Reader" "com.aharead.app"
```

### 2.2 Android 플랫폼 추가
```bash
npm install @capacitor/android
npx cap add android
```

### 2.3 capacitor.config.ts 설정
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aharead.app',
  appName: 'AI Reader',
  webDir: 'dist',
  server: {
    // 프로덕션: 번들된 웹앱 사용
    // 개발: url: 'http://localhost:5173'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f1115",
    },
  },
};

export default config;
```

---

## Phase 3: 네이티브 기능 추가 (2-3일)

### 3.1 필수 플러그인 설치
```bash
# 상태바 제어
npm install @capacitor/status-bar

# 스플래시 화면
npm install @capacitor/splash-screen

# 푸시 알림 (선택)
npm install @capacitor/push-notifications

# 앱 업데이트 체크 (선택)
npm install @capawesome/capacitor-app-update
```

### 3.2 상태바 다크 테마 적용
```typescript
// App.tsx에 추가
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#0f1115' });
  }
}, []);
```

### 3.3 스플래시 화면 설정
- `android/app/src/main/res/` 에 스플래시 이미지 추가
- 다크 배경 + AI Reader 로고

### 3.4 딥링크 설정 (선택)
- `aharead.com/content/123` → 앱에서 바로 열기

---

## Phase 4: Android 빌드 (1-2일)

### 4.1 웹앱 빌드
```bash
npm run build
npx cap sync android
```

### 4.2 Android Studio에서 열기
```bash
npx cap open android
```

### 4.3 앱 아이콘 교체
- `android/app/src/main/res/mipmap-*` 폴더에 아이콘 추가
- Android Studio > Image Asset 도구 사용

### 4.4 서명 키 생성
```bash
keytool -genkey -v -keystore ai-reader.keystore -alias ai-reader -keyalg RSA -keysize 2048 -validity 10000
```
⚠️ **키스토어 파일 및 비밀번호 안전하게 백업 필수!**

### 4.5 릴리즈 빌드
- Android Studio > Build > Generate Signed Bundle / APK
- AAB(Android App Bundle) 형식 선택
- 서명 후 `app-release.aab` 생성

---

## Phase 5: Play Store 등록 (1-2일)

### 5.1 앱 생성
1. Play Console > 앱 만들기
2. 앱 이름, 기본 언어 설정
3. 앱 유형: 앱 (게임 아님)
4. 무료/유료: 무료

### 5.2 스토어 등록정보 작성
```
앱 이름: AI Reader - 뉴스 AI 요약
간단한 설명 (80자):
AI가 뉴스 기사를 분석하고 핵심만 3줄로 요약해드립니다.

자세한 설명 (4000자):
📰 AI Reader는 복잡한 뉴스 기사를 AI가 분석하여
핵심 내용을 빠르게 파악할 수 있게 도와주는 서비스입니다.

✨ 주요 기능
• AI 3줄 요약: 긴 기사도 핵심만 쏙쏙
• 키워드 추출: 트렌드 키워드 한눈에
• 단어 해설: 어려운 용어 쉽게 설명
• AI 질문: 기사 내용에 대해 AI에게 질문
• 북마크: 관심 기사 저장
• 커뮤니티: 다른 사용자와 정보 공유

🔒 개인정보 보호
최소한의 정보만 수집하며, 암호화하여 안전하게 보관합니다.

⚠️ 안내사항
AI 요약 결과는 참고용이며, 정확성을 보장하지 않습니다.
원문 기사 링크를 함께 제공합니다.
```

### 5.3 콘텐츠 등급 설문
- 폭력성: 없음
- 성적 콘텐츠: 없음
- 약물: 없음
- 언어: 경미함 (뉴스 특성상)
→ **예상 등급: 전체이용가 또는 12세 이상**

### 5.4 앱 콘텐츠 선언
- [ ] 개인정보처리방침 URL 입력
- [ ] 광고 포함 여부
- [ ] 뉴스 앱 여부 → "아니오" (분석 도구로 분류)
- [ ] 데이터 보안 양식 작성

### 5.5 AAB 업로드
1. 프로덕션 > 새 버전 만들기
2. app-release.aab 업로드
3. 버전 코드/이름 확인
4. 출시 노트 작성

### 5.6 심사 제출
- 검토 요청 클릭
- 심사 기간: 보통 1-3일 (최대 7일)

---

## Phase 6: 출시 후 (지속)

### 6.1 모니터링
- [ ] 크래시 리포트 확인 (Firebase Crashlytics)
- [ ] 사용자 리뷰 대응
- [ ] ANR (앱 응답 없음) 모니터링

### 6.2 업데이트 계획
- 버그 수정: 즉시
- 기능 추가: 월 1회
- 버전 코드 증가 필수

### 6.3 ASO (앱스토어 최적화)
- 키워드: AI, 뉴스, 요약, 기사, 분석
- 스크린샷 A/B 테스트
- 리뷰 요청 팝업 추가

---

## 일정 요약

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1주차 전반 | Phase 1-2: 준비 + Capacitor 설정 | 프로젝트 설정 완료 |
| 1주차 후반 | Phase 3: 네이티브 기능 | 앱 기본 동작 |
| 2주차 전반 | Phase 4: 빌드 + 테스트 | AAB 파일 |
| 2주차 후반 | Phase 5: 스토어 등록 | 심사 제출 |
| 3주차 | 심사 대기 + 수정 | **출시** 🎉 |

---

## 필요 비용

| 항목 | 비용 | 비고 |
|------|------|------|
| Google Play 개발자 | $25 (1회) | 필수 |
| Apple Developer (iOS) | $99/년 | 선택 |
| 디자인 에셋 | 0원 | 직접 제작 시 |
| Firebase | 무료 | 기본 플랜 |
| **총계** | **약 33,000원** | Android만 |

---

## 체크리스트

### 출시 전 필수 확인
- [ ] 앱 아이콘 준비됨
- [ ] 스크린샷 준비됨
- [ ] 개인정보처리방침 URL 작동
- [ ] 이용약관 URL 작동
- [ ] 원문 기사 링크 잘 표시됨 (저작권)
- [ ] 로그인/회원가입 정상 작동
- [ ] 오프라인 시 적절한 에러 메시지
- [ ] 뒤로가기 버튼 동작 확인

### 심사 통과 팁
1. **"뉴스 앱"이 아닌 "뉴스 분석 도구"로 설명**
2. **원문 링크 항상 제공**
3. **AI 결과는 참고용 면책 표시**
4. **사용자 콘텐츠(게시판) 신고 기능 고려**

---

## 다음 단계

1. Google Play 개발자 계정 등록
2. 앱 아이콘 디자인
3. Capacitor 설정 시작

계정 등록부터 시작할까요?

# --- 1단계: 빌드 환경 ---
# Node.js LTS(Long Term Support) 버전을 빌드 환경으로 사용합니다.
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 먼저 의존성 관련 파일만 복사하여 의존성을 설치합니다.
# 이렇게 하면 소스 코드 변경 시 매번 의존성을 새로 받지 않아 빌드 시간을 단축할 수 있습니다.
COPY package*.json ./
RUN npm install

# 전체 소스 코드를 복사합니다.
COPY . .

# 프로덕션용으로 프론트엔드 앱을 빌드합니다.
# 빌드가 완료되면 /app/dist 디렉토리에 정적 파일들이 생성됩니다.
RUN npm run build

# --- 2단계: 실행 환경 ---
# 빌드된 정적 파일들을 서비스하기 위한 가벼운 Nginx 웹서버 이미지를 사용합니다.
FROM nginx:1.27-alpine

# 빌드 단계(builder)의 /app/dist 디렉토리에 있는 결과물을
# Nginx 웹서버의 기본 HTML 서비스 디렉토리로 복사합니다.
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx는 기본적으로 80번 포트를 사용합니다.
EXPOSE 80

# 컨테이너가 시작될 때 Nginx를 실행합니다.
CMD ["nginx", "-g", "daemon off;"]
